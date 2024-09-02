const { group } = require('console');
const fs = require('fs');
const { initialEloRatings, updateElo, normalizeElo } = require('./modules/elo-rating');
const { groupPoints, updatePoints } = require('./modules/points');
// const { rankTeamsInGroup, calculateFinalRanking } = require('./modules/ranking');
const { generateRounds } = require('./modules/rounds');

const groups = JSON.parse(fs.readFileSync('data/groups.json', 'utf8'));
const exhibitions = JSON.parse(fs.readFileSync('data/exhibitions.json', 'utf8'));

for (const group in groups) {
    groups[group].forEach(team => {
        initialEloRatings[team.ISOCode] = normalizeElo(team.FIBARanking);
    });
}

for (const ex in exhibitions){
    exhibitions[ex].forEach(match => {
        updateElo(ex, match.Opponent, match.Result);
    });
}

const groupRounds = {};
for (const group in groups){
    groupRounds[group] = generateRounds(groups[group].map(team => team.ISOCode));
}


//#region ranking
const rankTeamsInGroup = (group) => {
    const teams = Object.values(groupPoints[group]);

    teams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        
        const tiedTeams = teams.filter(team => team.points === a.points);

        if (tiedTeams.length === 2) {
            return calculateMatchDifference(a, b);
        } 
        else if (tiedTeams.length > 2) {
            const rankedTeams = calculateCircleFormationRanking(tiedTeams, group);
            const indexA = rankedTeams.findIndex(d => d.team === a.name);
            const indexB = rankedTeams.findIndex(d => d.team === b.name);
            return indexA - indexB;
        }

    });
    return teams;
};

const calculateCircleFormationRanking = (tiedTeams, group) => {
    const differences = tiedTeams.map(team => {
        const otherTeams = tiedTeams.filter(t => t !== team);
        let totalDifference = 0;

        otherTeams.forEach(other => {
            const matchDiff = calculateMatchDifference(team, other, group);
            totalDifference += matchDiff;
        });

        return { team: team.name, diff: totalDifference };
    });

    differences.sort((x, y) => y.diff - x.diff);

    return differences;
};

const calculateMatchDifference = (a, b) =>{
    let matchResult = null;

    for (const round in simulatedResults[group]) {
        matchResult = simulatedResults[group][round].find(match =>
            match.teams.includes(a.name) && match.teams.includes(b.name)
        );
        if (matchResult) break;
    }

    if (matchResult) {            
        const [scoreA, scoreB] = matchResult.result.split(':').map(result => result === 'x' ? NaN : Number(result));

        if (isNaN(scoreA) || isNaN(scoreB)) {
            if (!isNaN(scoreA)) return -1; 
            if (!isNaN(scoreB)) return 1;  
        }

        if ((matchResult.teams.startsWith(a.name) && scoreA > scoreB) ||
            (matchResult.teams.startsWith(b.name) && scoreB > scoreA)) {
            return -1;
        } else {
            return 1;
        }
    }

    return 0;
}

const calculateFinalRanking = (groups) => {
    const topTeams = calculateGroupsOnPosition(0, groups);
    const secondPlaceTeams = calculateGroupsOnPosition(1, groups);
    const thirdPlaceTeams = calculateGroupsOnPosition(2, groups);

    
    const rankTeams = (teams) => {
        return teams.sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            if (a.pointsDifference !== b.pointsDifference) return b.pointsDifference - a.pointsDifference;
            return b.scoredPoints - a.scoredPoints;
        });
    };

    const rankedTopTeams = rankTeams(topTeams);
    const rankedSecondPlaceTeams = rankTeams(secondPlaceTeams);
    const rankedThirdPlaceTeams = rankTeams(thirdPlaceTeams);

    const finalRanking = [
        ...rankedTopTeams.slice(0, 3).map((team, index) => ({ name: team.name, finalRank: index + 1 })),
        ...rankedSecondPlaceTeams.slice(0, 3).map((team, index) => ({ name: team.name, finalRank: index + 4 })),
        ...rankedThirdPlaceTeams.slice(0, 3).map((team, index) => ({ name: team.name, finalRank: index + 7 }))
    ];

    finalRanking.sort((a, b) => a.finalRank - b.finalRank);

    return finalRanking;
};

const calculateGroupsOnPosition = (position, groups) => {
    const teams = [];
    for(const group in groups){
        teams.push(rankTeamsInGroup(group)[position]);
    }
    return teams;
}
//#endregion

//#region simulation
const simulateMatch = (group, teamA, teamB) => {
    const R_A = initialEloRatings[teamA];
    const R_B = initialEloRatings[teamB];

    const P_A = 1 / (1 + 10 ** ((R_B - R_A) / 400));
    const avgPoints = 80; 

    const randomFactorA = Math.random() * 0.2 - 0.1; 
    const randomFactorB = Math.random() * 0.2 - 0.1; 

    var pointsA = Math.round(avgPoints * (1 + 0.3 * (2 * P_A - 1))) + Math.round(avgPoints * randomFactorA);
    var pointsB = Math.round(avgPoints * (1 + 0.3 * (1 - 2 * P_A))) + Math.round(avgPoints * randomFactorB);

    const injuryImpact = Math.random() < 0.1 ? 0.2 : 0; // 10% šanse za povredu
    const adjustedPointsA = pointsA * (1 - injuryImpact);
    const adjustedPointsB = pointsB * (1 - injuryImpact);


    const forfeitProbability = Math.abs(P_A - (1 - P_A)) * 0.5;
    const durabilityFactor = 1 - Math.min(P_A, 1 - P_A); 
    const adjustedForfeitProbability = forfeitProbability * durabilityFactor;

    const randomFactor = Math.random();

    if (randomFactor < adjustedForfeitProbability) {
        if (P_A < 0.5) {
            pointsA = 'x';
        } else {
            pointsB = 'x'; 
        }
    }
    else {
        pointsA = Math.round(adjustedPointsA);
        pointsB = Math.round(adjustedPointsB);
    }

    
    updateElo(teamA, teamB, `${pointsA}-${pointsB}`);
    updatePoints(group, teamA, teamB, pointsA, pointsB);

    return `${pointsA}:${pointsB}`;
};

const simulatedResults = {};
for (const group in groupRounds) {
    simulatedResults[group] = groupRounds[group].reduce((acc, round, index) => {
        acc[`Kolo ${index + 1}`] = round.map(match => ({
            teams: `${match[0]} vs ${match[1]}`,
            result: simulateMatch(group, match[0], match[1]) 
        }));      
        return acc;
    }, {});
}
//#endregion

//#region display
const displaySimulatedResults = () => {
    console.log("Simulirani rezultati:");
    for(const r in simulatedResults){
        console.log(r);
        console.log(simulatedResults[r]);
    }
    console.log("\n");
};

const displayGroupPoints = () => {
    console.log("Tabela:");
    for(const g in groupPoints){
        console.log(g);
        console.log(groupPoints[g]);
    }
    console.log("\n");
};

const displayGroupStandings = () => {
    console.log("Konačan plasman u grupama:");
    for (const group in groupPoints) {
        const rankedTeams = rankTeamsInGroup(group);
        console.log(`Grupa ${group} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
        rankedTeams.forEach((team, index) => {
            console.log(`${index + 1}. ${team.name}  ${team.wins} / ${team.losses} / ${team.points} / ${team.scoredPoints} / ${team.concededPoints} / ${team.pointsDifference >= 0 ? '+' : ''}${team.pointsDifference}`);
        });
        console.log("\n");
    }
    console.log("\n");
};

const displayFinalStandings = () => {
    const finalRanking = calculateFinalRanking(groups);

    console.log("Konačan plasman:");
    console.log(finalRanking);
    console.log("\n");
};

//#endregion

displaySimulatedResults();

displayGroupStandings();
    
displayFinalStandings();
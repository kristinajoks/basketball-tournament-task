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
    finalRanking.pop();

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
    if(group != null)
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

//#region elimination
const assignTeamsToBuckets = (finalRanking) => {
    return {
        D: finalRanking.filter(team => team.finalRank === 1 || team.finalRank === 2).map(team => team.name),
        E: finalRanking.filter(team => team.finalRank === 3 || team.finalRank === 4).map(team => team.name),
        F: finalRanking.filter(team => team.finalRank === 5 || team.finalRank === 6).map(team => team.name),
        G: finalRanking.filter(team => team.finalRank === 7 || team.finalRank === 8).map(team => team.name),
    };
};

const teamsInSameGroup = (team1, team2, isoCodeGroups) => {
    return isoCodeGroups.some(group => group.includes(team1) && group.includes(team2));
};

const generateQuarterFinalPairs = (buckets, isoCodeGroups) => {
    const quarterFinalPairs = [];

    const drawPair = (teams1, teams2) => {
        let team1, team2;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            if (attempts > maxAttempts) {
                console.log("Nije moguće formirati parove bez duplih mečeva u grupnoj fazi.");
                return null; 
            }

            team1 = teams1[Math.floor(Math.random() * teams1.length)];
            team2 = teams2[Math.floor(Math.random() * teams2.length)];
            attempts++;
        } while (teamsInSameGroup(team1, team2, isoCodeGroups));
        
        teams1 = teams1.filter(team => team !== team1);
        teams2 = teams2.filter(team => team !== team2);

        quarterFinalPairs.push([team1, team2]);

        return { teams1, teams2 };
    };

    let D = [...buckets.D];
    let G = [...buckets.G];
    let E = [...buckets.E];
    let F = [...buckets.F];

    while (D.length > 0 && G.length > 0) {
        const result = drawPair(D, G);
        if (!result) return null;
        D = result.teams1;
        G = result.teams2;
    }

    while (E.length > 0 && F.length > 0) {
        const result = drawPair(E, F);
        if (!result) return null;
        E = result.teams1;
        F = result.teams2;
    }

    return quarterFinalPairs;
};

const generateSemiFinalPairs = (quarterFinalPairs) => {
    if (!quarterFinalPairs) return null;

    const semiFinalPairs = [];
    
    const half = Math.ceil(quarterFinalPairs.length / 2);
    const firstHalf = quarterFinalPairs.slice(0, half);
    const secondHalf = quarterFinalPairs.slice(half);

    while (firstHalf.length > 0 && secondHalf.length > 0) {
        const qfPair1 = firstHalf.splice(Math.floor(Math.random() * firstHalf.length), 1)[0];
        const qfPair2 = secondHalf.splice(Math.floor(Math.random() * secondHalf.length), 1)[0];
        semiFinalPairs.push([qfPair1, qfPair2]);
    }

    return semiFinalPairs;
};

const displayEliminationPhase = (quarterFinalPairs, semiFinalPairs) => {
    if (!quarterFinalPairs || !semiFinalPairs) return;

    console.log("Eliminaciona faza:");
    
    quarterFinalPairs.forEach((pair, index) => {
        console.log(`Četvrtfinale ${index + 1}: ${pair[0]} - ${pair[1]}`);
    });

    console.log("\nPolufinale:");
    semiFinalPairs.forEach((pair, index) => {
        console.log(`Polufinale ${index + 1}: Pobednik meča (${pair[0][0]} - ${pair[0][1]}) vs Pobednik meča (${pair[1][0]} - ${pair[1][1]})`);
    });

    console.log("\n");
};

const simulateEliminationMatch = (teamA, teamB) => {
    const result = simulateMatch(null, teamA, teamB);
    console.log(`${teamA} - ${teamB} (${result})`);
    const [scoreA, scoreB] = result.split(':').map(Number);
    
    return scoreA > scoreB ? teamA : teamB;
};

const simulateEliminationRound = (pairs) => {
    const winners = [];
    pairs.forEach(pair => {
        const winner = simulateEliminationMatch(pair[0], pair[1]);
        winners.push(winner);
    });
    return winners;
};

const simulateTournament = (quarterFinalPairs) => {
    if (!quarterFinalPairs) return null;

    console.log("Četvrtfinale:");
    const semiFinalists = simulateEliminationRound(quarterFinalPairs);

    const semiFinalPairs = [
        [semiFinalists[0], semiFinalists[1]],
        [semiFinalists[2], semiFinalists[3]],
    ];

    console.log(semiFinalPairs);

    console.log("\nPolufinale:");
    const finalists = simulateEliminationRound(semiFinalPairs);

    console.log("\nUtakmica za treće mesto:");
    const bronzeMatchPair = semiFinalists.filter(team => !finalists.includes(team));
    const bronzeMedalist = simulateEliminationMatch(bronzeMatchPair[0], bronzeMatchPair[1]);

    console.log("\nFinale:");
    const goldMedalist = simulateEliminationMatch(finalists[0], finalists[1]);
    const silverMedalist = finalists.find(team => team !== goldMedalist);

    console.log("\nMedalje:");
    console.log(`1. ${goldMedalist}`);
    console.log(`2. ${silverMedalist}`);
    console.log(`3. ${bronzeMedalist}`);
};

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

const extractISOCodeGroups = (groups) => {
    return Object.keys(groups).map(group => 
        groups[group].map(team => team.ISOCode)  
    );
};
const isoCodeGroups = extractISOCodeGroups(groups);

const finalRanking = calculateFinalRanking(groups);
const buckets = assignTeamsToBuckets(finalRanking);

console.log("Šeširi:");
console.log(buckets);

const quarterFinalPairs = generateQuarterFinalPairs(buckets, isoCodeGroups);
const semiFinalPairs = generateSemiFinalPairs(quarterFinalPairs);

displayEliminationPhase(quarterFinalPairs, semiFinalPairs);

// Simulacija eliminacione faze
simulateTournament(quarterFinalPairs);
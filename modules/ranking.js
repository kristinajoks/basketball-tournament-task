const { groupPoints } = require('./points');

const rankTeamsInGroup = (group, simulatedResults) => {
    const teams = Object.values(groupPoints[group]);

    teams.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;

        const tiedTeams = teams.filter(team => team.points === a.points);

        if (tiedTeams.length === 2) {
            return calculateMatchDifference(a, b, simulatedResults, group);
        } 
        else if (tiedTeams.length > 2) {
            const rankedTeams = calculateCircleFormationRanking(tiedTeams, simulatedResults, group);
            const indexA = rankedTeams.findIndex(d => d.team === a.name);
            const indexB = rankedTeams.findIndex(d => d.team === b.name);
            return indexA - indexB;
        }
    });
    return teams;
};

const calculateCircleFormationRanking = (tiedTeams, simulatedResults, group) => {
    const differences = tiedTeams.map(team => {
        const otherTeams = tiedTeams.filter(t => t !== team);
        let totalDifference = 0;

        otherTeams.forEach(other => {
            const matchDiff = calculateMatchDifference(team, other, simulatedResults, group);
            totalDifference += matchDiff;
        });

        return { team: team.name, diff: totalDifference };
    });

    differences.sort((x, y) => y.diff - x.diff);

    return differences;
};

const calculateMatchDifference = (a, b, simulatedResults, group) => {
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
};

const calculateFinalRanking = (groups, simulatedResults) => {
    const topTeams = calculateGroupsOnPosition(0, groups, simulatedResults);
    const secondPlaceTeams = calculateGroupsOnPosition(1, groups, simulatedResults);
    const thirdPlaceTeams = calculateGroupsOnPosition(2, groups, simulatedResults);

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

const calculateGroupsOnPosition = (position, groups, simulatedResults) => {
    const teams = [];
    for(const group in groups){
        teams.push(rankTeamsInGroup(group, simulatedResults)[position]);
    }
    return teams;
};

module.exports = {
    rankTeamsInGroup,
    calculateFinalRanking
};

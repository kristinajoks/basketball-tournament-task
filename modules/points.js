const groupPoints = {};

const updatePoints = (group, teamA, teamB, pointsA, pointsB) => {
    initializeTeamStats(group, teamA);
    initializeTeamStats(group, teamB);

    const forfeitedTeam = pointsA === 'x' ? teamA : pointsB === 'x' ? teamB : null;
    if (forfeitedTeam) {
        const teamWon = teamA === forfeitedTeam ? teamB : teamA;
        const avgPoints = 80;
        updateForfeit(group, teamWon, forfeitedTeam, avgPoints);
        
        return;
    }

    if(pointsA > pointsB)
        updateRegular(group, teamA, teamB, pointsA, pointsB)
    else
        updateRegular(group, teamB, teamA, pointsB, pointsA)

    return;
};

const initializeTeamStats = (group, team) => {
    if(!groupPoints[group]){
        groupPoints[group] = [];
    }
    if (!groupPoints[group][team]) {
        groupPoints[group][team] = {
            name: team,
            wins: 0,
            losses: 0,
            points: 0,
            scoredPoints: 0,
            concededPoints: 0,
            pointsDifference: 0
        };
    }
};

const updateForfeit = (group, teamWon, teamLost, avgPoints) => {
    groupPoints[group][teamWon].wins += 1;
    groupPoints[group][teamWon].points += 2;
    groupPoints[group][teamWon].scoredPoints += avgPoints;
    groupPoints[group][teamWon].pointsDifference += avgPoints; 

    groupPoints[group][teamLost].losses += 1;
    groupPoints[group][teamLost].concededPoints += avgPoints; 
    groupPoints[group][teamLost].pointsDifference -= avgPoints;

    return;
};

const updateRegular = (group, teamWon, teamLost, pointsWon, pointsLost) => {
    groupPoints[group][teamWon].wins += 1;
    groupPoints[group][teamWon].points += 2;
    groupPoints[group][teamWon].scoredPoints += pointsWon;
    groupPoints[group][teamWon].concededPoints += pointsLost;
    groupPoints[group][teamWon].pointsDifference += pointsWon - pointsLost;

    groupPoints[group][teamLost].losses += 1;
    groupPoints[group][teamLost].points += 1;
    groupPoints[group][teamLost].scoredPoints += pointsLost;
    groupPoints[group][teamLost].concededPoints += pointsWon;
    groupPoints[group][teamLost].pointsDifference += pointsLost - pointsWon;

    return;
};

module.exports = {
    groupPoints,
    updatePoints
};
const {initialEloRatings, updateElo} = require('./elo-rating.js');
const {updatePoints} = require('./points.js');

const simulateMatch = (group, teamA, teamB) => {
    const R_A = initialEloRatings[teamA];
    const R_B = initialEloRatings[teamB];

    const P_A = 1 / (1 + 10 ** ((R_B - R_A) / 400));
    const avgPoints = 80; 

    const randomFactorA = Math.random() * 0.2 - 0.1; 
    const randomFactorB = Math.random() * 0.2 - 0.1; 

    var pointsA = Math.round(avgPoints * (1 + 0.3 * (2 * P_A - 1))) + Math.round(avgPoints * randomFactorA);
    var pointsB = Math.round(avgPoints * (1 + 0.3 * (1 - 2 * P_A))) + Math.round(avgPoints * randomFactorB);

    const injuryImpact = Math.random() < 0.1 ? 0.2 : 0; 
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

const simulateGroupRounds = (groupRounds) => {
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

    return simulatedResults;
};

module.exports = {
    simulateMatch,
    simulateGroupRounds
};
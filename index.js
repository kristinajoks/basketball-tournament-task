const { initialEloRatings, updateElo, normalizeElo } = require('./modules/elo-rating');
const { calculateFinalRanking} = require('./modules/ranking');
const { generateRoundsForGroups } = require('./modules/rounds');
const { simulateGroupRounds } = require('./modules/simulation');
const { assignTeamsToBuckets, generateQuarterFinalPairs, generateSemiFinalPairs, displayEliminationPhase, simulateTournament } = require('./modules/elimination');
const { displaySimulatedResults, displayGroupStandings, displayFinalStandings } = require('./modules/display');
const {loadGroups, loadExhibitions} = require('./modules/data-loader');

const groups = loadGroups();
const exhibitions = loadExhibitions();

const initializeEloRatings = (groups) => {
    for (const group in groups) {
        groups[group].forEach(team => {
            initialEloRatings[team.ISOCode] = normalizeElo(team.FIBARanking);
        });
    }
};

const processExhibitions = (exhibitions) => {
    for (const ex in exhibitions){
        exhibitions[ex].forEach(match => {
            updateElo(ex, match.Opponent, match.Result);
        });
    }
};

initializeEloRatings(groups);
processExhibitions(exhibitions);

const groupRounds = generateRoundsForGroups(groups);
const simulatedResults = simulateGroupRounds(groupRounds);

displaySimulatedResults(simulatedResults);
displayGroupStandings(groups, simulatedResults);

const finalRanking = calculateFinalRanking(groups, simulatedResults);
displayFinalStandings(finalRanking);

const { isoCodeGroups, buckets } = prepareEliminationPhase(groups, finalRanking, assignTeamsToBuckets);
const quarterFinalPairs = generateQuarterFinalPairs(buckets, isoCodeGroups);
const semiFinalPairs = generateSemiFinalPairs(quarterFinalPairs);

displayEliminationPhase(quarterFinalPairs, semiFinalPairs);

simulateTournament(quarterFinalPairs);
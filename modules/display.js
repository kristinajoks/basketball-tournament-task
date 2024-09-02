const { rankTeamsInGroup } = require('./ranking');

const displaySimulatedResults = (simulatedResults) => {
    console.log("Simulirani rezultati:");
    for(const r in simulatedResults){
        console.log(r);
        console.log(simulatedResults[r]);
    }
    console.log("\n");
};

const displayGroupPoints = (groupPoints) => {
    console.log("Tabela:");
    for(const g in groupPoints){
        console.log(g);
        console.log(groupPoints[g]);
    }
    console.log("\n");
};

const displayGroupStandings = (groups, simulatedResults) => {
    console.log("Konačan plasman u grupama:");
    for (const group in groups) {
        const rankedTeams = rankTeamsInGroup(group, simulatedResults);
        console.log(`Grupa ${group} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
        rankedTeams.forEach((team, index) => {
            console.log(`${index + 1}. ${team.name}  ${team.wins} / ${team.losses} / ${team.points} / ${team.scoredPoints} / ${team.concededPoints} / ${team.pointsDifference >= 0 ? '+' : ''}${team.pointsDifference}`);
        });
        console.log("\n");
    }
    console.log("\n");
};

const displayFinalStandings = (finalRanking) => {
    console.log("Konačan plasman:");
    console.log(finalRanking);
    console.log("\n");
};

module.exports = {
    displaySimulatedResults,
    displayGroupPoints,
    displayGroupStandings,
    displayFinalStandings,
};

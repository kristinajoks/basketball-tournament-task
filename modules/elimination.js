const { simulateMatch } = require('./simulation');

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

module.exports = {
    assignTeamsToBuckets,
    generateQuarterFinalPairs,
    generateSemiFinalPairs,
    displayEliminationPhase,
    simulateTournament
};
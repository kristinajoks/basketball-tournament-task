const generateRounds = (teamsInGroup) => {
    const rounds = [];
    const teams = [...teamsInGroup];

    if (teams.length % 2 !== 0) teams.push(null);

    const numRounds = teams.length - 1;
    const numMatchesPerRound = teams.length / 2;

    for (let i = 0; i < numRounds; i++){
        const matches = [];
        for (let j = 0; j < numMatchesPerRound; j++){
            const teamA = teams[j];
            const teamB = teams[teams.length - 1 - j];

            if (teamA && teamB)
                matches.push([teamA, teamB]);            
        }
        rounds.push(matches);
        teams.splice(1, 0, teams.pop());
    }
    return rounds;
}


const generateRoundsForGroups = (groups) => {
    const groupRounds = {};
    for (const group in groups) {
        groupRounds[group] = generateRounds(groups[group].map(team => team.ISOCode));
    }
    return groupRounds;
};

module.exports = {
    generateRounds,
    generateRoundsForGroups
};
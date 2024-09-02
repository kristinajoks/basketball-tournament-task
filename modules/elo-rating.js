
const normalizeElo = (fibaRank) => {
    const maxElo = 2400;
    const minElo = 1000;
    const range = maxElo - minElo;
    return (maxElo - ((fibaRank - 1) * range) / 159) ; //.toFixed(2);
};

const initialEloRatings = {};

const k = 30;
const defaultEloRating = 2000;

const updateElo = (teamA, teamB, result) => {
    const [scoreA, scoreB] = result.split('-').map(Number);
    const R_A = initialEloRatings[teamA] || defaultEloRating;
    const R_B = initialEloRatings[teamB] || defaultEloRating;

    const E_A = 1 / (1 + 10 ** ((R_B - R_A) / 400));
    const S_A = scoreA > scoreB ? 1 : 0 ;

    if(!isNaN(initialEloRatings[teamA]))
        initialEloRatings[teamA] += k * (S_A - E_A);

    if(!isNaN(initialEloRatings[teamB]))
        initialEloRatings[teamB] += k * ((1 - S_A) - (1 - E_A));
};

module.exports = {
    normalizeElo,
    updateElo,
    initialEloRatings
};
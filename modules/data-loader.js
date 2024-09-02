const fs = require('fs');

const loadGroups = () => {
    const groups = JSON.parse(fs.readFileSync('./data/groups.json'));
    return groups;
}

const loadExhibitions = () => {
    const exhibitions = JSON.parse(fs.readFileSync('./data/exhibitions.json'));
    return exhibitions;
}

module.exports = {
    loadGroups,
    loadExhibitions,
};
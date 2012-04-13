exports.getTechs = function() {

    return {
        'man.md': require.resolve('./techs/man.md.js'),
        'man': require.resolve('./techs/man.js')
    };

};

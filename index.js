var path = require('path'),
    config = require('./lib/get-config');

var bem = require('coa').Cmd()
    .name(process.argv[1])
    .title(['Tools to work with files written using the BEM methodology.', '' +
        'See https://bem.info for more info.'].join('\n'))
    .helpful()
    .opt()
        .name('version').title('Version')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            return require('../package.json').version;
        })
        .end();

config.plugins.forEach(function(plugin) {
    if (typeof plugin === 'string') {
        plugin = {
            name: plugin,
            path: require.resolve('bem-tools-' + plugin)
        };
    }

    if (!plugin.name) {
        plugin.name = require(plugin.path).name;
    }

    bem.cmd().name(plugin.name).apply(require(plugin.path)).end();
});

bem.cmd().name('install').apply(require('./commands/install')).end();

bem.run(process.argv.slice(2));

module.exports = bem;

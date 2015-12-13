var path = require('path'),
    bemConf = require('bem-config');

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

bemConf().extended.plugins.forEach(function(plugin) {
    if (typeof plugin === 'string') {
        plugin = {
            name: plugin,
            path: require.resolve(path.join('bem-tools-' + plugin, 'cli'))
        };
    }

    if (!plugin.name) {
        plugin.name = require(plugin.path).name;
    }

    bem.cmd().name(plugin.name).apply(require(plugin.path)).end();
});

['install', 'uninstall'].forEach(function(cmd) {
    bem.cmd().name(cmd).apply(require('./commands/' + cmd)).end();
});

bem.act(function(opts, args) {
    if (!Object.keys(opts).length && !Object.keys(args).length) {
        return this.usage();
    }
})

bem.run(process.argv.slice(2));

module.exports = bem;

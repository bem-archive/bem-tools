var path = require('path'),
    bemConf = require('bem-config');

var bem = require('coa').Cmd()
    .name(process.argv[1])
    .title(['Tools to work with files written using the BEM methodology.', '' +
        'See https://bem.info for more info.', ''].join('\n'))
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

var config = bemConf().extended;
config.plugins || (config.plugins = []);

config.plugins.forEach(function(plugin) {
    if (typeof plugin === 'string') {
        try {
            plugin = {
                name: plugin,
                path: require.resolve(path.join('bem-tools-' + plugin, 'cli'))
            };
        } catch(err) {
            console.log(err);
            console.error('WARN: Plugin `' + plugin + '` not found');
            return;
        }
    }

    if (plugin.path.indexOf('cli.js') < 0) {
        plugin.path = path.join(plugin.path, 'cli');
    }

    var pluginModule;

    try {
        pluginModule = require(plugin.path);
    } catch(err) {
        console.error('WARN: Plugin `' + plugin.name + '` not found');
        return;
    }

    bem.cmd().name(plugin.name).apply(pluginModule).end();
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

const PLUGIN_PREFIX = 'bem-tools-';

var path = require('path'),
    npmls = require('npmls'),
    uniq = require('lodash').uniq;

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
            return require('./package').version;
        })
        .end();

var globalModules = [],
    localModules = [];

try {
    globalModules = npmls(true);
} catch (err) {
    if (err.code !== 'ENOENT') throw new Error(err);
}

try {
    localModules = npmls();
} catch (err) {
    if (err.code !== 'ENOENT') throw new Error(err);
}

var plugins = uniq(globalModules.concat(localModules).filter(function(module) {
    return module.indexOf(PLUGIN_PREFIX) === 0;
}));

plugins.forEach(function(plugin) {
    var commandName = plugin.replace(PLUGIN_PREFIX, '');

    try {
        var pluginModule = require(path.join(plugin, 'cli'));
        bem.cmd().name(commandName).apply(pluginModule).end();
    } catch (err) {
        console.error(err);
    }
});

bem.act(function(opts, args) {
    if (!Object.keys(opts).length && !Object.keys(args).length) {
        return this.usage();
    }
});

bem.run(process.argv.slice(2));

module.exports = bem;

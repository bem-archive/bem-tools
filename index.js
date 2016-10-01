var PLUGIN_PREFIX = 'bem-tools-';

var fs = require('fs'),
    path = require('path'),
    npmls = require('npmls'),
    npmRootPath = require('global-modules'),
    uniq = require('lodash.uniq');

var bem = require('coa').Cmd()
    .name(process.argv[1])
    .title(['BEM plugins CLI runned.', '' +
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

var plugins = uniq(localModules.concat(globalModules).filter(function(module) {
    return module.indexOf(PLUGIN_PREFIX) === 0;
}));

plugins.forEach(function(plugin) {
    var commandName = plugin.replace(PLUGIN_PREFIX, ''),
        localPluginDir = path.join('node_modules', plugin),
        globalPluginDir = path.join(npmRootPath, plugin);
        pluginPath = path.resolve(path.join(fs.existsSync(localPluginDir) ? localPluginDir: globalPluginDir, 'cli')),
        pluginModule = null;
    try {
        pluginModule = require(pluginPath);
    } catch(err) {
        throw new Error('Cannot find module', plugin);
    }

    pluginModule && bem.cmd().name(commandName).apply(pluginModule).end();
});

bem.act(function(opts, args) {
    if (!Object.keys(opts).length && !Object.keys(args).length) {
        return this.usage();
    }
});

bem.run(process.argv.slice(2));

module.exports = bem;

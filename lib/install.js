var path = require('path'),
    npm = require('npm'),
    bemConf = require('bem-config'),
    tilde = require('os-homedir')(),
    pluginPrefix = 'bem-tools-';

function runNpmCommand(npmCommand, pluginName, cb) {
    npm.load({}, function (err) {
        if (err) return cb(err);

        var basename = path.basename(pluginName),
            moduleName = pluginName.replace(new RegExp(basename + '$'), pluginPrefix + basename);

        npm.commands[npmCommand](tilde, [moduleName], function(err, data) {
            if (err) return cb(err);

            cb(null, data);
        });
    });
};

function registerPlugin(pluginInfo) {
    var config = bemConf().global;
    config.plugins || (config.plugins = []);

    // TODO: support pluginInfo as objects
    config.plugins.indexOf(pluginInfo) < 0 && config.plugins.push(pluginInfo);
    bemConf.writeGlobalConfig(config);
}

function unregisterPlugin(pluginInfo) {
    var config = bemConf().global;
    if (!config.plugins || !config.plugins.length) return;

    // TODO: support pluginInfo as objects
    config.plugins.splice(config.plugins.indexOf(pluginInfo), 1);
    bemConf.writeGlobalConfig(config);
}

function installPlugin(name) {
    runNpmCommand('install', name, function(err, data) {
        // TODO: reject
        if (err) return console.error(err);

        registerPlugin(name.indexOf('/') < 0 ?
            name : {
                name: path.basename(name).replace(pluginPrefix, ''),
                path: name
            });
    });
}

function uninstallPlugin(name) {
    runNpmCommand('uninstall', name, function(err, data) {
        // TODO: reject
        if (err) return console.error(err);

        unregisterPlugin(name.indexOf('/') < 0 ?
            name : {
                name: path.basename(name).replace(pluginPrefix, ''),
                path: name
            });
    });
}

module.exports = {
    install: installPlugin,
    uninstall: uninstallPlugin
};

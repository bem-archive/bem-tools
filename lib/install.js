var path = require('path'),
    npm = require('npm'),
    bemConf = require('bem-config'),
    tilde = require('os-homedir')(),
    pluginPrefix = 'bem-tools-';

function runNpmCommand(npmCommand, pluginName, cb) {
    npm.load({ cwd: tilde }, function (err) {
        if (err) return cb(err);

        var basename = path.basename(pluginName),
            moduleName = pluginName;

        if (moduleName.indexOf(pluginPrefix) < 0) {
            moduleName = pluginName.replace(new RegExp(basename + '$'), pluginPrefix + basename);
        }

        npm.commands[npmCommand]([moduleName], function(err, data) {
            if (err) return cb(err);

            cb(null, data);
        });
    });
};

function registerPlugin(name) {
    var config = bemConf().global;
    config.plugins || (config.plugins = []);

    config.plugins.indexOf(name) < 0 && config.plugins.push(name);
    bemConf.writeGlobalConfig(config);
}

function unregisterPlugin(name) {
    var config = bemConf().global;
    if (!config.plugins || !config.plugins.length) return;

    config.plugins.splice(config.plugins.indexOf(name), 1);
    bemConf.writeGlobalConfig(config);
}

function normalizePluginName(name) {
    return name.indexOf('/') < 0 ? name : path.basename(name).replace(pluginPrefix, '');
}

function installPlugin(name) {
    runNpmCommand('install', name, function(err, data) {
        // TODO: reject
        if (err) return console.error(err);

        registerPlugin(normalizePluginName(name));
    });
}

function uninstallPlugin(name) {
    runNpmCommand('uninstall', name, function(err, data) {
        // TODO: reject
        if (err) return console.error(err);

        unregisterPlugin(normalizePluginName(name));
    });
}

module.exports = {
    install: installPlugin,
    uninstall: uninstallPlugin
};

var fs = require('fs'),
    path = require('path'),
    tilde = require('os-homedir')(),
    pathToConfig = path.join(tilde, '.bem', 'config.json'),
    config = {};

module.exports = {
    read: function read() {
        try {
            config = require(pathToConfig);
        } catch(e) {}

        return config;
    },

    write: function write(data) {
        fs.writeFileSync(pathToConfig, JSON.stringify(data, null, 2));
    },

    installPlugin: function installPlugin(data) {
        var config = this.read();
        config.plugins || (config.plugins = []);

        // TODO: support data as objects
        config.plugins.indexOf(data) < 0 && config.plugins.push(data);
        this.write(config);
    },

    uninstallPlugin: function uninstallPlugin() {
        // TODO
    }
};

var npm = require('npm'),
    tilde = require('os-homedir')();

module.exports = function(pluginName, cb) {
    npm.load({}, function (err) {
        if (err) return cb(err);

        npm.commands.install(tilde, [pluginName.indexOf('/') < 0 ? 'bem-tools-' + pluginName : pluginName], function(err, data) {
            if (err) return cb(err);

            cb(null, data);
        });
    });
};

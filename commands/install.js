var install = require('../lib/install'),
    extendConfig = require('../lib/extend-config');

module.exports = function() {
    this
        .title('Install a plugin').helpful()
        .arg()
            .name('name').title('Name')
            .end()
        .act(function(opts, args) {
            var self = this,
                name = args.name;

            install(name, function(err, data) {
                // TODO: reject
                if (err) return console.log(err);

                extendConfig.installPlugin(name.indexOf('/') < 0 ?
                    name : {
                        name: name.replace(/\/$/, '').split('/').pop().replace(/^bem-tools-/, ''),
                        path: name
                    });
            });
        })
        .end();
};

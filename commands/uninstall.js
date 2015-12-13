var install = require('../lib/install');

module.exports = function() {
    this
        .title('Uninstall a plugin').helpful()
        .arg()
            .name('name').title('Name')
            .end()
        .act(function(opts, args) {
            install.uninstall(args.name);
        })
    .end();
};

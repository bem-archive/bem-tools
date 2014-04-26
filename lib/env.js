
var BEMENV = 'bem-env';
module.exports = process[BEMENV] = process[BEMENV] || (function () {
    'use strict';

    var dataset = Object.create(null);

    // basic functionality
    var storage = {};
    storage.setEnv = function(name, value) {
        dataset[name] = value;
    };
    storage.getEnv = function(name) {
        return dataset[name];
    };
    storage.keys = function () {
        return Object.keys(dataset);
    };

    // share env to fork
    storage.share = function (child) {
        if (!child.connected) return false;
        // init child's env
        child.send({ type: BEMENV + '-init', data: dataset });
    };

    // fork mode only
    process.connected && (function () {
        var initialized = false;
        storage.fork = function (cb) {
            if (initialized) {
                cb && cb(module.exports);
                return module.exports;
            }
            var onInit;
            process.on('message', function onInit (e) {
                if (!(e && e.type === BEMENV + '-init')) return;
                // stop listening init
                process.removeListener('message', onInit);
                // set initial data
                Object.keys(e.data).forEach(function (k) {
                    storage.setEnv(k, e.data[k]);
                });
                initialized = true;
                cb && cb(module.exports);
            });
            process.on('disconnect', function () {
                process.removeListener('message', onInit);
            });
            return module.exports;
        };
    }());

    return Object.seal(Object.create(storage));
}());

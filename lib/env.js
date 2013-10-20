
var BEMENV = 'bem-env';
module.exports = process[BEMENV] = process[BEMENV] || (function () {
    'use strict';

    var dataset = Object.create(null);

    // we need to hold all children to share them bem-env-set event
    var children = [];
    function childrenSetEnv (name, value) {
        // forward set event to children
        children.forEach(function (child) {
            if (child.connected) {
                child.send({type: 'bem-env-set', name: name, value: value});
            }
        });
    }

    // basic functionality
    var storage = {};
    storage.setEnv = function(name, value) {
        dataset[name] = value;
        children.length && childrenSetEnv(name, value);
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
        child.send({ type: 'bem-env-init', data: dataset });
        // store child to forward new actions
        children.push(child);
        // prevent forwarding to dead children
        child.on('disconnect', function () {
            delete children[children.indexOf(child)];
        });
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
                if (!(e && e.type === 'bem-env-init')) return;
                // replace init event with onMessage
                process.on('message', onSet);
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
                process.removeListener('message', onSet);
            });
            return module.exports;
        };
        // keep synced to parent
        function onSet (e) {
            if (!(e && e.type === 'bem-env-set')) return;
            storage.setEnv(e.name, e.value);
        }
    }());

    return Object.seal(Object.create(storage));
}());

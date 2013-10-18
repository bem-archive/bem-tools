
module.exports = process.BEMENV = process.BEMENV || (function () {
    'use strict';

    var dataset = Object.create(null);

    var storage = {};
    storage.setEnv = function(name, value) {
        dataset[name] = value;
    };
    storage.getEnv = function(name) {
        return dataset[name];
    };

    return Object.seal(Object.create(storage));
}());

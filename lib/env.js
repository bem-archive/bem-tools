'use strict';

var env = {};

exports.setEnv = function(name, value) {
    env[name] = value;
};

exports.getEnv = function(name) {
    return env[name];
};

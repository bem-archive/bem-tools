var path = require('path'),
    util = require('util'),
    tilde = require('os-homedir')(),
    currentPath = process.cwd(),
    globalConfig = {},
    localConfig = {},
    config;

try {
    globalConfig = require(path.join(tilde, '.bem', 'config'));
} catch(e) {}


while (currentPath !== path.sep) {
    try {
        localConfig = require(path.join(currentPath, '.bem', 'config'));
        break;
    } catch(e) {
        currentPath = path.resolve(path.join(currentPath, '..'));
    };
}

config = util._extend(globalConfig, localConfig);
config.plugins || (config.plugins = []);

module.exports = config;

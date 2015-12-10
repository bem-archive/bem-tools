var path = require('path'),
    util = require('util'),
    tilde = require('os-homedir')(),
    currentPath = process.cwd(),
    globalConfig = {},
    config = {};

try {
    globalConfig = require(path.join(tilde, '.bem', 'config'));
} catch(e) {}


while (currentPath !== path.sep) {
    try {
        config = require(path.join(currentPath, '.bem', 'config'));
        break;
    } catch(e) {
        currentPath = path.resolve(path.join(currentPath, '..'));
    };
}

module.exports = util._extend(globalConfig, config);

var Q = require('q'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech,
    U = require('../util'),
    PATH = require('path'),

    DEFAULT_LANGS = ['ru', 'en'];

exports.Tech = INHERIT(Tech, {

    getLangs: function() {
        var env = process.env.BEM_I18N_LANGS;
        return env? env.split(' ') : DEFAULT_LANGS;
    },

    getSuffixes: function() {

        return this.getLangs().map(function(lang) {
            return [this.getTechName(), lang + '.json.js'].join('/');
        }, this);

    },

    getBuildResult: function(prefixes, suffix, outputDir, outputName) {

        var _this = this;
        return Q.when(this.filterPrefixes(prefixes, [suffix]), function(paths) {

            return paths.reduce(function(decl, path) {

                return Q.all([decl, _this.readContent(path, suffix)])
                    .spread(function(decl, c) {
                        return U.extend(true, decl, c);
                    });

            }, {});

        });

    },

    storeBuildResult: function(path, suffix, res) {

        U.mkdirs(PATH.dirname(path));

        res = '(' + JSON.stringify(res, null, 4) + ')\n';
        return this.__base(path, suffix, res);

    },

    getCreateResult: function(path, suffix, vars) {
        return {};
    },

    storeCreateResult: function(path, suffix, res, force) {
        res = 'module.exports = ' + JSON.stringify(res, null, 4) + ';\n';
        return this.__base(path, suffix, res, force);
    },

    readContent: function(path, suffix) {
        return U.readDecl(path);
    }

});

var Q = require('qq'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech,
    bemUtil = require('../util'),
    assert = require('assert');

exports.Tech = INHERIT(Tech, {

    getCreateResult: function(path, suffix, vars) {
        return 'module.exports = ' +
            JSON.stringify(this.getContext().getLevel().getBlockByIntrospection(vars.BlockName), null, 4) + ';\n';
    },

    readContent: function(path, suffix) {
        if(bemUtil.isFile(path)) {
            return require(path);
        }
        return {};
    },

    getBuildResult: function(prefixes, suffix, outputDir, outputName) {
        var _this = this;
        return Q.when(this.filterPrefixes(prefixes, [suffix]), function(paths) {
            return Q.shallow(paths.reduce(function(decl, path) {
                return _this._mergeChunk(decl, _this.readContent(path, suffix));
            }, {}));
        });
    },

    storeBuildResult: function(path, suffix, res) {
        res = 'module.exports = ' + JSON.stringify(res, null, 4) + ';\n';
        return this.__base(path, suffix, res);
    },

    _mergeList: function(dest, source) {
        var _this = this,
            dir = {};

        // build dictionary to optimize search
        dest.forEach(function(chunk) {
            dir[chunk.name] = chunk;
        });

        source.forEach(function(chunk) {
            var destChunk = dir[chunk.name];
            if (!destChunk) {
                destChunk = { name: chunk.name };
                dir[chunk.name] = destChunk;
                dest.push(destChunk);
            }
            _this._mergeChunk(destChunk, chunk);
        });

        return dest;
    },

    _mergeChunk: function(dest, source) {
        if (!dest.name) dest.name = source.name;
        assert(dest.name == source.name);
        for (var key in source) {
            if (!source.hasOwnProperty(key)) continue;
            if (key == 'name') continue;
            dest[key] = this._mergeList(dest[key] || [], source[key]);
        }
        return dest;
    }

});

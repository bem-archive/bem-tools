'use strict';

var Q = require('q'),
    PATH = require('../../path'),
    LOGGER = require('../../logger');

exports.baseTechPath = PATH.join(__dirname, 'css');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        var map = {},
            t = this.getTechName();
        map[t] = ['hover.' + t, t];

        return map;
    },

    getBuildResults: function(decl, levels, output, opts) {
        var _this = this,
            files = this.getBuildPaths(decl, levels);

        return files.then(function(files) {
            var filteredFiles = files[_this.getTechName()] || [],
                file = _this.getPath(output, _this.getTechName());

            return _this.validate(file, filteredFiles, opts).then(function(valid) {
                LOGGER.fverbose('file %s is %s', file, valid?'valid':'not valid');
                if (!valid) {
                    _this.saveLastUsedData(file, {buildFiles: filteredFiles});

                    var getChunks = Q.all(filteredFiles.map(function(path) {
                            return _this.getBuildResultChunk(PATH.relative(PATH.dirname(output), path.absPath));
                        })),
                        getFirst = _this.getFirstBuildChunks(PATH.basename(output));

                    return Q.all([getFirst, getChunks]).spread(function(first, res) {
                        res.unshift(first);

                        var result = {};
                        result[_this.getTechName()] = res;

                        return result;
                    });
                }

                return {};
            });
        });
    },

    getFirstBuildChunks: function(output) {
        return this.getBuildResultChunk(this.getPath(PATH.basename(output), 'css'));
    }
};

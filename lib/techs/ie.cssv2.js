var Q = require('q'),
    QFS = require('q-fs'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./cssv2').Tech,
    LOGGER = require('../logger');

exports.Tech = INHERIT(Tech, {

    getTechName: function() {
        return 'ie.css';
    },

    getBuildSuffixesMap: function() {
        return {
            'ie.css': ['hover.css', 'css']
        };
    },

    getBuildResults: function(decl, levels, outputDir, outputName, opts) {
        var _this = this,
            files = this.getBuildFiles(decl, levels);

        return files.then(function(files) {
            var filteredFiles = files[_this.getTechName()] || [],
                file = _this.getPath(PATH.resolve(outputDir, outputName), _this.getTechName());

            return _this.validate(file, filteredFiles, opts).then(function(valid) {
                LOGGER.fverbose('file %s is %s', file, valid?'valid':'not valid');
                if (!valid) {
                    _this.saveLastUsedData(file, {buildFiles: filteredFiles});

                    var getChunks = Q.all(filteredFiles.map(function(path) {
                            return _this.getBuildResultChunk(PATH.relative(outputDir, path.absPath));
                        })),
                        getFirst = _this.getFirstBuildChunks(outputName);

                    return Q.all([getFirst, getChunks]).spread(function(first, res) {
                        res.unshift(first);

                        return {
                            'ie.css': res
                        };
                    });
                }

                return {};
            });
        });
    },

    getFirstBuildChunks: function(outputName) {
        return this.getBuildResultChunk(this.getPath(outputName, 'css'));
    }
});

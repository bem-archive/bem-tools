var FS = require('fs'),
    Q = require('q');

exports.techMixin = {

    getBuildResultChunk: function(relPath, path, suffix) {
        return this.wrapBuildResultChunk(this.readContent(path, suffix), relPath);
    },

    wrapBuildResultChunk: function(chunk, path) {

        return Q.when(chunk)
            .then(function(chunk) {

                return [
                    '/* ' + path + ': begin */ /**/',
                    chunk + ';',
                    '/* ' + path + ': end */ /**/',
                    '\n'].join('\n');

            });

    },

    getSuffixes: function() {
        return ['js'];
    }

};

exports.API_VER = 2;

exports.techMixin = {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '/*borschik:include:' + relPath + '*/;\n';
    },

    getBuildSuffixesMap: function() {
        return {
            'js': ['js']
        }
    }

};

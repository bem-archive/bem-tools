var PATH = require('../path'),
    U = require('../util'),
    Q = require('q'),
    VM = require('vm'),
    YAML = require('js-yaml');


exports.techMixin = {

    getBemtreeSuffixes : function() {

        return ['bemtree.yml', 'bemtree.js'];

    },

    getCreateResult : function(path, suffix, vars) {

        var prefix = PATH.basename(path, '.' + suffix),
            dirname = PATH.dirname(path),
            srcSuffixes = this.getBemtreeSuffixes(),
            bemtreeSuffix,
            bemtreePath;

        while(bemtreePath = '', bemtreeSuffix = srcSuffixes.shift()) {
            var name = this.getPath(prefix, bemtreeSuffix);

            bemtreePath = PATH.join(dirname, name);

            if(PATH.existsSync(bemtreePath))
                break;
        }

        if(!bemtreePath || !U.isFile(bemtreePath))
            return this.__base.apply(this, arguments);

        var content = this.readContent(bemtreePath),
            result;

        try {

            switch(bemtreeSuffix) {

            case 'bemtree.yml':
                result = convertYAML(content, vars);
                break;

            case 'bemtree.js':
                result = convertJS(content, vars);
                break;

            default:
                result = Q.resolve('');

            }

        } catch(e) {
            throw e;
        }

        return result.then(function(data) {
            return JSON.stringify(data, null, 4);
        });

    }

};


function convertYAML(data, vars) {

    return data.then(function(content) {
        return YAML.safeLoad(content);
    });

}


function convertJS(data, vars) {

    return data.then(function(content) {
        return VM.runInThisContext(path);
    });

}

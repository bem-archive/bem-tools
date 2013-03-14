var FS = require('fs'),
    DEPS = require('../techs/deps.js'),
    Q = require('q');

exports.techMixin = {

    transformBuildDecl: function(decl) {

        return this.getContext().opts.declaration.then(function(decl) {
            var deps = new DEPS.Deps(decl.depsByTechs),
                decl = [];

            deps.forEach(function(item, ctx) {
                var t1 = ctx.item.tech || '',
                    t2 = item.item.tech || '';

                console.log('i=%j\nc=%j\n%s %s\n---', item.item, ctx.item, t1, t2);
            });

            // console.log(deps.items);
            // console.log('---');
            // console.log(decl);

            return deps;
        });

    },

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

var FS = require('fs'),
    DEPS = require('../techs/deps.js'),
    Q = require('q');

exports.techMixin = {

    // buildByDecl: function(decl, levels, output) {
    //     // TODO
    // },

    transformBuildDecl: function(decl) {

        return this.getContext().opts.declaration.then(function(decl) {
            // console.log(JSON.stringify(decl.depsByTechs, null, 4) + '\n');

            var deps = new DEPS.Deps().parseFull(decl.depsFull),
                decl = [];

            console.log(JSON.stringify(deps, null, 4) + '\n');

            deps.forEach(function(item, ctx) {

                var tCtx = ctx.item.tech || '',
                    tItem = item.item.tech || '';

                if (!tItem || tItem == 'js' || (tItem == 'bemhtml' && tCtx == 'js')) {
                    decl.push(item.item);
                }

                // console.log('i=%j\nc=%j\n%s %s\n---', item.item, ctx.item, t1, t2);
            });

            // console.log(deps.items);
            // console.log('---');
            console.log(decl);

            return { deps: decl };
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

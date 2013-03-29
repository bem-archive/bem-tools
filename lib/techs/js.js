var FS = require('fs'),
    DEPS = require('../techs/deps.js'),
    Q = require('q'),
    PATH = require('../path'),
    U = require('../util');

exports.techMixin = {

    buildByDecl: function(decl, levels, output) {

        var jsTechDecl = this.transformTechBuildDecl(decl, 'js'),
            bemhtmlTechDecl = this.transformTechBuildDecl(decl, 'bemhtml', 'js');

        jsTechDecl.then(function(d) { console.log(d); });
        bemhtmlTechDecl.then(function(d) { console.log(d); });

        return Q.all([
            this.getTechBuildResult('js', jsTechDecl, levels, output)
                .then(function(res) {
                    console.log(res);
                }),

            this.getTechBuildResult('bemhtml', bemhtmlTechDecl, levels, output)
                .then(function(res) {
                    console.log(res);
                })
        ]);

    },

    getTechBuildResult: function(tech, decl, levels, output) {

        var t = this
            .getContext()
            .getTech(tech);

        return t.getBuildResults(t.getBuildPrefixes(decl, levels),
                PATH.dirname(output) + PATH.dirSep, PATH.basename(output));

    },

    transformTechBuildDecl: function(decl, tech, ctxTech) {

        return this.getContext().opts.declaration
            .then(function(decl) {

                var deps = new DEPS.Deps().parseFull(decl.depsFull),
                    decl = [],
                    uniq = [];

                deps.forEach(function(item, ctx) {

                    var tCtx = ctx.item.tech || '',
                        tItem = item.item.tech || '',
                        key = U.bemKey(item.item);

                    if ((!tItem || tItem == tech) && (!ctxTech || ctxTech == tCtx)) {
                        if (!~uniq.indexOf(key)) {
                            decl.push(item.item);
                            uniq.push(key);
                        }
                    }

                });

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

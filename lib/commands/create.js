'use strict';

var Q = require('q'),
    PATH = require('path'),
    bemUtil = require('../util'),
    MakefileReader = require('../make-reader.js'),
    createLevel = require('../level').createLevel,
    Context = require('../context').Context,
    insight = require('../insight');

module.exports = function() {

    return this
        .title('Create of entities tool.')
        .helpful()
        .extendable()
        .cmd()
            .name('level')
            .apply(insight.trackCommand)
            .apply(require('./create/level'))
            .end()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .opt()
            .name('level').short('l').long('level')
            .def(bemUtil.findLevel(process.cwd()))
            .title('level directory path')
            .def()
            .end()
        .opt()
            .name('root').short('r').long('root')
            .title('project root (cwd by default)')
            .def(process.cwd())
            .val(function(d) {
                return PATH.resolve(d);
            })
            .end()
        .opt()
            .name('block').short('b').long('block')
            .title('block name, required')
            .req()
            .arr()
            .end()
        .opt()
            .name('elem').short('e').long('elem')
            .title('element name')
            .arr()
            .end()
        .opt()
            .name('mod').short('m').long('mod')
            .title('modifier name')
            .arr()
            .end()
        .opt()
            .name('val').short('v').long('val')
            .title('modifier value')
            .arr()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force files creation')
            .flag()
            .end()
        .act(function(opts, args) {
            MakefileReader.get().read(PATH.join(opts.root, '.bem', 'make.js'), ['levels']);

            if (typeof opts.level === 'string') {
                opts.level = createLevel(opts.level, {
                    projectRoot: opts.root
                });
            }
            var context = new Context(opts.level, opts),
                addOpts = { args: args.raw || [], force: opts.force },
                items = [],

                eachBlock = function(block) {
                    var item = { block: block };

                    if (opts.elem && opts.elem.length) {
                        opts.elem.forEach(eachElem.bind(null, item));
                        return;
                    }

                    if (opts.mod && opts.mod.length) {
                        opts.mod.forEach(eachMod.bind(null, item));
                        return;
                    }

                    items.push(item);
                },

                eachElem = function(itemBase, elem) {
                    var item = bemUtil.extend({ elem: elem }, itemBase);

                    if (opts.mod && opts.mod.length) {
                        opts.mod.forEach(eachMod.bind(null, item));
                        return;
                    }

                    items.push(item);
                },

                eachMod = function(itemBase, mod) {
                    var item = bemUtil.extend({ mod: mod }, itemBase);

                    if (opts.val && opts.val.length) {
                        opts.val.forEach(eachModVal.bind(null, item));
                        return;
                    }

                    items.push(item);
                },

                eachModVal = function(itemBase, val) {
                    items.push(bemUtil.extend({ val: val }, itemBase));
                },

                techs = context.getDefaultTechs();

            if (!techs.length) return Q.reject('You should specify techs to create using --force-tech, -T or --add-tech, -t options');

            opts.block.forEach(eachBlock);

            return Q.all(items.map(function(item) {
                    return Q.all(techs.map(function(t) {
                        return context.getTech(t).createByDecl(item, opts.level, addOpts);
                    })).get(0);
                })).get(0);

        });

};

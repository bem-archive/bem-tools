'use strict';

var Q = require('q'),
    bemUtil = require('../util'),
    Context = require('../context').Context;

module.exports = function() {

    return this
        .title('Create of entities tool.')
        .helpful()
        .cmd().name('level').apply(require('./create/level')).end()
        .cmd().name('block').apply(require('./create/block')).end()
        .cmd().name('elem').apply(require('./create/elem')).end()
        .cmd().name('mod').apply(require('./create/mod')).end()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
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
            .name('content').short('c').long('content')
            .title('the content of the file')
            .arr()
            .end()
        .opt()
            .name('contentFile').short('cf').long('content-file')
            .title('path to the template to use as a content of created file')
            .arr()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force files creation')
            .flag()
            .end()
        .act(function(opts, args) {
            if (opts.content && opts.contentFile) {
                return Q.reject('You should not use content and content-file options simultaneously');
            }

            if (opts.contentFile) {
                opts.content = bemUtil.readFile(opts.contentFile);
            }

            var context = new Context(opts.level, opts),
                addOpts = { args: args.raw || [], force: opts.force, content: opts.content },
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

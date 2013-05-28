var Q = require('q'),
    bemUtil = require('../util'),
    Context = require('../context').Context;

module.exports = function() {

    return this
        .title('Create of entities tool.')
        .helpful()
        .cmd().name('level').apply(require('./create/level')).end()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('block').short('b').long('block')
            .title('block name')
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
        .arg()
            .name('entities')
            .title('BEM entities to create in form of block__elem_mod_val')
            .arr()
            .end()
        .act(function(opts, args) {

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

                prev = {},
                eachEntity = function(key) {
                    var partial = bemUtil.bemParseKey(key),
                        item = {};

                    // Try to reconstruct base item object from previous item
                    if (!partial.block && prev.block) {
                        item.block = prev.block;

                        if (partial.mod && prev.elem) {
                            item.elem = prev.elem;
                        }
                    }

                    // Try to get techs specified using dot notation
                    if (partial.tech) {
                        partial.techs = partial.tech.split(',');
                        delete partial.tech;
                    }

                    prev = bemUtil.extend(item, partial);
                    if (!prev.block) return;

                    items.push(prev);
                },

                techs = context.getDefaultTechs();

            opts.block && opts.block.forEach(eachBlock);
            args.entities && args.entities.forEach(eachEntity);

            return Q.all(items.map(function(item) {

                    var t = [].concat(techs).concat(item.techs || []);

                    if (!t.length) {
                        return Q.reject(['Can\'t create BEM entity: ', bemUtil.bemKey(item), '\n',
                            'You should specify techs to create using --force-tech, -T ',
                            'or --add-tech, -t options or using dot notation, ',
                            'e.g. block.css'].join(''));
                    }

                    return Q.all(t.map(function(t) {
                            return context.getTech(t).createByDecl(item, opts.level, addOpts);
                        }))
                        .get(0);

                }))
                .get(0);

        });

};

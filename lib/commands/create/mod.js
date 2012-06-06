var Q = require('q'),
    bemUtil = require('../../util'),
    Context = require('../../context').Context;

module.exports = function() {

    return this
        .title('Modifier.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('block name, required')
            .req()
            .end()
        .opt()
            .name('elemName').short('e').long('elem')
            .title('element name')
            .end()
        .opt()
            .name('modVal').short('v').long('val')
            .title('modifier value')
            .arr()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force files creation')
            .flag()
            .end()
        .arg()
            .name('names')
            .title('modifier names')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {

            var context = new Context(opts.level, opts),
                addOpts = { args: args.raw || [], force: opts.force },
                itemBase = { block: opts.blockName },
                techs = context.getDefaultTechs();

            if (!techs.length) return Q.reject('You should specify techs to create using --force-tech, -T or --add-tech, -t options');

            if (opts.elemName) itemBase.elem = opts.elemName;

            return Q.all(args.names.map(function(name) {
                return Q.all((opts.modVal || ['']).map(function(val) {
                    var item = bemUtil.extend({}, itemBase, { mod: name });
                    if (val) item.val = val;

                    return Q.all(techs.map(function(t) {
                        return context.getTech(t).createByDecl(item, opts.level, addOpts);
                    })).get(0);
                })).get(0);
            })).get(0);

        });

};

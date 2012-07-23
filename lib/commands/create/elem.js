var Q = require('q'),
    bemUtil = require('../../util'),
    Context = require('../../context').Context;

module.exports = function() {

    return this
        .title('Block element.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('block name, required')
            .req()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force files creation')
            .flag()
            .end()
        .arg()
            .name('names')
            .title('element names')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {

            var context = new Context(opts.level, opts),
                addOpts = { args: args.raw || [], force: opts.force },
                techs = context.getDefaultTechs();

            if (!techs.length) return Q.reject('You should specify techs to create using --force-tech, -T or --add-tech, -t options');

            return Q.all(args.names.map(function(name) {
                return Q.all(techs.map(function(t) {
                    return context.getTech(t).createByDecl({ block: opts.blockName, elem: name }, opts.level, addOpts);
                })).get(0);
            })).get(0);

        });

};

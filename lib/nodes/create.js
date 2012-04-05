var INHERIT = require('inherit'),
    PATH = require('path'),
    BEM = require('../coa').api,
    createLevel = require('../level').createLevel,

    GeneratedFileNode = require('./file').GeneratedFileNode;

exports.BemCreateNode = INHERIT(GeneratedFileNode, {

    __constructor: function(level, item, tech, techName) {
        this.level = typeof level == 'string'? createLevel(level) : level;
        this.item = item;
        this.tech = this.level.getTech(techName, tech);

        this.prefix = PATH.join(PATH.basename(this.level.dir), this.level.getRelByObj(this.item));
        this.__base(this.tech.getPath(this.prefix));
    },

    make: function() {
        var p = this.parseItem(this.item);
        p.opts.level = this.level.dir;
        p.opts.forceTech = this.tech.getTechPath();

        this.log('bem.create.%s(%s, %s)', p.cmd, JSON.stringify(p.opts, null, 4), JSON.stringify(p.args, null, 4));

        return BEM.create[p.cmd](p.opts, p.args);
    },

    parseItem: function(item) {
        var cmd = 'block',
            opts = { force: true },
            args = { names: item.block };
        if (item.mod) {
            cmd = 'mod';
            opts.blockName = item.block;
            args.names = item.mod;
            item.elem && (opts.elemName = item.elem);
            item.val && (opts.modVal = item.val);
        } else if (item.elem) {
            cmd = 'elem';
            opts.blockName = item.block;
            args.names = item.elem;
        }

        return {
            cmd: cmd,
            opts: opts,
            args: args
        };
    },

    getCreateDependencies: function(ctx) {
        var _this = this;

        return this.tech.getDependencies().map(function(d){
            return _this.level.getTech(d).getPath(_this.prefix);
        });
    }

});

'use strict';

var FS = require('fs'),
    PATH = require('../../path'),
    bemUtil = require('../../util');

exports.API_VER = 2;

exports.techMixin = {

    getCreateResult: function(path, suffix) {
        var basename = this.getPath(PATH.basename(path, '.' + suffix),
                                    'bemjson.js'),
            bemjsonPath = PATH.join(PATH.dirname(path), basename),
            bemjson = bemUtil.isFile(bemjsonPath) ? FS.readFileSync(bemjsonPath) : '[]';

        try {
            bemjson = require('vm').runInThisContext(bemjson);
        } catch(e) {
            console.log(bemjson.toString());
            throw e;
        }

        var decl = [];
        iterateJson(bemjson, getBuilder(decl));

        return 'exports.blocks = ' + JSON.stringify(bemUtil.mergeDecls([], decl), null, 4) + ';\n';
    },

    storeCreateResult: function(path, suffix, res, force) {
        bemUtil.mkdirs(PATH.dirname(path));
        return force?
            bemUtil.writeFile(path, res) :
            bemUtil.writeFileIfDiffers(path, res);
    },

    getDependencies: function() {
        return ['bemjson.js'];
    }

};

function isSimple(obj) {
    var t = typeof obj;
    return t === 'string' || t === 'number';
}

function iterateJson(obj, fn) {
    if(obj && !isSimple(obj))
        if(Array.isArray(obj)) {
            var i = 0, l = obj.length;
            while(i < l) iterateJson(obj[i++], fn);
        } else fn(obj);
    return obj;
}

function getBuilder(decl, block) {
    return function(obj) {
        var oldBlock = block;

        block = obj.block || block;

        obj.block && decl.push({ name: block });

        obj.elem && decl.push({ name: block, elems: [{ name: obj.elem }] });

        var mods, n;

        if(mods = obj.mods)
            for(n in mods)
                if(mods.hasOwnProperty(n))
                    decl.push({
                        name: block,
                        mods: [{ name: n, vals: [ mods[n] ] }]
                    });

        if(obj.elem && (mods = obj.elemMods))
            for(n in mods)
                if(mods.hasOwnProperty(n))
                    decl.push({
                        name: block,
                        elems: [{
                            name: obj.elem,
                            mods: [{ name: n, vals: [ mods[n] ] }]
                        }]
                    });

        iterateJson([obj.mix, obj.content], getBuilder(decl, block));

        block = oldBlock;
    };
}

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

        return 'exports.blocks = ' +
            JSON.stringify(this.buildBemdeclByBemjson(bemjson), null, 4) +
            ';\n';
    },

    buildBemdeclByBemjson: function(bemjson) {
        var decl = [];
        iterateJson(bemjson, getBuilder(decl));
        return bemUtil.mergeDecls([], decl);
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

        var contents = [],
            nonContentKeys = {
                block: 1,
                elem: 1,
                mods: 1,
                elemMods: 1,
                bem: 1,
                tag: 1,
                attrs: 1,
                cls: 1,
                js: 1
            },
            k;

        for(k in obj)
            obj.hasOwnProperty(k) &&
                !nonContentKeys.hasOwnProperty(k) &&
                    contents.push(obj[k]);

        iterateJson(contents, getBuilder(decl, block));

        block = oldBlock;
    };
}

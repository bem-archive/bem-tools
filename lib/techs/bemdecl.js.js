var FS = require('fs'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech,
    bemUtil = require('../util');

exports.Tech = INHERIT(Tech, {

    getCreateResult: function(path, suffix, vars) {
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
    }

});

function isSimple(obj) {
    var t = typeof obj;
    return t === 'string' || t === 'number' || t === 'boolean';
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

        var mods, n, props;

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

        props = Object.keys(obj).filter(function(k) {
                return !({ block: 1, elem: 1, mods: 1, elemMods: 1 }).hasOwnProperty(k);
            }).map(function(k) {
                return obj[k];
            });

        iterateJson(props, getBuilder(decl, block));

        block = oldBlock;
    }
}

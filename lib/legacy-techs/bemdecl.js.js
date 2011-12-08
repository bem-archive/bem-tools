var fs = require('fs'),
    myPath = require('../path'),
    Template = require('../template'),
    bemUtil = require('../util');

exports.techModule = module;

exports.newFileContent = function (vars) {
    vars.BemDecl = '';
    var decl = [],
        bemjsonFile = vars.Prefix + '.bemjson.js',
        json = myPath.existsSync(bemjsonFile) && fs.readFileSync(bemjsonFile) || [];

    try {
        json = require('vm').runInThisContext(json);
    } catch(e) {
        console.log(json);
        throw e;
    }

    iterateJson(json, getBuilder(decl));

    vars.BemDecl  = JSON.stringify(bemUtil.mergeDecls([], decl), null, 4);

    return Template.process([
        'exports.blocks = {{bemBemDecl}}'
        ], vars);
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

        var mods;

        if(mods = obj.mods)
            for(var n in mods)
                if(mods.hasOwnProperty(n))
                    decl.push({
                        name: block,
                        mods: [{ name: n, vals: [ mods[n] ] }]
                    });

        if(obj.elem && (mods = obj.elemMods))
            for(var n in mods)
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
    }
}

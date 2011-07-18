var util = require('bem/lib/util');

exports.techModule = module;

var fs = require('fs'),
    myPath = require('bem/lib/path'),
    Template = require('bem/lib/template');

exports.bemBuild = function(prefixes, outputDir, outputName) {
    var decl = [],
        json = fs.readFileSync(outputDir + outputName + '.bemjson.js');

    try {
        json = require('vm').runInThisContext(json);
    } catch(e) {
        console.log(json);
        throw e;
    }

    iterateJson(json, getBuilder(decl));

    fs.writeFileSync(
        myPath.join(outputDir, outputName + this.getFileSuffix()),
        'exports.blocks = ' + JSON.stringify(util.mergeDecls([], decl), null, 4),
        'utf-8');
}

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
    }
}

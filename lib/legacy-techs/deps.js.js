var FS = require('fs'),
    VM = require('vm'),
    PATH = require('../path'),
    bemUtil = require('../util'),
    Template = require('../template');

exports.techModule = module;

function Deps(deps, tech) {
    this.tech = tech;
    this.items = {};
}

Deps.prototype.parse = function(deps, depsCtx) {
    var res = { ol: [], ul: {} },
        _this = this,
        forEachItem = function(type, items, ctx) {
            items && (Array.isArray(items) ? items : [items]).forEach(function(item) {
                if(isSimple(item)) {
                    var i = item;
                    (item = {})[type] = i;
                }
                item.name && (item[type] = item.name);

                var depsItem = new DepsItem(_this, item, ctx);

                res.ol.push(depsItem.cache(res.ul));

                forEachItem('elem', item.elems, depsItem);

                var mods = item.mods;
                if(mods && !Array.isArray(mods)) { // Object
                    var modsArr = [];
                    for(var m in mods) {
                        if(!mods.hasOwnProperty(m)) continue;
                        modsArr.push({ mod: m });
                        var mod = { mod: m }, v = mods[m];
                        Array.isArray(v) ? (mod.vals = v) : (mod.val = v);
                        modsArr.push(mod);
                    }
                    mods = modsArr;
                }
                forEachItem('mod', mods, depsItem);

                forEachItem('val', item.vals, depsItem);

            });
        };

    forEachItem('block', deps, depsCtx);

    return res;
};

Deps.prototype.expandOne = function(tech) {
    var _this = this, items = this.items;
    for(var k in items) {
        if(!items.hasOwnProperty(k)) continue;
        var item = items[k];
        // для каждого уровня переопределения
        tech.context.getLevels().forEach(function(level) {
            var file = tech.fileByPrefix(item.buildLevelPath(level));
            try {
                bemUtil.isFile(file) &&
                    _this.parse(
                        VM.runInThisContext(
                            FS.readFileSync(file, 'utf-8')),
                        item
                    );
            } catch(e) { console.log(file, e, e.message) }
        });
    }
    return this;
};

Deps.prototype.expand = function(tech) {
    var depsCount1 = this.getCount(),
        depsCount2 = this.expandOne(tech).getCount(),
        i = 10;

    while(depsCount1 !== depsCount2  && i--) {
        depsCount1 = depsCount2;
        depsCount2 = this.expandOne(tech).getCount();
    }

    i || console.log('Maybe recursion?');

    return this;
};

Deps.prototype.subtract = function(deps) {
    var items1 = this.items, items2 = deps.items;
    for(var k in items2)
        if(items2.hasOwnProperty(k)) delete items1[k];
    return this;
};

Deps.prototype.getCount = function() {
    var res = 0, items = this.items;
    for(var k in items) items.hasOwnProperty(k) && res++;
    return res;
};

Deps.prototype.stringify = function(deps) {
    var res = [], uniq = {}, items = this.items;

    deps.forEach(function(item) {
        items.hasOwnProperty(item.buildKey()) && item.serialize(res, uniq);
    });

    return 'exports.deps = ' + JSON.stringify(res, null, 4) + ';\n';
};

function DepsItem(deps, item, ctx) {
    this.item = item;
    this.extendByCtx(ctx);

    var ks = ['mustDeps', 'shouldDeps'], k;
    while(k = ks.shift())
        item[k] && (item[k] = deps.parse(item[k], this).ul);

    return this.cache(deps.items);
}

DepsItem.prototype.extendByCtx = function(ctx) {
    if(ctx && (ctx = ctx.item)) {
        var ks = ['block', 'elem', 'mod'], k;
        while(k = ks.shift())
            if(this.item[k]) break;
                else ctx[k] && (this.item[k] = ctx[k]);
    }
    return this;
};

DepsItem.prototype.extend = function(item) {
    if(!item) return this;
    var ds = ['mustDeps', 'shouldDeps'], d,
        thisDeps, itemDeps;
    while(d = ds.shift()) {
        itemDeps = item[d] || (item[d] = {});
        if(thisDeps = this.item[d]) {
            for(var k in thisDeps)
                if(thisDeps.hasOwnProperty(k)) {
                    if(!thisDeps[k].extend) throw 'bla';
                    (itemDeps[k] = thisDeps[k].extend(itemDeps[k]));
                }
        }
    }
    return item;
};


DepsItem.prototype.cache = function(cache) {
    var key = this.buildKey();
    return cache[key] = this.extend(cache[key]);
};

DepsItem.prototype.buildKey = function() {
    if('key' in this) return this.key;
    var i = this.item, k = '';
    if(i.block) {
        k = i.block;
        i.elem && (k += '__' + i.elem);
        if(i.mod) {
            k += '_' + i.mod;
            i.val && (k += '_' + i.val);
        }
    }
    return this.key = k;
};

DepsItem.prototype.buildLevelPath = function(level) {
    var i = this.item, getter, args;
    if(i.block) {
        getter = 'block';
        args = [i.block];
        if(i.elem) {
            getter = 'elem';
            args.push(i.elem);
        }
        if(i.mod) {
            getter += '-mod';
            args.push(i.mod);
            if(i.val) {
                getter += '-val';
                args.push(i.val);
            }
        }
        return level.get(getter, args);
    }
};

DepsItem.prototype.serialize = function(buf, uniq) {
    var key = this.buildKey();
    if(uniq.hasOwnProperty(key)) return;
    uniq[key] = true;
    this.serializeDeps('mustDeps', buf, uniq);
    this.serializeSelf(buf, uniq);
    this.serializeDeps('shouldDeps', buf, uniq);
    return buf;
};

DepsItem.prototype.serializeSelf = function(buf, uniq) {
    var res = {}, ks = ['block', 'elem', 'mod', 'val'], k;
    while(k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
    buf.push(res);
};

DepsItem.prototype.serializeDeps = function(depsName, buf, uniq) {
    var deps = this[depsName];
    if(deps)
        for(var k in deps)
            deps.hasOwnProperty(k) &&
                deps[k].serialize(buf, uniq);
};

exports.Deps = Deps;
exports.DepsItem = DepsItem;

exports.bemBuild = function(prefixes, outputDir, outputName) {

    var deps = new Deps(),
        res = deps.parse(this.context.opts.declaration.blocks);

    deps.expand(this);

    FS.writeFileSync(
        PATH.join(outputDir, outputName + this.getFileSuffix()),
        deps.stringify(res.ol),
        'utf-8');

};

exports.newFileContent = function (vars) {
    return Template.process([
        '({',
        '    mustDeps: [],',
        '    shouldDeps: []',
        '})'], vars);
};

function isSimple (o) {
    var t = typeof o;
    return t === 'string' || t === 'number';
}

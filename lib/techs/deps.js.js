var VM = require('vm'),
    Q = require('q'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    getCreateResult: function(path, suffix, vars) {

        return [
            '({',
            '    mustDeps: [],',
            '    shouldDeps: []',
            '})'
        ].join('\n');

    },

    getBuildResult: function(prefixes, suffix, outputDir, outputName) {

        var deps = new Deps(),
            res = deps.parse(this.getContext().opts.declaration.blocks);

        return Q.when(deps.expand(this), function() {
            return deps.stringify(res.ol);
        });

    }

});

var Deps = exports.Deps = INHERIT({

    __constructor: function(deps, tech) {
        this.tech = tech;
        this.items = {};
    },

    parse: function(deps, depsCtx) {
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
    },

    expandOne: function(tech) {
        var _this = this,
            items = this.items,
            done;
        for(var k in items) {
            if(!items.hasOwnProperty(k)) continue;
            var item = items[k];

            // для каждого уровня переопределения
            done = tech.getContext().getLevels().reduce(function(done, level) {

                var path = tech.getPath(item.buildLevelPath(level));

                return (function(item) {
                    return Q.when(done, function() {
                        return Q.when(tech.readContent(path, tech.getTechName()), function(content) {
                            if(!content) return;
                            try {
                                _this.parse(VM.runInThisContext(content), item);
                            } catch(e) {
                                return Q.reject(path + '\n' + e.stack);
                            }
                        });
                    });
                })(item);

            }, done);
        }
        return done;
    },

    expand: function(tech) {
        var _this = this,
            depsCount1 = this.getCount(),
            depsCount2,
            i = 10;
        return Q.when(_this.expandOne(tech), function again() {
            depsCount2 = _this.getCount();
            if(depsCount1 !== depsCount2 && i--) {
                depsCount1 = depsCount2;
                return Q.when(_this.expandOne(tech), again);
            }

            i || console.log('Maybe recursion?');
        });
    },

    subtract: function(deps) {
        var items1 = this.items, items2 = deps.items;
        for(var k in items2)
            if(items2.hasOwnProperty(k)) delete items1[k];
        return this;
    },

    getCount: function() {
        var res = 0, items = this.items;
        for(var k in items) items.hasOwnProperty(k) && res++;
        return res;
    },

    stringify: function(deps) {
        var res = [], uniq = {}, items = this.items;

        deps.forEach(function(item) {
            items.hasOwnProperty(item.buildKey()) && item.serialize(res, uniq);
        });

        return 'exports.deps = ' + JSON.stringify(res, null, 4) + ';\n';
    }

});

var DepsItem = exports.DepsItem = INHERIT({

    __constructor: function(deps, item, ctx) {
        this.item = item;
        this.extendByCtx(ctx);

        var ks = ['mustDeps', 'shouldDeps'], k;
        while(k = ks.shift())
            item[k] && (item[k] = deps.parse(item[k], this).ul);

        return this.cache(deps.items);
    },

    extendByCtx: function(ctx) {
        if(ctx && (ctx = ctx.item)) {
            var ks = ['block', 'elem', 'mod'], k;
            while(k = ks.shift())
                if(this.item[k]) break;
                else ctx[k] && (this.item[k] = ctx[k]);
        }
        return this;
    },

    extend: function(item) {
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
    },

    cache: function(cache) {
        var key = this.buildKey();
        return cache[key] = this.extend(cache[key]);
    },

    buildKey: function() {
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
    },

    buildLevelPath: function(level) {
        return level.getByObj(this.item);
    },

    serialize: function(buf, uniq) {
        var key = this.buildKey();
        if(uniq.hasOwnProperty(key)) return;
        uniq[key] = true;
        this.serializeDeps('mustDeps', buf, uniq);
        this.serializeSelf(buf, uniq);
        this.serializeDeps('shouldDeps', buf, uniq);
        return buf;
    },

    serializeSelf: function(buf, uniq) {
        var res = {}, ks = ['block', 'elem', 'mod', 'val'], k;
        while(k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
        buf.push(res);
    },

    serializeDeps: function(depsName, buf, uniq) {
        var deps = this[depsName];
        if(deps)
            for(var k in deps)
                deps.hasOwnProperty(k) &&
                    deps[k].serialize(buf, uniq);
    }

});

function isSimple(o) {
    var t = typeof o;
    return t === 'string' || t === 'number';
}

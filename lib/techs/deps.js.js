var VM = require('vm'),
    Q = require('qq'),
    U = require('../util'),
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

    transformBuildDecl: function(decl) {

        var _this = this;

        return Q.when(decl)
            .then(function(decl) {

                var deps = new Deps(decl.blocks || decl.deps);

                return deps.expandByFS(_this).then(function() {
                    var d = deps.serialize(),
                        o = {};

                    if(d['']) {
                        o.deps = d[''][''];
                        delete d[''][''];
                    }
                    U.isEmptyObject(d) || (o.depsByTechs = d);

                    return o;
                });

            });

    },

    getBuildResult: function(prefixes, suffix, outputDir, outputName) {

        var _this = this;

        return Q.when(this.getContext().opts.declaration)
            .then(function(decl) {

                var deps = new Deps(decl.deps || decl.blocks);

                return Q.when(deps.expandByFS(_this), function() {
                    return deps.stringify();
                });

            });

    }

});

var Deps = exports.Deps = INHERIT({

    __constructor: function(deps) {
        this.items = {};
        this.itemsByOrder = [];
        this.uniqExpand = {};
        deps && this.parse(deps);
    },

    add: function(target, depsType, item) {
        var items = this.items,
            targetKey = target.buildKey(),
            itemKey = item.buildKey();

        if(!items[itemKey]) {
            items[itemKey] = item;
            this.itemsByOrder.push(itemKey);
        }

        (items[targetKey] || (items[targetKey] = target))[depsType].push(itemKey);
    },

    remove: function(target, item) {
        target = this.items[target.buildKey()];
        var itemKey = item.buildKey();
        U.removeFromArray(target.shouldDeps, itemKey);
        U.removeFromArray(target.mustDeps, itemKey);
    },

    clone: function(target) {
        target || (target = new this.__self());

        var items = this.items;
        for(var i in items) {
            if(!items.hasOwnProperty(i)) continue;
            target.items[i] = items[i].clone();
        }

        target.itemsByOrder = this.itemsByOrder.concat();
        target.tech = this.tech;
        target.uniqExpand = this.uniqExpand;

        return target;
    },

    parse: function(deps, ctx, fn) {
        if(!fn) {
            var rootItem = new DepsItem({});
            fn = function(i) { this.add(rootItem, 'shouldDeps', i) };
        }

        var _this = this,

            forEachItem = function(type, items, ctx) {
                items && (Array.isArray(items) ? items : [items]).forEach(function(item) {

                    if(isSimple(item)) {
                        var i = item;
                        (item = {})[type] = i;
                    }
                    item.name && (item[type] = item.name);

                    var depsItem = new DepsItem(item, ctx);

                    fn.call(_this, depsItem); // _this.add(rootItem, 'shouldDeps', depsItem);

                    _this.parse(
                        item.mustDeps,
                        depsItem,
                        function(i) { this.add(depsItem, 'mustDeps', i) });

                    _this.parse(
                        item.shouldDeps,
                        depsItem,
                        function(i) { this.add(depsItem, 'shouldDeps', i) });

                    _this.parse(
                        item.noDeps,
                        depsItem,
                        function(i) { this.remove(depsItem, i) });

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

        forEachItem('block', deps, ctx);

        return this;
    },

    expandByFS: function(tech) {

        this.tech = tech;

        var _this = this,
            depsCount1 = this.getCount(),
            depsCount2,
            i = 10;
        return this.expandOnceByFS().then(function again(newDeps) {
            depsCount2 = newDeps.getCount();
            if(depsCount1 !== depsCount2 && i--) {
                depsCount1 = depsCount2;
                return newDeps.expandOnceByFS().then(again);
            }

            i || console.log('Maybe recursion?');

            return newDeps.clone(_this);
        });

    },

    expandOnceByFS: function() {

        var newDeps = this.clone(),
            steps = this
                .filter(function(item) {
                    return !newDeps.uniqExpand.hasOwnProperty(item.buildKey());
                })
                .map(function(item) {
                    newDeps.uniqExpand[item.buildKey()] = true;
                    return function() {
                        return newDeps.expandItemByFS(item);
                    }
                });

        if (!steps.length) return Q.resolve(newDeps);

        return Q.step.apply(Q, steps)
            .then(function() {
                return newDeps;
            });

    },

    expandItemByFS: function(item) {

        var _this = this,
            tech = this.tech;

        return Q.step.apply(Q, tech.getContext().getLevels().map(function(level) {

            return function() {

                var path = tech.getPath(item.buildLevelPath(level));

                return tech.readContent(path, tech.getTechName())
                    .then(function(content) {
                        if(!content) return;
                        try {
                            _this.parse(VM.runInThisContext(content, path), item);
                        } catch(e) {
                            e.message = path + '\n' + e.message;
                            return Q.reject(e);
                        }
                    });

            }

        }))

    },

    subtract: function(deps) {
        var items1 = this.items, items2 = deps.items;
        for(var k in items2)
            if(k && items2.hasOwnProperty(k)) delete items1[k];
        return this;
    },

    getCount: function() {
        var res = 0, items = this.items;
        for(var k in items) items.hasOwnProperty(k) && res++;
        return res;
    },

    forEach: function(fn, uniq, itemsByOrder, ctx) {
        uniq || (uniq = {});
        var _this = this;

        (itemsByOrder || this.items[''].shouldDeps).forEach(function(i) {
            if(i = _this.items[i]) {
                var key = i.buildKey();
                if(!uniq.hasOwnProperty(key)) {
                    uniq[key] = true;
                    var newCtx = ctx || i;
                    _this.forEach(fn, uniq, i.mustDeps, newCtx);
                    fn.call(_this, i, newCtx);
                    _this.forEach(fn, uniq, i.shouldDeps, newCtx);
                }
            }
        })
    },

    map: function(fn) {
        var res = [];
        this.forEach(function(item) { res.push(fn.call(this, item)) });
        return res;
    },

    filter: function(fn) {
        var res = [];
        this.forEach(function(item) { if (fn.call(this, item)) res.push(item) });
        return res;
    },

    serialize: function() {
        var byTech = {};
        this.forEach(function(item, ctx) {
            var t1 = ctx.item.tech || '',
                t2 = item.item.tech || '',
                techsByTech = byTech[t1] || (byTech[t1] = {}),
                i = item.serialize();
            i && (techsByTech[t2] || (techsByTech[t2] = [])).push(i);
        });
        return byTech;
    },

    stringify: function() {
        var res = [],
            deps = this.serialize();
        if(deps['']) {
            res.push('exports.deps = ' + JSON.stringify(deps[''][''], null, 4) + ';\n');
            delete deps[''][''];
        }
        U.isEmptyObject(deps) || res.push('exports.depsByTechs = ' + JSON.stringify(deps, null, 4) + ';\n');
        return res.join('');
    }

});

var DepsItem = exports.DepsItem = INHERIT({

    __constructor: function(item, ctx) {
        this.shouldDeps = [];
        this.mustDeps = [];
        this.item = {};
        this.extendByCtx({ item: item });
        this.extendByCtx(ctx);
    },

    extendByCtx: function(ctx) {
        if(ctx && (ctx = ctx.item)) {
            var ks = ['tech', 'block', 'elem', 'mod', 'val'], k;
            while(k = ks.shift())
                if(this.item[k]) break;
                else ctx[k] && (this.item[k] = ctx[k]);
        }
        return this;
    },

    clone: function() {
        var res = new this.__self({}, this);
        res.shouldDeps = this.shouldDeps.concat();
        res.mustDeps = this.mustDeps.concat();
        this.hasOwnProperty('key') && (res.key = this.key);
        return res;
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
            k += i.block;
            i.elem && (k += '__' + i.elem);
            if(i.mod) {
                k += '_' + i.mod;
                i.val && (k += '_' + i.val);
            }
        }
        i.tech && (k += '.' + i.tech);
        return this.key = k;
    },

    buildLevelPath: function(level) {
        return level.getByObj(this.item);
    },

    serialize: function() {
        var res = {}, ks = ['tech', 'block', 'elem', 'mod', 'val'], k;
        while(k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
        if(res.block) return res;
    }

});

function isSimple(o) {
    var t = typeof o;
    return t === 'string' || t === 'number';
}

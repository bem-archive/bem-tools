'use strict';

var VM = require('vm'),
    Q = require('q'),
    FS = require('fs'),
    PATH = require('../path'),
    U = require('../util'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    readContentSync: function(path, suffix) {
        if (!PATH.existsSync(path)) return '';
        return FS.readFileSync(path, 'utf8');
    },

    getCreateResult: function(path, suffix, vars) {

        return [
            '({',
            '    mustDeps: [],',
            '    shouldDeps: []',
            '})'
        ].join('\n');

    },

    transformBuildDecl: function(decl) {

        return this.expandDeps(decl)
            .then(function(deps) {

                var d = deps.serialize(),
                    o = {};

                if(d['']) {
                    o.deps = d[''][''];
                    delete d[''][''];
                }
                U.isEmptyObject(d) || (o.depsByTechs = d);

                return o;

            });

    },

    expandDeps: function(decl) {

        var _this = this;

        return Q.when(decl)
            .then(function(decl) {
                return new Deps(decl.blocks || decl.deps).expandByFS(_this);
            });

    },

    buildByDecl: function(decl, levels, output) {

        var suffix = this.getTechName();

        return this.storeBuildResult(
            this.getPath(output, suffix),
            suffix,
            this.expandDeps(decl)
                .then(function(deps) {
                    return deps.stringify();
                }));

    }

});

var Deps = exports.Deps = INHERIT({

    /**
     * @param [deps]
     */
    __constructor: function(deps) {
        this.items = {};
        this.itemsByOrder = [];
        this.uniqExpand = {};

        // Force adding of root item to this.items
        var rootItem = this.rootItem = new DepsItem({});
        this.items[rootItem.buildKey()] = rootItem;

        deps && this.parse(deps);
    },

    add: function(target, depsType, item) {
        var items = this.items,
            targetKey = target.buildKey(),
            itemKey = item.buildKey(),
            deps;

        if (!items[itemKey]) {
            items[itemKey] = item;
            this.itemsByOrder.push(itemKey);
        }

        deps = (items[targetKey] || (items[targetKey] = target))[depsType];
        if (!~deps.indexOf(itemKey)) deps.push(itemKey);
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

    parseDepsDecl: function(decl) {

        if (decl.depsFull) {
            this.parseFull(decl.depsFull);
        } else {
            this.parse(decl.blocks || decl.deps);
        }

        return this;

    },

    parse: function(deps, ctx, fn) {
        fn || (fn = function(i) {
            this.add(this.rootItem, 'shouldDeps', i);
        });

        var _this = this,

            forEachItem = function(type, items, ctx) {
                items && !U.isEmptyObject(items) && (Array.isArray(items) ? items : [items]).forEach(function(item) {

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
                        function(i) {
                            this.add(depsItem, 'mustDeps', i);
                        });

                    _this.parse(
                        item.shouldDeps,
                        depsItem,
                        function(i) {
                            this.add(depsItem, 'shouldDeps', i);
                        });

                    _this.parse(
                        item.noDeps,
                        depsItem,
                        function(i) {
                            this.remove(depsItem, i);
                        });

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

    parseFull: function(deps) {

        if (deps) {
            var items = {};

            Object.keys(deps).forEach(function(k) {
                items[k] = new DepsItem(deps[k].item);

                // XXX: hardcore shouldDeps and mustDeps passing
                items[k].shouldDeps = deps[k].shouldDeps.concat();
                items[k].mustDeps = deps[k].mustDeps.concat();
            });

            this.items = items;
        }

        return this;

    },

    expandByFS: function(tech) {

        this.tech = tech;

        var _this = this,
            depsCount1 = this.getCount(),
            depsCount2;

        return Q.when(this.expandOnceByFS())
            .then(function again(newDeps) {

                depsCount2 = newDeps.getCount();
                if(depsCount1 !== depsCount2) {
                    depsCount1 = depsCount2;
                    return Q.when(newDeps.expandOnceByFS(), again);
                }

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
                    return newDeps.expandItemByFS(item);
                });

        if (!steps.length) return Q.resolve(newDeps);

        return newDeps;
    },

    expandItemByFS: function(item) {

        var _this = this,
            tech = this.tech;

        return tech.getContext().getLevels()
            .map(function(level) {

                var path = tech.getPath(item.buildLevelPath(level)),
                    content = tech.readContentSync(path, tech.getTechName());

                if (!content) return;
                try {
                    _this.parse(VM.runInThisContext(content, path), item);
                } catch(e) {
                    e.message = path + '\n' + e.message;
                    throw e;
                }

            });

    },

    /**
     * Merge specified Deps object into current.
     *
     * @param {Deps} deps  Deps object to merge.
     * @returns {Deps}
     */
    merge: function(deps) {

        var items1 = this.items,
            items2 = deps.items,
            i1, i2;

        for (var k in items2) {
            if (items2.hasOwnProperty(k)) {

                i2 = items2[k];

                if (items1.hasOwnProperty(k)) {
                    i1 = items1[k];
                } else {
                    i1 = items1[k] = new DepsItem(i2.item);
                }

                ['shouldDeps', 'mustDeps'].forEach(function(depsType) {
                    var d = i1[depsType];
                    i2[depsType].forEach(function(key) {
                        if (!~d.indexOf(key)) d.push(key);
                    });
                });

            }
        }

        return this;

    },

    subtract: function(deps) {

        var items = this.items;

        Object.keys(deps.items)
            .forEach(function(key) {
                // TODO: should cleanup mustDeps and shouldDeps
                if (key) delete items[key];
            });

        return this;

    },

    intersect: function(deps) {

        var items = this.items,
            newItems = {};

        Object.keys(deps.items)
            .forEach(function(key) {
                // TODO: should preserve mustDeps and shouldDeps of this.items
                if (!key || items.hasOwnProperty(key)) newItems[key] = items[key];
            });

        this.items = newItems;

        return this;

    },

    getCount: function() {
        return Object.keys(this.items).length;
    },

    forEach: function(fn, uniq, itemsByOrder, ctx) {
        uniq || (uniq = {});
        var _this = this;

        (itemsByOrder || this.items[''].shouldDeps).forEach(function(i) {
            if(i = _this.items[i]) {
                var key = i.buildKey(),
                    ctxTech = ctx && ctx.item.tech || '';
                if(!uniq.hasOwnProperty(key) || !uniq[key].hasOwnProperty(ctxTech)) {
                    (uniq[key] || (uniq[key] = {}))[ctxTech] = true;
                    var newCtx = ctx || i;
                    _this.forEach(fn, uniq, i.mustDeps, i);
                    fn.call(_this, i, newCtx);
                    _this.forEach(fn, uniq, i.shouldDeps, i);
                }
            }
        });
    },

    /**
     * Flatten deps into array of items
     *
     * @returns {Array}
     */
    flatten: function() {
        var res = [];
        this.forEach(function(item) {
            res.push(item);
        });
        return res;
    },

    /**
     * Flatten deps into array of items running specified function on every item
     *
     * @param {Function} fn  Function accepts `item` and `ctxItem` arguments
     * @returns {Array}
     */
    map: function(fn) {
        var res = [];
        this.forEach(function(item, ctxItem) {
            res.push(fn.call(this, item, ctxItem));
        });
        return res;
    },

    /**
     * Flatten deps into array of items filtering items using specified function
     *
     * @param {Function} fn  Function accepts `item` and `ctxItem` arguments and returns Boolean
     * @returns {Array}
     */
    filter: function(fn) {
        var res = [];
        this.forEach(function(item, ctxItem) {
            if (fn.call(this, item, ctxItem)) res.push(item);
        });
        return res;
    },

    /**
     * Deprecated method, use serializeFull() and serializePlain() instead.
     *
     * @deprecated
     * @returns {Object}
     */
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

    /**
     * Serialize plain deps to the plain list of objects without techs
     * specified.
     *
     * @returns {Object[]}
     */
    serializePlain: function() {

        var deps = [];

        this.forEach(function(item, ctx) {
            if (item.item.tech || ctx.item.tech) return;
            deps.push(item.serialize());
        });

        return deps;

    },

    /**
     * Serialize full deps structure.
     *
     * @returns {Object}
     */
    serializeFull: function() {
        return this.items;
    },

    /**
     * Stringify deps into CommonJS module.
     *
     * @returns {String}
     */
    stringify: function() {
        return 'exports.deps = ' + JSON.stringify(this.serializePlain(), null, 4) + ';\n' +
            'exports.depsFull = ' + JSON.stringify(this.serializeFull(), null, 4) + ';\n';
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
            var ks = ['block', 'elem', 'mod', 'val', 'tech'],
                k;

            while(k = ks.shift()) {
                if(this.item[k] && k !== 'tech') break;
                ctx[k] && (this.item[k] = ctx[k]);
            }
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

        var i = this.item,
            k = '';

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
        var res = {},
            ks = ['tech', 'block', 'elem', 'mod', 'val'], k;

        while(k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
        if(res.block) return res;
    }

});

function isSimple(o) {
    var t = typeof o;
    return t === 'string' || t === 'number';
}

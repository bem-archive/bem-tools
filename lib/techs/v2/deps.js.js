'use strict';

var VM = require('vm'),
    Q = require('q'),
    QFS = require('q-io/fs'),
    FS = require('fs'),
    PATH = require('../../path'),
    U = require('../../util'),
    INHERIT = require('inherit'),
    LOGGER = require('../../logger');

exports.API_VER = 2;

exports.techMixin = {

    getTechName: function() {
        return 'deps.js';
    },

    getBuildSuffixesMap: function() {
        return {
            'deps.js': 'deps.js'
        };
    },

    readContentSync: function(path) {
        if (!PATH.existsSync(path)) return '';
        return FS.readFileSync(path, 'utf8');
    },

    readContent: function(path) {
        return U.readFile(path)
            .fail(function() {
                return '';
            });
    },


    getCreateResult: function() {

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

    buildByDecl: function(decl, levels, output, opts) {

        var suffix = this.getTechName(),
            file = this.getPath(PATH.resolve(output), suffix),
            _this = this;

        return Q.all(levels
            .map(function(level) {
                return level.scanFiles();
            }))
            .then(function(){

                var declLastModified = -1;
                if (opts.declarationPath) declLastModified =
                    QFS.lastModified(opts.declarationPath)
                        .fail(function() {
                            return -1;
                        });

                return Q.all([_this.getLastUsedData(file),
                              declLastModified,
                              QFS.lastModified(file)
                                  .fail(function() {
                                      return -1;
                                  })])

                    .spread(function(data, declLastUpdated, lastUpdated) {
                        if (!data || !data.levels ||
                            !~lastUpdated || !~declLastUpdated ||
                            declLastUpdated > lastUpdated) return false;

                        return !_this.checkLevelsChanged(levels, data, lastUpdated);
                    })
                    .then(function(valid) {
                        LOGGER.fverbose('%s is %s', file, valid?'valid':'not valid');
                        if (!valid)
                            return _this.storeBuildResult(
                                _this.getPath(output, suffix),
                                suffix,
                                _this.expandDeps(decl)
                                    .then(function(deps) {
                                        return deps.stringify();
                                    }))
                                .then(function() {
                                    return _this.saveLastUsedData(file,
                                        {
                                            levels: levels.map(function(level) {
                                                return {
                                                    dir: level.dir,
                                                    fileCount: (level.files.files['deps.js'] || []).length
                                                };
                                            })
                                        }
                                    );
                                });
                    });

            });

    },

    checkLevelsChanged: function(levels, cache, lastUpdated) {
        if (levels.length !== cache.levels.length) {
            return true;
        }

        var i;
        for(i = 0; i < levels.length; i++) {
            if (levels[i].dir !== cache.levels[i].dir) {
                return true;
            }

            if (((levels[i].files.files['deps.js'] || [])).length !== cache.levels[i].fileCount) {
                return true;
            }
        }

        for(i = 0; i < levels.length; i++) {
            var level = levels[i],
                files = level.files.files['deps.js'] || [];

            for(var file in files) {
                if (files[file].lastUpdated > lastUpdated) return true;
            }
        }

        return false;
    }

};

var Deps = exports.Deps = INHERIT({

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
            itemByKey = items[itemKey];

        if(!itemByKey) {
            items[itemKey] = item;
            item.include && this.itemsByOrder.push(itemKey);
        } else if(!itemByKey.include && item.include) {
            // update `include` for existing item in case of adding of new item without `include: false`
            itemByKey.include = true;
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

                    if (Array.isArray(item.elem)) {
                        //add only elems and not block
                        forEachItem('elem', item.elem, depsItem);
                    } else {
                        fn.call(_this, depsItem); // _this.add(rootItem, 'shouldDeps', depsItem);
                    }

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

    expandByFS: function(tech) {
        this.tech = tech;


        var _this = this,
            depsCount1 = this.getCount(),
            depsCount2;

        return Q.all(tech.getContext().getLevels().map(function(level) {
            return level.scanFiles();
        }))
            .then(function() {
                return Q.when(_this.expandOnceByFS())
                    .then(function again(newDeps) {

                        depsCount2 = newDeps.getCount();
                        if(depsCount1 !== depsCount2) {
                            depsCount1 = depsCount2;
                            return Q.when(newDeps.expandOnceByFS(), again);
                        }

                        return newDeps.clone(_this);

                    });
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
                    };
                });

        if (!steps.length) return Q.resolve(newDeps);

        var i = 0,
            step = function() {
                if (i === steps.length) return newDeps;

                return steps[i++]()
                    .then(step);
            };

        return step();

    },

    expandItemByFS: function(item) {
        var _this = this,
            tech = this.tech,
            levels = tech.getContext().getLevels(),
            files = [];

        levels.forEach(function(level) {
            files = files.concat(
                level.getFileByObjIfExists(item.item, tech)
                .map(function(file) {
                    return tech.readContent(file.absPath);
                }));
        });

        return Q.all(files)
            .then(function(contents) {
                var i = 0;
                contents.forEach(function(content) {
                    if (content) {
                        try {
                            _this.parse(VM.runInThisContext(content, files[i].absPath), item);
                        } catch(e) {
                            e.message = files[i].absPath + '\n' + e.message;
                            throw e;
                        }
                    }
                    i++;
                });
            });
    },

    subtract: function(deps) {
        var items1 = this.items,
            items2 = deps.items;

        for(var k in items2)
            if(k && items2.hasOwnProperty(k)) delete items1[k];
        return this;
    },

    intersect: function(deps) {
        var items1 = this.items,
            items2 = deps.items,
            newItems = {};

        for(var k in items2) {
            if((items2.hasOwnProperty(k) && items1.hasOwnProperty(k)) || !k)
                newItems[k] = items1[k];
        }

        this.items = newItems;

        return this;
    },

    getCount: function() {
        var res = 0,
            items = this.items;

        for(var k in items) items.hasOwnProperty(k) && res++;

        return res;
    },

    forEach: function(fn, uniq, itemsByOrder, ctx) {
        uniq || (uniq = {});
        var _this = this;

        (itemsByOrder || this.items[''].shouldDeps).forEach(function(i) {
            if(i = _this.items[i]) {
                var key = i.buildKey(),
                    ctxTech = ctx && ctx.item.tech || '';
                if(!uniq.hasOwnProperty(key) || !uniq[key].hasOwnProperty(ctxTech)) {
                    if(i.include) { // include only items without `include: false`
                        (uniq[key] || (uniq[key] = {}))[ctxTech] = true;
                        var newCtx = ctx || i;
                        _this.forEach(fn, uniq, i.mustDeps, newCtx);
                        fn.call(_this, i, newCtx);
                        _this.forEach(fn, uniq, i.shouldDeps, newCtx);
                    }
                }
            }
        });
    },

    map: function(fn) {
        var res = [];
        this.forEach(function(item) {
            res.push(fn.call(this, item));
        });
        return res;
    },

    filter: function(fn) {
        var res = [];
        this.forEach(function(item) {
            if (fn.call(this, item)) res.push(item);
        });
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
        } else {
            res.push('exports.deps = [];\n');
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
        this.include = item.include !== false;
    },

    extendByCtx: function(ctx) {
        if(ctx && (ctx = ctx.item)) {
            var keys = ['block', 'elem', 'mod', 'val'],
                key;

            if (!this.item.tech && ctx.tech) {
                this.item.tech = ctx.tech;
            }
            while (key = keys.shift()) {
                if(this.item[key]) break;
                else ctx[key] && (this.item[key] = ctx[key]);
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
        cache[key] = this.extend(cache[key]);
        return cache[key];
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
        this.key = k;
        return k;
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

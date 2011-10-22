var FS = require('fs'),
    PATH = require('./path'),
    INHERIT = require('inherit'),
    createTech = require('./tech').createTech,
    bemUtil = require('./util'),
    isRequireable = bemUtil.isRequireable,
    isRequireError = bemUtil.isRequireError,

    getLevelClass = function(path) {
        path = PATH.absolute(path);
        var level = requireLevel(path);
        if(level.Level) return level.Level;
        return INHERIT(level.baseLevelPath? getLevelClass(level.baseLevelPath) : Level, level);
    },

    requireLevel = function(path) {
        try {
            var level = require(PATH.absolute(path));
        } catch (e) {
            if(!isRequireError(e)) throw e;
        }
        return level || {};
    };

exports.createLevel = function(path) {
    // NOTE: в директории .bem внутри уровня переопределения
    // лежит модуль-конфиг для уровня переопределения
    return new (getLevelClass(PATH.join(PATH.absolute(path), '.bem/level.js')))(path);
};

var Level = exports.Level = INHERIT({

    __constructor: function(path) {
        this.path = PATH.join(PATH.absolute(path), '.bem');
        this.techs = this.initTechs(this.getTechs() || {});
        this._techsCache = {};
    },

    getTechs: function() {
        return this.techs || {};
    },

    initTechs: function(desc) {
        var techs = {};
        for(var t in desc) {
            techs[t] = this.resolveTech(desc[t], true);
        }
        return techs;
    },

    getTech: function(name, path) {
        if(!this._techsCache.hasOwnProperty(name)) {
            this._techsCache[name] = this.createTech(name, path || name);
        }
        return this._techsCache[name];
    },

    createTech: function(name, path) {
        return createTech(this.resolveTech(path || name), name);
    },

    resolveTech: function(techIdent, force) {
        if(bemUtil.isPath(techIdent)) {
            return this.resolveTechPath(techIdent);
        }
        if(!force && this.techs.hasOwnProperty(techIdent)) {
            return this.resolveTechName(techIdent);
        }
        return bemUtil.getBemTechPath(techIdent);
    },

    resolveTechName: function(techIdent) {
        return (this.techs[techIdent] || null);
    },

    resolveTechPath: function(techPath) {
        // Получить абсолютный путь, если путь начинается с .
        // NOTE: заменить на !isAbsolute() нельзя
        if(techPath.substring(0, 1) === '.') {
            // Развернуть относительный путь начиная от директории .bem
            techPath = PATH.join(this.path, '/', techPath);
            if(!isRequireable(techPath)) {
                throw new Error("Tech module on path '" + techPath + "' not found");
            }
            return techPath;
        }

        // Пробуем абсолютный или относительный путь без .
        if(isRequireable(techPath)) {
            return techPath;
        }

        throw new Error("Tech module with path '" + techPath + "' not found on require.paths");
    },

    getDefaultTechs: function() {
        if(this.defaultTechs) return this.defaultTechs;
        var defaultTechs = [];
        for(var key in this.techs) this.techs.hasOwnProperty(key) && defaultTechs.push(key);
        return defaultTechs;
    },

    get: function(what, args) {
        return PATH.join(PATH.dirname(this.path), this.getRel(what, args));
    },

    getRel: function(what, args) {
        return this['get-' + what].apply(this, args);
    },

    'get-block': function(block) {
        return [block, block].join('/');
    },

    'get-block-mod': function(block, mod) {
        return [block,
               '_' + mod,
               block + '_' + mod].join('/');
    },

    'get-block-mod-val': function(block, mod, val) {
        return [block,
               '_' + mod,
               block + '_' + mod + '_' + val].join('/');
    },

    'get-elem': function(block, elem) {
        return [block,
               '__' + elem,
               block + '__' + elem].join('/');
    },

    'get-elem-mod': function(block, elem, mod) {
        return [block,
            '__' + elem,
            '_' + mod,
            block + '__' + elem + '_' + mod].join('/');
    },

    'get-elem-mod-val': function(block, elem, mod, val) {
        return [block,
            '__' + elem,
            '_' + mod,
            block + '__' + elem + '_' + mod + '_' + val].join('/');
    },

    matchRe: function() {
        return '[^_./]+';
    },

    matchOrder: function() {
        return ['elem-mod-val', 'elem-mod', 'block-mod-val',
            'block-mod', 'elem', 'block'];
    },

    matchTechsOrder: function() {
        var order = [];
        for (var key in this.techs) order.push(key);
        return order;
    },

    match: function(what, path) {
        return this['match-' + what].call(this, path);
    },

    'match-block': function(path) {
        var match = new RegExp(['^(' + this.matchRe() + ')',
            '\\1(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            suffix: match[2]
        };
    },

    'match-block-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '_(' + m + ')',
            '\\1_\\2(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[2],
            suffix: match[3]
        };
    },

    'match-block-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '_(' + m + ')',
            '\\1_\\2_(' + m + ')(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[2],
            val: match[3],
            suffix: match[4]
        };
    },

    'match-elem': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '\\1__\\2(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            suffix: match[3]
        };
    },

    'match-elem-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\1__\\2_\\3(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            mod: match[3],
            suffix: match[4]
        };
    },

    'match-elem-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\1__\\2_\\3_(' + m + ')(.*?)$'].join('/')).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            mod: match[3],
            val: match[4],
            suffix: match[5]
        };
    },

    getBlockByIntrospection: function(blockName) {
        var decl = this.getDeclByIntrospection(PATH.dirname(this.get('block', [blockName])));
        return decl.length? decl.shift() : {};
    },

    getDeclByIntrospection: function(from) {
        from = from || '.';
        var _this = this,
            decl = [],
            matchTechs = this.matchTechsOrder().map(function(techIdent) {
                return _this.getTech(techIdent);
            });

        bemUtil.fsWalkTree(PATH.resolve(_this.path, '..', from), function(f) {
            f = PATH.relative(_this.path, f);
            _this.matchOrder().forEach(function(matcher) {
                var match = _this.match(matcher, f);
                if(match) {
                    matchTechs.forEach(function(t) {
                        !match.tech && t.matchSuffix(match.suffix) &&
                            (match.tech = t.getTechName());
                    });
                    if(match.tech) {
                        decl = _this._mergeMatchToDecl(match, decl);
                    }
                }
            });
        }, function(f) {
            return !_this.isIgnorablePath(f);
        });

        return decl;
    },

    isIgnorablePath: function(path) {
        return /\.svn$/.test(path);
    },

    _mergeMatchToDecl: function(match, decl) {
        var blocks, elems, mods, vals,
            techAdded = false,
            addTech = function(o) {
                if(!techAdded && match.tech) {
                    o.techs = [{ name: match.tech }];
                    techAdded = true;
                }
                return o;
            };

        match.val &&
            (vals = [addTech({name: match.val})]);
        match.mod && match.val &&
            (mods = [addTech({name: match.mod, vals: vals})]);
        match.mod && !match.val &&
            (mods = [addTech({name: match.mod})]);
        match.elem &&
            (elems = [addTech({name: match.elem, mods: mods})]) &&
            (blocks = [addTech({name: match.block, elems: elems})]);
        !match.elem &&
            (blocks = [addTech({name: match.block, mods: mods})]);

        return bemUtil.mergeDecls(decl, blocks);
    }

});

var sys = require('sys'),
    myPath = require('./path'),
    Tech = require('./tech').Tech,
    bemUtil = require('./util'),
    isRequireable = bemUtil.isRequireable,
    isRequireError = bemUtil.isRequireError;

exports.Level = function(path) {
    this.path = myPath.join(myPath.absolute(path), '.bem');

    // NOTE: в директории .bem внутри уровня переопределения
    // может лежать модуль для уровня переопределения
    var level = {};
    try {
        level = require(myPath.join(this.path, 'level.js'));
    } catch (e) {
        if(!isRequireError(e)) throw e;
    }

    for(var i in level) level.hasOwnProperty(i) && (this[i] = level[i]);
    this.techs = this.initTechs(this.techs || {});
    this.techsCache = {};
};

exports.Level.prototype.initTechs = function(desc) {
    var techs = {};
    for(var t in desc) {
        techs[t] = this.resolveTech(desc[t], true);
    }
    return techs;
};

exports.Level.prototype.getTech = function(name, path) {
    if(!this.techsCache.hasOwnProperty(name)) {
        this.techsCache[name] = this.createTech(name, path || name);
    }
    return this.techsCache[name];
};

exports.Level.prototype.createTech = function(name, path) {
    return new Tech(this.resolveTech(path || name), name);
};

exports.Level.prototype.resolveTech = function(techIdent, force) {
    if(bemUtil.isPath(techIdent)) {
        return this.resolveTechPath(techIdent);
    }
    if(!force && this.techs.hasOwnProperty(techIdent)) {
        return this.resolveTechName(techIdent);
    }
    return bemUtil.getBemTechPath(techIdent);
};

exports.Level.prototype.resolveTechName = function(techIdent) {
    return (this.techs[techIdent] || null);
};

exports.Level.prototype.resolveTechPath = function(techPath) {
    // Получить абсолютный путь, если путь начинается с .
    // NOTE: заменить на !isAbsolute() нельзя
    if(techPath.substring(0, 1) === '.') {
        // Развернуть относительный путь начиная от директории .bem
        techPath = myPath.join(this.path, '/', techPath);
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
};

exports.Level.prototype.getDefaultTechs = function() {
    if(this.defaultTechs) return this.defaultTechs;
    var defaultTechs = [];
    for(var key in this.techs) this.techs.hasOwnProperty(key) && defaultTechs.push(key);
    return defaultTechs;
};

exports.Level.prototype.get = function(what, args) {
    return myPath.join(myPath.dirname(this.path), this.getRel(what, args));
};

exports.Level.prototype.getRel = function(what, args) {
    return this['get-' + what].apply(this, args);
};

exports.Level.prototype['get-block'] = function(block) {
    return [block, block].join('/');
};

exports.Level.prototype['get-block-mod'] = function(block, mod) {
    return [block,
           '_' + mod,
           block + '_' + mod].join('/');
};

exports.Level.prototype['get-block-mod-val'] = function(block, mod, val) {
    return [block,
           '_' + mod,
           block + '_' + mod + '_' + val].join('/');
};

exports.Level.prototype['get-elem'] = function(block, elem) {
    return [block,
           '__' + elem,
           block + '__' + elem].join('/');
};

exports.Level.prototype['get-elem-mod'] = function(block, elem, mod) {
    return [block,
        '__' + elem,
        '_' + mod,
        block + '__' + elem + '_' + mod].join('/');
};

exports.Level.prototype['get-elem-mod-val'] = function(block, elem, mod, val) {
    return [block,
        '__' + elem,
        '_' + mod,
        block + '__' + elem + '_' + mod + '_' + val].join('/');
};

exports.Level.prototype.matchRe = function() {
    return '[^_./]+';
};

exports.Level.prototype.matchOrder = function() {
    return ['elem-mod-val', 'elem-mod', 'block-mod-val',
        'block-mod', 'elem', 'block'];
};

exports.Level.prototype.matchTechsOrder = function() {
    var order = [];
    for (var key in this.techs) order.push(key);
    return order;
};

exports.Level.prototype.match = function(what, path) {
    return this['match-' + what].call(this, path);
};

exports.Level.prototype['match-block'] = function(path) {
    var match = new RegExp(['^(' + this.matchRe() + ')',
        '\\1(.*?)$'].join('/')).exec(path);
    if (!match) return false;
    return {
        block: match[1],
        suffix: match[2]
    };
};

exports.Level.prototype['match-block-mod'] = function(path) {
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
};

exports.Level.prototype['match-block-mod-val'] = function(path) {
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
};

exports.Level.prototype['match-elem'] = function(path) {
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
};

exports.Level.prototype['match-elem-mod'] = function(path) {
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
};

exports.Level.prototype['match-elem-mod-val'] = function(path) {
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
};

exports.Level.prototype.getBlockByIntrospection = function(blockName) {
    var _this = this,
        decl = [],
        matchTechs = [],
        matchToDecl = function(match) {
            var blocks, elems, mods, vals,
                techAdded = false,
                addTech = function(o) {
                    !techAdded && match.tech &&
                        (o.techs = [{name: match.tech}]) && (techAdded = true);
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
            decl = bemUtil.mergeDecls(decl, blocks);
        };

    this.matchTechsOrder().forEach(function(techIdent) {
        matchTechs.push(_this.getTech(techIdent));
    });

    bemUtil.fsWalkTree(myPath.dirname(this.get('block', [blockName])), function(f) {
        f = myPath.relative(_this.path, f);
        _this.matchOrder().forEach(function(matcher) {
            var match = _this.match(matcher, f);
            if(match) {
                matchTechs.forEach(function(t) {
                    !match.tech && t.matchSuffix(match.suffix) &&
                        (match.tech = t.getTechName());
                });
                if(match.tech) return matchToDecl(match);
            }
        });
    }, function(f) {
        return !_this.isIgnorablePath(f);
    });

    return decl.length? decl.shift() : {};
};

exports.Level.prototype.isIgnorablePath = function(path) {
    return /\.svn$/.test(f);
};

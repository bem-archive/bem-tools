var sys = require('sys'),
    myPath = require('./path');
    Tech = require('./tech').Tech;
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
    path = path || name;
    if(!this.techsCache.hasOwnProperty(name)) {
        this.techsCache[name] = this.createTech(name, path);
    }
    return this.techsCache[name];
};

exports.Level.prototype.createTech = function(name, path) {
    var path = path || name;
    return new Tech(this.resolveTech(path), name);
};

exports.Level.prototype.resolveTech = function(techIdent, force) {
    if(bemUtil.isPath(techIdent)) {
        return this.resolveTechPath(techIdent);
    }
    if(!force && this.techs.hasOwnProperty(techIdent)) {
        return this.techs[techIdent];
    }
    return bemUtil.getBemTechPath(techIdent);
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
}

exports.Level.prototype.get = function(what, args) {
    return myPath.join(myPath.dirname(this.path), this['get-' + what].apply(this, args));
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

// Интроспекция по файловой системе

// == FIXME: функции is*Name временные
exports.Level.prototype.isName = function(s) {
    return /^_{0,2}[a-zA-Z0-9-]+$/.test(s);
};

exports.Level.prototype.isBlockName = function(s) {
    return /^[bigl]-[a-zA-Z0-9-]+$/.test(s);
};

exports.Level.prototype.isElemName = function(s) {
    return /^(__)?[a-zA-Z0-9-]+$/.test(s) && s != 'examples'; // костыль про examples (см. LEGO-853)
};

exports.Level.prototype.isModName = function(s) {
    return /^_[a-zA-Z0-9-]+$/.test(s);
};

exports.Level.prototype.isExampleName = function(s) {
    return /^[^._][a-zA-Z0-9-_]*$/.test(s);
};
// == end

// == FIXME: функции get*Dir и get*FilePrefix временные
exports.Level.prototype.getBlockDir = function(blockName) {
    return myPath.dirname(this.get('block', [blockName]));
};

exports.Level.prototype.getElemDir = function(elemName, blockName) {
    return myPath.dirname(this.get('elem', [blockName, elemName]));
};

exports.Level.prototype.getModDir = function(modName, blockName, elemName) {
    return myPath.dirname(elemName?
        this.get('elem-mod', [blockName, elemName, modName]) :
        this.get('block-mod', [blockName, modName]));
};

exports.Level.prototype.getExamplesDir = function(blockName, elemName) {
    return myPath.join((elemName ?
        this.getElemDir(elemName, blockName) :
        this.getBlockDir(blockName)), 'examples');
};

exports.Level.prototype.getBlockFilePrefix = function(blockName) {
    return this.get('block', [blockName]);
};

exports.Level.prototype.getElemFilePrefix = function(elemName, blockName) {
    return this.get('elem', [blockName, elemName]);
};

exports.Level.prototype.getModFilePrefix = function(modName, blockName, elemName) {
    return elemName?
        this.get('elem-mod', [blockName, elemName, modName]) :
        this.get('block-mod', [blockName, modName]);
};

exports.Level.prototype.getExampleFilePrefix = function(exampleName, blockName, elemName) {
    return this.getExamplesDir(blockName, elemName) + exampleName;
};
// == end


exports.Level.prototype.getBlockFromFileSys = function(blockName) {
    return {
        name: blockName,
        mods: this.getModsFromFileSys(blockName),
        elems: this.getElemsFromFileSys(blockName),
        examples: this.getExamplesFromFileSys(blockName)
    };
};

exports.Level.prototype.getModsFromFileSys = function(blockName, elemName) {
    var _this = this;
    return this.getModNamesFromDirs(blockName, elemName).map(function(modName) {
        var vals = bemUtil.arrayUnique(
                bemUtil.getFiles(_this.getModDir(modName, blockName, elemName))
                    .map(function(f) {
                        var valRegex = new RegExp(
                                blockName +
                                (elemName ? '__' + elemName : '') +
                                '_' + modName + '_([^._]+)'
                            );
                        return (f.match(valRegex) || [])[1];
                    })
                    .filter(function(v) { return !!v })
            );

        return {
            name: modName,
            vals: vals.map(function(v) {
                return { name: v };
            })
        };
    });
};

exports.Level.prototype.getModNamesFromDirs = function(blockName, elemName) {
    return bemUtil.getDirs(elemName ?
            this.getElemDir(elemName, blockName) :
            this.getBlockDir(blockName))
        .filter(this.isModName)
        .map(function(n) { return n.replace(/^_/, '') });
};


exports.Level.prototype.getElemsFromFileSys = function(blockName) {
    var _this = this;
    return this.getElemNamesFromDirs(blockName).map(function(elemName) {
        return {
            name: elemName,
            mods: _this.getModsFromFileSys(blockName, elemName),
            examples: _this.getExamplesFromFileSys(blockName, elemName)
        };
    });
};

exports.Level.prototype.getElemNamesFromDirs = function(blockName) {
    return bemUtil.getDirs(this.getBlockDir(blockName))
        .filter(this.isElemName)
        .map(function(n) { return n.replace(/^__/, '') });
};

exports.Level.prototype.getExamplesFromFileSys = function(blockName, elemName) {
    var _this = this;
    return this.getExampleNamesFromFiles(blockName, elemName)
        .map(function(exampleName) {
            var exampleFilePrefix = _this.getExampleFilePrefix(exampleName, blockName, elemName),
                source = {
                    xml: 'xml',
                    params: 'params.xml',
                    css: 'css',
                    cssie: 'ie.css',
                    js: 'js'
                };

            for(var k in source) {
                var file = exampleFilePrefix + '.' + source[k];
                source[k] = myPath.existsSync(file) ? file : false;
            }

            return {
                name: exampleName,
                source: source
            };
        });
};

exports.Level.prototype.getExampleNamesFromFiles = function(blockName, elemName) {
    return bemUtil.arrayUnique(
            bemUtil.getFiles(this.getExamplesDir(blockName, elemName))
                .filter(function(s) {
                    return !(/.make./.test(s)) && !(/^Makefile$/.test(s)) && !(/.[png|jpg|gif|tt2]$/.test(s));
                    })
                .map(function(n) { return n.replace(/\..*$/, '') })
                .filter(this.isExampleName)
        );
};

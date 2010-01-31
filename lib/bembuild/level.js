var fs = require('file'),
    os = require('os');

exports.Level = function(path) {
    var _this = this,
        toolsPath = (this.path = fs.path(path)).join('.bembuild');

    // NOTE: в директории .bembuild внутри уровня переопределения
    // могут лежать исполняемые файлы для кастомного именования БЭМ

    [
        'block', 'block-mod', 'block-mod-val',
        'elem', 'elem-mod', 'elem-mod-val'
    ]
        .forEach(function (i) {
            var path = toolsPath.join(i);
            path.isFile() && (_this['get-' + i] = function () {
                    return os.command([path].concat(Array.prototype.slice.call(arguments)));
                });
        });
};

exports.Level.prototype.get = function(what, args) {
    return this.path.join(this['get-' + what].apply(this, args));
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

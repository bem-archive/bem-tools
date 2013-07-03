'use strict';

var INHERIT = require('inherit'),
    PATH = require('../path'),
    Level = require('../level').Level,
    U = require('../util');

exports.Level = INHERIT(Level, {

    'get-block': function(block) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block)));
    },

    'get-block-mod': function(block, mod) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block), mod));
    },

    'get-block-mod-val': function(block, mod, val) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block), mod, val));
    },

    'get-elem': function(block, elem) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block), elem));
    },

    'get-elem-mod': function(block, elem, mod) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block), elem, mod));
    },

    'get-elem-mod-val': function(block, elem, mod, val) {
        return PATH.join(PATH.dirname(block), this.__base(PATH.basename(block), elem, mod, val));
    },

    matchBlockRe: function() {
        return '([^_.]*' + PATH.dirSep + ')?(' + this.matchRe() + ')';
    },

    'match-block': function(path) {
        var match = new RegExp(['^(' + this.matchBlockRe() + ')',
                '\\3(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            suffix: match[4]
        };
    },

    'match-block-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + this.matchBlockRe() + ')',
            '_(' + m + ')',
            '\\3_\\4(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[4],
            suffix: match[5]
        };
    },

    'match-block-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + this.matchBlockRe() + ')',
            '_(' + m + ')',
            '\\3_\\4_(' + m + ')(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[4],
            val: match[5],
            suffix: match[6]
        };
    },

    'match-elem': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + this.matchBlockRe() + ')',
            '__(' + m + ')',
            '\\3__\\4(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[4],
            suffix: match[5]
        };
    },

    'match-elem-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + this.matchBlockRe() + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\3__\\4_\\5(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[4],
            mod: match[5],
            suffix: match[6]
        };
    },

    'match-elem-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + this.matchBlockRe() + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\3__\\4_\\5_(' + m + ')(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[4],
            mod: match[5],
            val: match[6],
            suffix: match[7]
        };
    },

    isIgnorablePath: function(path) {
        return this.__base(path) || (PATH.basename(path) === 'blocks' && U.isLevel(path));
    }

});

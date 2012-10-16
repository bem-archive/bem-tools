var INHERIT = require('inherit'),
    Level = require('../level').Level;

exports.Level = INHERIT(Level, {

    'get-block': function(block) {
        return block;
    },

    'get-block-mod': function(block, mod) {
        return [block, mod].join('_');
    },

    'get-block-mod-val': function(block, mod, val) {
        return [block, mod, val].join('_');
    },

    'get-elem': function(block, elem) {
        return [block, '_' + elem].join('_');
    },

    'get-elem-mod': function(block, elem, mod) {
        return [block, '_' + elem, mod].join('_');
    },

    'get-elem-mod-val': function(block, elem, mod, val) {
        return [block, '_' + elem, mod, val].join('_');
    },

    'match-block': function(path) {
        var match = new RegExp('^(' + this.matchRe() + ')(.*?)$').exec(path);
        if (!match) return false;
        return {
            block: match[1],
            suffix: match[2]
        };
    },

    'match-block-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp('^(' + m + ')_(' + m + ')(.*?)$').exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[2],
            suffix: match[3]
        };
    },

    'match-block-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp('^(' + m + ')_(' + m + ')_(' + m + ')(.*?)$').exec(path);
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
            match = new RegExp('^(' + m + ')__(' + m + ')(.*?)$').exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            suffix: match[3]
        };
    },

    'match-elem-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp('^(' + m + ')__(' + m + ')_(' + m + ')(.*?)$').exec(path);
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
            match = new RegExp('^(' + m + ')__(' + m + ')_(' + m + ')_(' + m + ')(.*?)$').exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            mod: match[3],
            val: match[4],
            suffix: match[5]
        };
    }

});

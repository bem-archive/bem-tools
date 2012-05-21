(function(undefined) {

if(window.JSON) return;

var _toString = Object.prototype.toString,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    meta = {
        '\b' : '\\b',
        '\t' : '\\t',
        '\n' : '\\n',
        '\f' : '\\f',
        '\r' : '\\r',
        '"'  : '\\"',
        '\\' : '\\\\'
    },
    stringify;

window.JSON = {
    stringify : stringify = function(val) {
        if(val === null) {
            return 'null';
        }
        if(typeof val === 'undefined') {
            return undefined;
        }
        switch(_toString.call(val)) {
            case '[object String]':
                return '"' +
                    (escapable.test(val)?
                        val.replace(escapable, function(a) {
                            var c = meta[a];
                            return typeof c === 'string'? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                        }) :
                        val) +
                    '"';
            case '[object Number]':
            case '[object Boolean]':
                return '' + val;
            case '[object Array]':
                var res = '[', i = 0, len = val.length, strVal;
                while(i < len) {
                    strVal = stringify(val[i]);
                    res += (i++? ',' : '') + (typeof strVal === 'undefined'? 'null' : strVal);
                }
                return res + ']';
            case '[object Object]':
                var res = '{', i = 0, strVal;
                for(var key in val) {
                    if(val.hasOwnProperty(key)) {
                        strVal = stringify(val[key]);
                        typeof strVal !== 'undefined' && (res += (i++? ',' : '') + '"' + key + '":' + strVal);
                    }
                }
                return res + '}';
            default:
                return undefined;
        }
    }
};
})();

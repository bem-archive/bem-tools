var W = require('WINSTON'),
    UTIL = require('util'),
    BEMUTIL = require('./util');

init();

for(var i in W) exports[i] = W[i];

Object.keys(W.levels).forEach(function (level) {
  exports['f' + level] = function (msg) {
      var m = UTIL.format.apply(this, arguments);
      W[level](m);
  };
});

exports.setLevel = function(level) {
    return init(level);
}

function init(level) {
    W.cli();
    W.remove(W.transports.Console);
    W.add(W.transports.Console,
        {
            timestamp: function() {
                var d = new Date();

                return UTIL.format(
                    '%s:%s:%s.%s',
                    BEMUTIL.pad(d.getHours(), 2, '0'),
                    BEMUTIL.pad(d.getMinutes(), 2, '0'),
                    BEMUTIL.pad(d.getSeconds(), 2, '0'),
                    BEMUTIL.pad(d.getMilliseconds(), 3, '0'));
            },
            colorize: true,
            level: level
        });

    W.setLevels({
            silly: 0,
            debug: 1,
            verbose: 2,
            info: 3,
            warn: 4,
            error: 5
        });
}

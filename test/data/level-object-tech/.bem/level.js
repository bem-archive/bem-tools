var BEM = require('../../../..');

exports.getTechs = function() {

    return {
        'deps.js': function() {
    	    return {
                baseTechPath: BEM.require.resolve('./techs/v2/deps.js'),

                techMixin: {
                    buildByDecl: function() {
                        return this.__base.apply(this, arguments);
                    },

                    check: function(a) {
                        return a + 'pass';
                    }
                }
            };
        }
    };

};

'use strict';

module.exports = function(BEM) {
    return {
        techMixin: {
            getBuildResults: function() {
                return BEM.require.resolve('./techs/js');
            }
        }
    };
};

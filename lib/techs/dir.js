'use strict';

var U = require('../util');

exports.techMixin = {

    storeCreateResult: function(path, suffix, res, force) {
        return U.mkdirp(path);
    }

};

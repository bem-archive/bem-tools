'use strict';

var U = require('../util');

exports.API_VER = 2;

exports.techMixin = {

    storeCreateResult: function(path, suffix, res, force) {
        return U.mkdirp(path);
    }

};

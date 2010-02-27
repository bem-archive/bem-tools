exports['get-block'] = function(block) {
    return block
};

exports['get-block-mod'] = function(block, mod) {
    return [block, mod].join('_');
};

exports['get-block-mod-val'] = function(block, mod, val) {
    return [block, mod, val].join('_');
};

exports['get-elem'] = function(block, elem) {
    return [block, '_' + elem].join('_');
};

exports['get-elem-mod'] = function(block, elem, mod) {
    return [block, '_' + elem, mod].join('_');
};

exports['get-elem-mod-val'] = function(block, elem, mod, val) {
    return [block, '_' + elem, mod, val].join('_');
};

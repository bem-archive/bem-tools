var fs = require('file'),
    os = require('os'),
    parser = exports.parser = (new (require('args').Parser)())
        .help('создание блоков, элементов, модификаторов')
        .helpful();

exports.outFile = function (file) {
    return '@import url(' + file + ');\n';
};

exports.newFileContent = function () {
    return '/* CSS */\n';
};

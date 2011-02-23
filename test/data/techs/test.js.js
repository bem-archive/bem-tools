exports.techModule = module;
exports.outFile = function (file) {
    return 'include("' + file + '");\n';
};

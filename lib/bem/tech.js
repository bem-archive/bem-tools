var fs = require('file');

exports.Tech = function (name) {
    this.name = name;

    var tech = {};
    try { tech = require('./tech/' + name) } catch (e) {
        try { tech = require(fs.absolute(name)) } catch (e) {}
    }
    for (var name in tech)
        if (Object.prototype.hasOwnProperty.call(tech, name))
            this[name] = tech[name];

};

exports.Tech.prototype.bemBuild = function (prefixes, outputDir, outputName) {
    var _this = this,
        content = '';
    this.filterExists(prefixes)
        .map(function (file) {
            return file.from(outputDir);
        })
        .forEach(function (file) {
            content += _this.outFile(file);
        });
    outputDir.join(outputName + '.' + this.name).write(content);
    return this;
};

exports.Tech.prototype.bemCreate = function (prefix) {
    var file = this.fileByPrefix(prefix);
    file.exists()?
        print('Уже существует ' + file) :
        file.write(this.newFileContent());
    return this;
};

exports.Tech.prototype.filterExists = function (prefixes) {
    var _this = this,
        res = [];
    prefixes.forEach(function (prefix) {
        var file = _this.fileByPrefix(prefix)
        file.exists() && res.push(file);
    });
    return res;
}

exports.Tech.prototype.fileByPrefix = function (prefix) {
    return fs.path(prefix + '.' + this.name);
};

exports.Tech.prototype.outFile = function (file) {
    return file + '\n';
};

exports.Tech.prototype.newFileContent = function () {
    return '';
};

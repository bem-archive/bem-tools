# Levels

The easiest way to configure level is `levels` section in `make.js` file. This section allows to set up a config for a single level or for
a group of levels matching mask:

```javascript
module.exports = function(make) {
    make.levels(function(levels) {
        levels.addLevel('*.bundles')
            .addTechs('js', 'css', 'bemhtml')
    });
};
```

`levels.addLevel(mask, [opts])` call creates new instance of the level builder. First argument specifies the path of the level directory or a mask.
Until next `addLevel` call or the end of section the following methods can be used to configure this level:

* `addTechs(tech1, tech2, ...)` - adds a list of techs to the level;
* `setNamingScheme(schemeName)` - sets BEM-entities to file system mapping for the level;
* `addTypes(type1, type2)` - assigns types to the level. Type is a string which can be used to distinguish levels of particular class;
* `setDefaultTechs` - sets the name of the tech to use for `bem create` command by default on this level;
* `setBundleBuildLevels` - for bundle levels, specifies a levels which contain source code of the blocks;

## Setting up technologies for the levels

When calling `addTech` method, tech module can be specified in one of the following ways:

1. With the name of tech. Serch of the module path will be performed automatically;
2. With `{"name": "/path/to/module"}` record, which will load the module from specified path;
3. With `{"name": techMixin}` which requires you to create tech module inline;

### Resolving tech path by name

If tech is specified by name, the search for the module will be performed in the following order:

1. npm packages, specified with `useNpmModule` calls of the builder;
2. `.bem/techs` folder in the root of the project;
3. bem-tools techs:
    * bemdecl.js
    * blocks
    * bundles
    * css
    * deps.js
    * dir
    * docs
    * examples
    * ie.css
    * ie6.css
    * ie7.css
    * ie8.css
    * ie9.css
    * js
    * js-i
    * level-proto
    * level
    * min
    * min.css
    * min.js
    * project
    * tech-docs

Search order of the module in npm packages corresponds with call order of `useNpmModule` methods.
Call to `useNpmModule` before first `addTech` will add package to the search path of all levels. After
`addTech` module will be added only to current levels search path.


## Setting up a nming scheme

The following BEM-enteties naming scheme is used by default:

```
level/
    block/
        __elem/
            _mod/
                block__elem_mod_val.css
            block__elem.css
        _mod/
            block_mod_val.css
        block.css
```

This scheme can be changed with `setNamingScheme(schemeName | mixin)` of the level builder.

There is also `simple` naming scheme packaged with bem-tools:

```
level/
    block1.css
    block1__elem.css
    block1__elem_mod.css
    block2.css
```

You can also create your own scheme by passing a mixin to `setNamingScheme`. This mixin must implement
all `get-*` and `math-*` methods of the level class. You can use [simple scheme source](https://github.com/bem/bem-tools/blob/release-1.0.0/lib/level/naming/simple.js)
as an example when implementing your own naming scheme.

## Extending a level

You can use any previously configured level as a base for a new one. To do this you must specify base level mask in `extends` key of the second argument
when calling `addLevel`. For example:

```javascript
module.exports = function(make) {
    make.levels(function(levels) {
        levels
            .addLevel('*.blocks')
                .setNamingScheme('simple')
                .addTechs('js', 'css')
            .addLevel('*.bundles', {extends: '*.blocks'})
                .addTech('html');
    });
};
```
In this case `*.bundles` level inherits all config from `*.blocks` level and adds `html` tech to bundle levels.

## .bem/level.js

Another way of specifying level config is to place `.bem/level.js` file in level directory. Contents of this file takes precedence over `make.js` settings.
This file is a node module which exports a single function which returns a class with the level settings. To start configuring level you should call
`BEM.defineLevel()`. Call to `createClass` method of a builder finishes creation of a level:

```javascript
module.exports = function(BEM) {
    return BEM.defineLevel()
        .addTechs('js', 'css')
        .createClass();
}
```

Configuration methods are the same as for `levels` section of the makefile.

For extending level defined in `.bem/level.js` you can use base levels `extend` method:

```javascript
module.exports = function(BEM) {
    var BaseLevel = require('/path/to/base/level')(BEM);
    return BaseLevel.extend()
        .addTechs('html')
        .createClass();
}
```



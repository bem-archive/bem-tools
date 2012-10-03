# Level (.bem/level.js)

A level should have `.bem/level.js` configuration file which contains the meta information about the level:

- the mapping rules between the BEM entities and the file system
- the thech modules defined on the level
- the meta information for the build system

When the `bem create level` command is used to create a level the empty `.bem/level.js` file will be also created.
Which means that this level is «standard» one. The logic for standard level is defined in the `Level` class within
[lib/level.js](https://github.com/bem/bem-tools/blob/master/lib/level.js).

As the `.bem/level.js` file is a CommonJS module it's easy to override the level's behavior. `bem-tools` creates a new
class inherited from the standard `Level` class using export of this module as a class extention (under the hood the
[inherit](https://github.com/dfilatov/node-inherit) module is used).

In the example bellow the `getTechs()` method is overriden.

```js
exports.getTechs = function() {

    return {
        'bemjson.js': ''
        'css': 'path/to/my/css-tech-module.js'
    }

};
```

## The levels inheritance

To avoid the copy and paste of the same code among several levels you can put the common parts into the independant
modules and inherit them. This way you can build up the levels hierarchy.

To specify the base level you should export it in the `baseLevelPath` property. For example

```js
exports.baseLevelPath = require.resolve('path/to/base/level.js');
```

It's also possible to create the inherited levels using the command

    bem create level <your-level-name> --level path/to/base/level.js

## The mapping rules between BEM entities and the file system

By default the following mapping scheme is used (this example is about the `css` tech):

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

If you want to use a custom scheme override the appropriate `match*()` and `get*()` methods in the `.bem/level.js` file.

## Tech modules defined on the level

To define a list of the tech modules used on the level export the `getTechs()` function. It should return an object
the keys of which contain the tech names and the values contain on of the following:

- the absolute tech path;
- a short tech name — a tech module with such name bundled with `bem-tools` will be used;
- an empty string — the default tech implementation will be used.

By deault there is no any techs defined explicitly on a level. In the case some techs are used within such a level
by a short name (for example `css`, `js`, etc) then the appropriate tech modules bundled with `bem-tools` are loaded.
If such do exist of course. The full list of such techs can be found there [lib/techs](https://github.com/bem/bem-tools/tree/master/lib/techs).

If you try to use a tech which was not defined explicitly and which is not bundled with `bem-tools` - the default tech
will be used (see [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js)).

The techs defined on the level are used:

- by the `bem create` command
- by the `bem build` command
- by the file system introspection (see the `getLevelByIntrospection()` of the `Level` class)
- during the project build with the `bem make` and `bem build` commands

It's recommended to define explicitly the used techs.

## The build system meta information

To let the build system know which levels should be used to build one bundle or another set the `bundleBuildLevels`
property within an object returned by the `getConfig()` function to an array of these levels.

```js
exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            // your levels here
        ])

    });

};
```

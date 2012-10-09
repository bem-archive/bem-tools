# Tech modules

## API

Look for the documentation in the source code [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

## Creating tech module

There are many ways to write a tech module.

Whatever manner you choose you can refer to the tech object from methods using `this`.
Any base method is available using `this.__base(...)` call. Tech class can be referenced
using `this.__class`. Thanks to [inherit](https://github.com/dfilatov/node-inherit) module
that helps us to organize inheritance here.

### Trivial way

You only need to declare regular CommonJS module and export some of its
functions to redefine them. By default your tech will derive from base `Tech` class
defined in module [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

```js
exports.getCreateResult = function(...) {
    // your code goes here
};
```

You can also group all methods in `techMixin` object. This is a recommended way.

```js
exports.techMixin = {

    getCreateResult: function(...) {
        // your code goes here
    }

};
```

### Simple way

Besides function, you can also export `baseTechPath` variable to define an
absolute path to a tech module you are extending. Or you can

```js
var BEM = require('bem');

exports.baseTechPath = BEM.require.resolve('./techs/css');
```

You can also derive from tech module by its name using `baseTechName` variable.
Base class will be chosen in the context of level where tech module will be used.

```js
exports.baseTechName = 'css';
```

In this example new tech will derive from `css` tech declared on level in file
`.bem/level.js`.

### Hardcore way

If you need a total control, you can create a module that exports
the whole `Tech` class.

```js
var INHERIT = require('inherit'),
    BaseTech = require('bem/lib/tech').Tech;

exports.Tech = INHERIT(BaseTech, {

    create: function(prefix, vars, force) {
        // do some creation work
    },

    build: function(prefixes, outputDir, outputName) {
        // organize own build process
    }

});
```

If you need to base your tech on an existing one written in a simple way use
`getTechClass()` function to get its class. We recommend to use `getTechClass()`
function all the time to not depend on tech implementation.

```js
var INHERIT = require('inherit'),
    BEM = require('bem'),
    BaseTech = BEM.getTechClass(require.resolve('path/to/tech/module'));

exports.Tech = INHERIT(BaseTech, {

    // your overrides go here

});
```

### Examples of tech modules

 * [bem-tools/lib/techs/](https://github.com/bem/bem-tools/tree/nodejs/lib/techs)
 * [bem-bl/blocks-common/i-bem/bem/techs/](https://github.com/bem/bem-bl/tree/master/blocks-common/i-bem/bem/techs)

# Migration from 0.6.x to 1.0.0

## Replace external libraries support with `bower-npm-install`

External libraries installation support was removed from bem-tools 1.0.0. You
should use [`bower-npm-install`](https://github.com/arikon/bower-npm-install) instead.

1.  Install `bower` and `bower-npm-install`:
        npm install -g bower bower-npm-install
2.  Create `bower.json` file in the root directory of your project. You can use
    `bower init` command to launch a wizard that will help initializing project.
3.  Replace `libraries` declarations in `.bem/make.js` file with `dependecies` declaration
    in `bower.json` file.
    * check if your library present in bower registry:
            bower search <library name>
    * if library has been found, use only library name and version/commit hash `bower.json`.
        Otherwise, you should also specify full git repo URL.
    * `<lib>@<tag>` from 0.6.x `make.js` should become `"<lib>": "<tag>"` or
        `"<lib>": "<repo>#<tag>"` in `bower.json`;
    * `<lib>@<commit hash>` should become `"<lib>" : "<commit hash>"` or
        `"<lib>" : "repo#<commit hash>"`;
    * `<lib>@<branch>` has no compatible replacement in bower. We recommend to replace it
         with either tag or commit hash.

    For example, if you have following `make.js`:

    ```javascript
    MAKE.decl('Arch', {
        libraries: [
            'bem-core@09c09aff2f2b505872840a2c693759bd4c429491',
            'bem-pr@0.3.5'
        ]
    });
    ```

    And following `.bem/repo.db.js`:
    
    ```javascript
    module.exports = {
        'bem-core' : {
            type     : 'git',
            url      : 'git://github.com/bem/bem-core.git'
        },
        'bem-pr' : {
            type     : 'git',
            url      : 'git://github.com/narqo/bem-pr.git'
        }
    };
    ``` 

    You should create following section in `bower.json`:

    ```javascript
    {
        ...
        "dependencies": [
            "bem-core": "09c09aff2f2b505872840a2c693759bd4c429491",
            "bem-pr": "git://github.com/narqo/bem-pr.git#0.3.5"
        ]
    }
    ```

    After that, `.bem/repo.db.js` file and `libraries` section in `make.js`
    can be safely removed.

4.  Create file `.bowerrc` in the project root and configure `bower` to install
    libraries into `libs` directory:

    ```javascript
    {
        "directory": "libs"
    }
    ```

5. Run `bower-npm-install` from the project root.

## New `make.js` file format

In bem-tools 1.0.0 make file has a new format. It now should export a function which 
receives `make` variable explicitly. Makefile is split up into several sections. Old
setup code should be performed in `nodes` section.

This example make file:

```javascript
MAKE.decl(...)

//0.6.x setup code
...

```

should be rewritten to:

```javascript
module.exports = function(make) {

    make.nodes(function(registry) {
        registry.decl(...)

        //0.6.x setup code
        ...
    });

};
```

## `create-<techname>-optimizer-node()` is replaced with `min.<techname>` techs

In previous versions, minification was performed by special `borschik` node. In
1.0.0 its done via `min` tech. 

For standard tech supplied with bem-tools, such as `js` and `css` you should just add `min.<techname>`
to `BundleNode`'s `getTechs()` method.

But if you had minification for non-standard techs set up in your `make.js`, you should change your
code as follows:

1.  In `make.js` in `BundleNode` config remove all custom `create-<techname>-optimizer-node()`
    methods.
2.  For each tech that needs minification change your **bundle level config**
    (usually, `.bem/levels/bundle.js`) to contain `min` tech defintion:

    ```javascript
    exports.getTechs = function() {
        return {
            ... //other tech setup
            'min.<techname>': {
                baseTechName: 'v2/min.js',

                getSuffixes: function() {
                    return [/* <techname's> output siffixes*/];
                }

                getDependencies: function() {
                    //run min tech after source
                    return ['<techname>'];
                }
            }
        }
    };
    ```

3.  Add `min.<techname>` to your `BundleNode`'s `getTechs()` method in `.bem/make.js` file:

    ```javascript
    registry.decl('BundleNode', {

        getTechs: function() {
            return [
                'bemjson.js',
                'bemdecl.js',
                ...
                'min.<techname>'
            ]
        }
    });
    ```

For example, if you had following `BundleNode` declaration in your `make.js`:

```javascript
registry.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml',
            'browser.js+bemhtml',
            'css',
            'html'
        ];
    }

    'create-browser.js+bemhtml-optimizer-node': function() {
        this['create-js-optimizer-node'].apply(this, arguments);
    }
});
```

then you should:
1. Remove `create-browser.js+bemhtml-optimizer-node()` method,
2. Change your `.bem/levels/bundle.js` to contain `min.browser.js+bemhtml` tech
3. Add `min.css` and `min.browser.js+bemhtml` tech to your build process:

`.bem/levels/bundle.js`:

```javascript
exports.getTechs = function() {
    return [
        ... //old code
        'min.browser.js+bemhtml': {
            baseTechName: 'v2/min.js',

            getSuffixes: function() {
                return ['js']; //browser.js+bemhtml outputs js files
            },

            getDependencies: function() {
                return ['browser.js+bemhtml'];
            }
        }
    ]
}
```
`BundleNode` in `.bem/make.js`:

```javascript
registry.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml',
            'browser.js+bemhtml',
            'min.browser.js+bemhtml',
            'css',
            'min.css',
            'html'
        ];
    }
});
```

## Minimized file name changed

In previous versions, minimized versions of files had `_` prefix in their name.
In 1.0.0 this files have `min` suffix by default. Be sure to change URLs in
your `bemjson` files from `_<name>.<ext>` to `<name>.min.<ext>`.

## Libraries do not get installed or updated by `bem make`

You should now explicitly call `bower-npm-install` each time you change
your dependencies in `bower.json`.

## Legacy tech modules support removed

You should migrate your legacy tech modules to APIv2. Legacy modules
(do not confuse with API V1 modules) are not supported anymore. APIv1
is still supported, but will produce warnings during build.

## `bem bench` command moved to separate package

In `1.0.0` `bem bench` is no longer shipped with `bem-tools`. It has been
moved to its own [package](https://github.com/bem/bem-bench). To use it
you'll need to install it to the same directory with `bem-tools`:

    npm install bem-bench

Or if you use globally installed `bem-tools`:

    npm install -g bem-bench

You can use it as `bem-tools` subcommand (`bem bench`) or as separate
utility (`bem-bench`).

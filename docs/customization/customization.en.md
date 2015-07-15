# Customization

There is a default build behavior programmed in the build system. The configuration files allow you to adjust it a little or change it completely.
To make `bem make` work you should have `.bem/level.js` file within your levels. It should contain the `getTechs()` function, which returns object with the tech definitions used on the level.
And it should have function `getConfig()`:

```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': '',
        'js': 'js-i',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'priv.js': '../../.bem/techs/priv.js',
        'html': '../../bem-bl/blocks-common/i-bem/bem/techs/html'
    };
};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`getTechs()` returns an object with used techs. Object properties (for example, `'bemjson.js'`, `'js'`, `'bemhtml.js'`) define the
tech names. Object values specify the paths to the appropriate tech files (`''`, `'js-i'`, `'../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'`).
A path can be relative or absolute, it can be empty, or it can specify just a file name. In latter case, the
tech will be considered being standard (bundled with `bem-tools`) and the file will be looked up in the `[bem]/lib/techs` folder.

`getConfig()` function returns an object with the `bundleBuildLevels` property, containing the array of the used block levels.

Another (optional) configuration file is `.bem/make.js` located in the project root. Core of the build system is a graph of nodes, each of which executes its own part of the whole build process. `make.js` allows you to adjust nodes behavior and change build graph.

There are several standard node types:

 * `Node` - base node, implements basic functionality. All other nodes are inherited from this one.
 * `LibraryNode` - retrieves external libraries.
 * `LevelNode` - inspects the contents of a level and constructs graph branch accordingly, to build the level.
 * `BundlesLevelNode` - inherits from `LevelNode` and builds the bundles levels.
 * `BundleNode` - constructs graph branch for a bundle.
 * `MergedBundleNode` - builds merged bundle (aka common bundle).
 * `BorschikNode` - processes files with the `borschik` utility, `CSSO` and `UglifyJS`.
 * `Arch` - builds initial graph, which by default consists of `LibraryNode`, `BundlesLevelNode` and `LevelNode` nodes.

To alter build system behavior for your project you need to alter behavior of the nodes. This can be achieved by adding `MAKE.decl()` calls in the `.bem/make` file. `MAKE.decl()` is a helper function which accepts two arguments. First one is the node name which we want to change, second - an object with redefining methods.

```js
MAKE.decl('BundleNode', {

});
```

Node classes have some fundamental methods, which take care about the build process:

* `isValid()` - validates the node - indicates is there a need to rebuild it or not. If node artifacts were built during previous build and dependency nodes were not rebuilt after that, the node is considered being valid. In other words if you changed a file after first build then only the nodes which depend on this file will be rebuilt during the consequent build.
* `make()` - implements the build logic for the node.
* `run()` - node entry point. In the default implementation it executes `isValid` method and in case it returns false the make method will be executed next.
* `clean()` - removes the build artifacts for the node.

## Sample configuration files for some typical tasks

### Build of static HTML, CSS, JS, BEMHTML templates on the pages level

In this case, BEMJSON file is used as a source file. Also blocks level `blocks` are included, as well as `blocks-common` and `blocks-desktop` from `bem-bl`.

`pages/.bem/level.js`
```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {

    return {
        'bemjson.js': '',
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'css': 'css',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'html': '../../bem-bl/blocks-common/i-bem/bem/techs/html.js'
    };

};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`.bem/make.js`
```js
MAKE.decl('Arch', {

    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git'
            }
        };

    }

});

MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js',
            'html'
        ];
    }

});
```


### Build of CSS, JS, BEMHTML templates on the pages level

In this case, `bemdecl` declaration file is used as a source file. Also blocks level `blocks` are included, as well as `blocks-common` and `blocks-desktop` from `bem-bl`.

`pages/.bem/level.js`
```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {

    return {
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'css': 'css',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'
    };

};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`.bem/make.js`
```js
MAKE.decl('Arch', {

    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git'
            }
        };

    }

});

MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js'
        ];
    }

});
```

### Build of localized JS and CSS, BEMHTML templates on the pages level

In this case, `bemdecl` declaration file is used as a source file. Also blocks level `blocks` are included, as well `blocks-common` and `blocks-desktop` from `bem-bl`.

```js
// pages/.bem/level.js

var BEM = require('bem'),
    PATH = require('path'),

    BEMBL_TECHS_PATH = '../../bem-bl/blocks-common/i-bem/bem/techs/';

exports.getTechs = function() {

    return {
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'i18n': PATH.join(BEMBL_TECHS_PATH, 'i18n.js'),
        'i18n.js': PATH.join(BEMBL_TECHS_PATH, 'i18n.js.js'),
        'css': 'css',
        'bemhtml.js': PATH.join(BEMBL_TECHS_PATH, 'bemhtml.js')
    };

};

exports.getConfig = function() {

    return BEM.util.extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

```js
// .bem/make.js

MAKE.decl('Arch', {

    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git',
                treeish: '0.3'
            }
        };

    }

});


MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemdecl.js',
            'deps.js',
            'i18n',
            'bemhtml',
            'i18n.js',
            'css'
        ];

    },

    'create-i18n.js-optimizer-node': function(tech, sourceNode, bundleNode) {

        return this.createBorschikOptimizerNode('js', sourceNode, bundleNode);

    }

});
```

### The block libraries

The block libraries are not used by default. To use a library add the following code to `.bem/make.js`:

```js
MAKE.decl('Arch', {
    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git'
            }
        };
    }
});
```

Where:

* `'Arch'` - node class name which we want to redefine. Arch builds initial build graph.
* `getLibraries` - a method of the `Arch` class which returns the associative array of the used block libraries.
* `'bem-bl'` — the name of the library and the folder where it will be copied to.
* `type` - the type of the library source. We use `git` in the example, so the library will be checked out of a Git repository.
Possible values are: `'git'`, `'svn'`, `'symlink'`. `svn` works the same as `git`, but with SVN repositories. `symlink` - creates a symbolic link in the project folder to the library folder. The library path is specified by the `relative` property.
* `url` - URL to the SVN/Git repository.

Also you can use shorter code:

```js
MAKE.decl('Arch', {
    libraries: {
        'bem-bl': {
            type: 'git',
            url: 'git://github.com/bem/bem-bl.git'
        }
    }
});
```

### Block levels

The folders in the project root matching the `blocks*` mask are considered being the blocks level. You can change this using the following code:

```js
MAKE.decl('Arch', {
    blocksLevelsRegexp:  /regular expression/,
});
```

The regular expression will be used to match the folders in the project root. A folder which does match will be used as the blocks level.

If you need some logic for the levels selection you can achieve that by redefining the `createBlocksLevelsNodes()` method:

```js
MAKE.decl('Arch', {
    createBlocksLevelsNodes: function(parent, children) {
        // Create the LevelNode instance
        var node1 = new LevelNode(...);
        // Add it into the graph
        this.arch.setNode(node1, parent, children);

        var node2 = new LevelNode(...);
        this.arch.setNode(node2, parent, children);

        // return an array with the Ids of the created nodes
        return [node1.getId(), node2.getId()];
    }
});
```

### The bundles and the pages

The folders in the project root matching the `pages*` abd `bundles*` masks are considered being bundle level. You can change this using the following code:

```js
MAKE.decl('Arch', {
    bundlesLevelsRegexp: /regular expression/,
});
```

And for more precise control:

```js
MAKE.decl('Arch', {

    getBundlesLevels: function() {
        return [
            'pages-desktop',
            'pages-touch',
            'bundles/common'
        ];
    }

});
```

For every bundle the following target files are built by default:

 * `.bemhtml.js`
 * `.html`
 * `.css`
 * `.ie.css`
 * `.js`
 * `_*.css`
 * `_*.ie.css`
 * `_*.js`

plus the intermediate files:

 * `.bemdecl.js`
 * `.deps.js`
 * `.deps.js.deps.js`
 * `.bemhtml.js.meta.js`
 * `.js.meta.js`
 * `.css.meta.js`
 * `.ie.css.meta.js`

`.bemjson.js` file is considered as a source file. If it does not exist, `.bemdecl.js` is used then. If `.bemdecl.js` does not exist too, `.deps.js` will be used. For the cases when `.bemjson.js` does not exist static html will not be built.

To change the list of the file techs to use, add the following code into `.bem/make.js`:

```js
MAKE.decl('BundleNode', {

    getTechs: function() {
        return [
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js',
            'priv.js'
        ];
    }
});
```

**NB** Techs in the list should be in the order of dependency on each other. Tech `B`, which depends on `A`, should go **bellow** `A`. The source file tech should also be in the list, for example `bemjson.js`.

### The merged bundles

The merged bundle is a bundle that includes the declarations of all bundles on the level. For example CSS in a merged bundle will contain the styles from all of the bundles.

The following code will enable the build of the merged bundles for all levels:

```js
MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        return true;
    }
});
```

If you need a merged bundle for the selected levels only (for `pages-desktop` level in the example):

```js
var PATH = require('path');

MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        if (this.getLevelPath() === 'pages-desktop') return true;

        return false;
    }
});
```

The `getLevelPath()` method returns the relative path to the level. We can use it to decide whether we should enable some special logic for current level or not.

To change the merged bundle name use the code:

```js
MAKE.decl('BundlesLevelNode', {

    mergedBundleName: function() {
        return 'mymergedbundle';
    }

});
```

## Production and development builds

By changing the `YENV` environment variable value, you can switch between the production and development builds.

In production mode static files are processed with the `borschik` utility. It expands the include directives and puts the result content in the file with the `_` prefix. For example, `index.css` has the directives to include `blocks/block1.css` and `blocks/block2.css`. `_index.css` will be created with the content of both `block1.css` and `block2.css`. Also, the
CSS files are optimized with the [CSSO](https://bem.info/tools/optimizers/csso/) utility, the JS files are optimized with UglifyJS. In development mode `borschik` is used only, no optimizations take the place.

The default mode is `development`. To use the production mode set `YENV` to `production`.

Environment variables can be set in `.bem/make.js`, for example:

```js
process.env.YENV = 'production';
```

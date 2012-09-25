# BEM Tools [![Build Status](https://secure.travis-ci.org/bem/bem-tools.png?branch=nodejs)](http://travis-ci.org/bem/bem-tools)
Toolkit to work with files based on [BEM methodology](http://bem.github.com/bem-method/pages/beginning/beginning.en.html).

## Installation
You need [NodeJS 0.6+](http://nodejs.org/) or later and [npm 1.x](http://npmjs.org/).
After this it suffices `npm -g install bem`.

 * Install [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

 * Install [npm](http://npmjs.org)

        curl http://npmjs.org/install.sh | sudo sh

 * After installation configure `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    or

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Install [bem-tools](https://github.com/bem/bem-tools)

        sudo npm -g install bem

 * Use this command [bem-tools](https://github.com/bem/bem-tools) to install the development version

        sudo npm -g install bem@unstable

### bem-bl

If you are going to use `bem` with
[bem-bl](https://github.com/bem/bem-bl) block library, you should also install
[XJST](https://github.com/veged/xjst) and [OmetaJS](https://github.com/veged/ometa-js).

    sudo npm -g install xjst ometajs

## Usage
Get the list of commands with `bem --help`.
To read about commands and subcommands use `bem COMMAND --help` or `bem COMMAND SUBCOMMAND --help`.

### Shell completion

#### bash

To make completions for bem-tools available in your bash, run following
command (ensure that you have bash-completion installed, first). Run this

    bem completion > /path/to/etc/bash_completion.d/bem

and restart bash.

If you aren't using `bash-completion`, you can add `bem completion` to your `.bashrc` and reload:

    bem completion >> ~/.bashrc
    source ~/.bashrc

#### zsh

If you use `zsh`, you can add `bem completion` to your `.zshrc` and reload:

    bem completion >> ~/.zshrc
    source ~/.zshrc

### Commands
#### bem create

You can create following entities using `bem create`:

 * levels of defenition
 * blocks
 * elements
 * modifiers

##### Level of defenition

Level of defenition is a directory that holds blocks and an utility directiry `.bem`.

A `.bem` directory holds configuration of a current level:

 * naming convention
 * links to the technologies

An example of technologies' links (this is `blocks-desktop` level of
`bem-bl` block library):

    https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js

###### Create new level of defenition named `blocks` under current directory:

    bem create level blocks

###### Create a level for pages

In `bem-tools` terms pages are blocks as well and a directory which holds pages is a level of
defenition itself. To create such a directory run this:

    bem create level pages

###### Create a level based on an existing one

`bem create level` allows to use an existing level as a prototype for a level it creates.

    bem create level --level bem-bl/blocks-desktop blocks

##### Block

Block is a bunch of files in different technologies that hold block's implementation.

###### Create a new block

    bem create block b-my-block

By default, a block has several techs: (`bemhtml`, `css`, `js`).

###### Create a new block using concrete tech

Flags -t (-T) are to create files of technologies you need:

    bem create block -t deps.js b-my-block
        // Creates a block implementation in deps.js technology, ecxept of default techs.

    bem create block -T css b-my-block
        // Creates only CSS technology for a block

    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // -T flag is useful when you need to add a new tech to the block existed

The value of this flag may be either tech's name (e.g `css`) or a path to tech module.

Tech names may be listed in `.bem/level.js` file of a level.
E.g., https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js

You can find the examples of tech modules in the repo:

    https://github.com/bem/bem-tools/tree/master/lib/techs

###### Create element

Create element named `elem` for block `b-my-block`

    bem create elem -b b-my-block elem

###### Create modifier of block or element

Create modifier named `mod` for block `b-my-block`

    bem create mod -b b-my-block mod

Create modifier named `mod` having value `val` for block `b-my-block`

    bem create mod -b b-my-block mod -v val

Create modifier named `mod` for element `elem` of block `b-my-block`

    bem create mod -b b-my-block -e elem mod

Create modifier named  `mod` having value `val` for element `elem` of block `b-my-block`

    bem create mod -b b-my-block -e elem mod -v val

###### Create any BEM entity using `bem create` command only

You can create any BEM entities or bunches of them using `bem create` command.

Create blocks named `b-block1` and `b-block2`

    bem create -b b-block1 -b b-block2

Create elements named `elem1` and `elem2` for block `b-block`

    bem create -b b-block -e elem1 -e elem2

Create modifier names `mod` of block `b-block`

    bem create -b b-block -m mod

Create modifier named `mod` of block `b-block` having values `val1` and `val2`

    bem create -b b-block -m mod -v val1 -v val2

Create modifier named `mod` for element `elem` of block `b-block`

    bem create -b b-block -e elem -m mod

Create modifier named `mod` having values `val1` and `val2` for element `elem` of block `b-block`

    bem create -b b-block -e elem -m mod -v val1 -v val2

#### bem build

`bem build` command builds page files in different techs, according to a page declaration.

##### Create bemdecl.js file from page's bemjson

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemjson.js -t bemdecl.js \
        -o pages/index -n index

You can use either tech's name or a path to its module as a value of -t flag. This
module says how to build a final file from a declaration.

E.g., this is a module for `deps.js`: https://github.com/bem/bem-tools/blob/master/lib/techs/deps.js.js

##### Create deps.js file from bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

###### Create js and css files for a page from deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t css \
        -o pages/index -n index

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t js \
        -o pages/index -n index

###### Create bemhtml.js template for a page from deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemhtml.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

There is an example how pages are built using `bem build` in our test project that uses
`bem-bl` block library: https://github.com/toivonen/bem-bl-test/blob/master/GNUmakefile

#### bem decl

`bem decl` is to work with declaration files. Thus,

 * to merge two or more decls into one
 * «subtract» decls

All subcommands of `bem decl` can take either bemdecl.js or deps.js as input declaration formats.
as input declaration (via `-d` flag).

Ouput data (`-o` flag) is always in `deps.js` format.

##### bem decl merge

`bem decl merge` is to merge two or more decls into one. It is useful if you need, for example, to build
one file for several pages.

###### Create a decl for all the pages

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

##### bem decl subtract

`bem decl subtract` is to «subtract» all next decls from the first one.
You may use it to create a bundle that you request by application.

###### Create a decl for a "heavy" block requested by application

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js

##### bem make
`make` command implements the build process of the BEM projects. You don't have to write your own scripts or makefiles (for GNU make or other build system) to build your BEM project.

During the build `bem make`

 * fetches the block libraries
 * builds the levels content
 * builds the bundles
 * generates the templates (`bemhtml`)
 * generates `html` from `bemjson.js`
 * generates the static content files (`js`, `css`)
 * expands the `@import` derectives in `css` files (`borschik`)
 * expands the `borschik:link:include` directives  in `js` files (`borschik`)
 * optimizes `css` files using `csso`
 * optimizes `js` files using `uglifyjs`

##### bem server

`bem server` command runs a development server. It makes the project files being accessible via the http protocol.
This includes the files which are generated during the build process. So the server can be useful when you develop the
static pages using the bem method. You just edit the files, refresh the browser and get updated page. All the files
which are affected by your changes will be rebuilt automatically.
In the case your project has no static pages you can configure your backend server and production environment to retrieve
the stylesheets and scripts from the bem server. bem server accepts connections via normal TCP socket and via UNIX domain socket.

By default the current directory is considered as the project root. You can change it using the --project (-r) option.

Default TCP port is 8080. You can change it using the --port (-p) option.

When requested URL is mapped to a directory, the server will check if there is an index.html file or it's possible to build it.
In the case one of these is true the content of the file will be returned to browser. The directory content listing will be returned
otherwise.

#### Build configuration

There is a default build behavior programmed in the build system. The configuration files allow to adjust it a little or change it completely.
To make `bem make` work you should have `.bem/level.js` file within your levels. It should contain the `getTechs()` function, 
which returns object with the tech definitions used on the level.
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

`getTechs()` returns an object with used techs. Object properties (for example `'bemjson.js'`, `'js'`, `'bemhtml.js'`) define the
tech names, object values specify the paths to the appropriate tech files (`''`, `'js-i'`, `'../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'`).
A path can be relative or absolute, it can be empty, or it can specify just a file name. When the latter case is used the
tech will be considered being standard (bundled with bem-tools) and the file will be looked up in the `[bem]/lib/techs` folder.

`getConfig()` function returns an object with the `bundleBuildLevels` property, containing the array of the used block levels.

Another (optional) configuration file is `.bem/make.js` located in the project root. Core of the build system is a graph
of nodes, each of which executes own part of the whole build process. `make.js` allows you to adjust nodes behavior and change build graph.
There are several standard node types:
 * `Node` - base node, implements basic functionality. All other nodes are inherited from this one
 * `LibraryNode` - retrieves external libraries
 * `LevelNode` - inspects the contents of a level and constructs graph branch accordingly to build the level
 * `BundlesLevelNode` - inherits from `LevelNode` and builds the bundles levels
 * `BundleNode` - constructs graph branch for a bundle
 * `MergedBundleNode` - builds merged bundle (aka common bundle)
 * `BorschikNode` - processes files with the `borschik` utility, `csso` and `uglifyjs`
 * `Arch` - builds initial graph, which by default consists of `LibraryNode`, `BundlesLevelNode` and `LevelNode` nodes

To alter build system behavior for your project you need to alter behavior of the nodes. This can be achieved by adding `MAKE.decl()` calls in the `.bem/make` file. `MAKE.decl()` is a helper
function which accepts two arguments. First one is the node name which we want to change, second - an object with overriding methods.

```js
MAKE.decl('BundleNode', {

});
```

Node classes have some fundamental methods, which take care about the build process:
 * `isValid()` - validates the node - indicates is there a need to rebuild it or not. If node artifacts were built during
  previous build and dependency nodes were not rebuilt after that, the node is considered being valid. In other words
  if you changed a file after first build then only the nodes which depend on this file will be rebuilt during the
  consequent build.
 * `make()` - implements the build logic for the node.
 * `run()` - node entry point. In the default implementation it executes isValid method and in case it returns false the make method will be executed next.
 * `clean()` - removes the build artifacts for the node.

##### Sample configuration files for some typical tasks

###### Build of static html, css, js, bemhtml templates on the level `pages`. Bemjson file is used as a source file. Also using blocks level `blocks`, and also `blocks-common` and `blocks-desktop` from bem-bl.

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


###### Build of css, js, bemhtml tamples on the level `pages`. `bemdecl` declaration file is used as a source file. Also using blocks level `blocks`, and also `blocks-common` and `blocks-desktop` from bem-bl.

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

###### The block libraries

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
 * `'Arch'` - node class name which we want to override. Arch builds initial build graph.
 * `getLibraries` - a method of the Arch class, which returns the associative array of the used block libraries.
 * `'bem-bl'` — the name of the library and the folder where it will be copied to.
 * `type` - the type of the library source. We use git in the example, so the library will be checked out of a git repository.
 Possible values are: `'git'`, `'svn'`, `'symlink'`. `svn` works the same as `git`, but with svn repositories. `symlink` -
 creates a symbolic link in the project folder to the library folder. The library path is specified by the `relative` property.
 * `url` - URL to the svn/git repository

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

###### Block levels

The folders in the project root matching the `blocks*` mask are considered being the blocks level. You can change this using the following code:

```js
MAKE.decl('Arch', {
    blocksLevelsRegexp:  /regular expression/,
});
```

The regular expression will be used to match the folders in the project root. A folder which does match will be used as the blocks level.

If you need some logic for the levels selection you can achieve that by overriding the `createBlocksLevelsNodes()` method:

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

###### The bundles and the pages

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

and the intermediate:

 * `.bemdecl.js`
 * `.deps.js`
 * `.deps.js.deps.js`
 * `.bemhtml.js.meta.js`
 * `.js.meta.js`
 * `.css.meta.js`
 * `.ie.css.meta.js`

`.bemjson.js` file is considered as a source file. If it does not exist, `.bemdecl.js` is used then. If `.bemdecl.js`
 does not exist too, `.deps.js` will be used. For the cases when `.bemjson.js` does not exist static html will not be built.

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

**IMPORTANT:** Techs in the list should be in the order of dependency on each other.  Tech B, which depends on A, should go **bellow** A. The source file tech should also be in the list, for example `bemjson.js`.

###### The merged bundles
The merged bundle — a bundle which includes the declarations of all bundles on the level. So for example css in a merged bundle will contain the styles from all of the bundles.

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

The `getLevelPath()` method returns the relative path for the level. We can use it to decide should we enable some special logic for current level or not.

To change the merged bundle name use the code:
```js
MAKE.decl('BundlesLevelNode', {

    mergedBundleName: function() {
        return 'mymergedbundle';
    }

});
```

##### Production and Development builds
By changing the `YENV` environment variable value, you can switch between the production and development builds.
In production mode static files are processed with the `borschik` utility. It expands the include directives and puts the
result content in the file with the `_` prefix. For example, `index.css` has the directives to include `blocks/block1.css`
and `blocks/block2.css`. `_index.css` will be created with the content of both `block1.css` and `block2.css`. Also the
`css` files are optimized with the `csso` utility, the `js` files are optimized with `uglifyjs`. In development mode
`borschik` is used only, no optimizations take the place.

The default mode is development. To use the production mode set `YENV` to `production`.

Environment variables can be set in `.bem/make.js`, for example

```js
process.env.YENV = 'production';
```

### Configuration files
#### Level (.bem/level.js)

A level should have `.bem/level.js` configuration file which contains the meta information about the level:

- the mapping rules between the BEM entities and the file system
- the thech modules defined on the level
- the meta information for the build system

When the `bem create level` command is used to create a level the empty `.bem/level.js` file will be also created.
Which means that this level is «standard» one. The logic for standard level is defined in the `Level` class within 
(lib/level.js)[https://github.com/bem/bem-tools/blob/master/lib/level.js].

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

##### The levels inheritance

To avoid the copy and paste of the same code among several levels you can put the common parts into the independant
modules and inherit them. This way you can build up the levels hierarchy.

To specify the base level you should export it in the `baseLevelPath` property. For example

```js
exports.baseLevelPath = require.resolve('path/to/base/level.js');
```

It's also possible to create the inherited levels using the command

    bem create level <your-level-name> --level path/to/base/level.js

##### The mapping rules between BEM entities and the file system

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

##### Tech modules defined on the level

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

##### The build system meta information

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

### Tech modules

#### API

Look for the documentation in the source code [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

#### Creating tech module

There are many ways to write a tech module.

Whatever manner you choose you can refer to the tech object from methods using `this`.
Any base method is available using `this.__base(...)` call. Tech class can be referenced
using `this.__class`. Thanks to [inherit](https://github.com/dfilatov/node-inherit) module
that helps us to organize inheritance here.

##### Trivial way

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

##### Simple way

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

##### Hardcore way

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

##### Examples of tech modules

 * [bem-tools/lib/techs/](https://github.com/bem/bem-tools/tree/nodejs/lib/techs)
 * [bem-bl/blocks-common/i-bem/bem/techs/](https://github.com/bem/bem-bl/tree/master/blocks-common/i-bem/bem/techs)

### API usage

Starting from 0.2.0 version it is possible to use `bem-tools` from API.

`bem` module exports the object of a command that has an `api` property.
It is to use in this way:

```js
var Q = require('q'),
    BEM = require('bem').api,

    techs = ['css', 'js'],
    blocks = ['b-block1', 'b-block2'];

Q.when(BEM.create.block({ forceTech: techs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

The example above shows that you can use all the commands (including subcommands).

A command accepts two args:

 * **Object** `opts` command options
 * **Object** `args` command arguments

It returns an object of `Q.promise` type.

#### BEM.create

Commands to create BEM entities.

##### BEM.create.level()

Creates a level of defenition.

###### Options

 * **String** `outputDir` a directory of output (current directory by default)
 * **String** `level` a «prototype» of the level
 * **Boolean** `force` key to force level's creating if it already exists

###### Arguments

 * **Array** `names` Namef of levels you are creating

###### Example

```js
var PATH = require('path'),
    Q = require('q'),
    BEM = require('bem').api,

    outputDir = PATH.join(__dirname, 'levels'),
    levels = ['blocks-common', 'blocks-desktop'];

Q.when(BEM.create.level({ outputDir: outputDir }, { names: levels }), function() {
    console.log('Create levels %s at %s', levels.join(', '), outputDir);
});
```

##### BEM.create()

Creates BEM entities: blocks, elems, modifiers and their values.

###### Options

 * **String** `level` Level directory (current directory by default)
 * **Array** `block` Block name (required)
 * **Array** `elem` Element name
 * **Array** `mod` Modifier name
 * **Array** `val` Modifier value
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating BEM entities files (rewrite)

###### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    forceTechs = ['css'],
    block = 'b-header',
    elem = 'logo',
    mods = ['lang'],
    vals = ['ru', 'en'];

Q.when(BEM.create({ forceTechs: forceTechs, block: block, mod: mods, val: vals }), function() {
    console.log('Create mod %s of block %s with vals %s', mods.join(', '), block, vals.join(', '));
});

Q.when(BEM.create({ forceTechs: forceTechs, block: block, elem: elem, mod: mods, val: vals }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', mods.join(', '), elem, block, vals.join(', '));
});
```

##### BEM.create.block()

Creates a block.

###### Options

 * **String** `level` A directory of block's level. (Current directory by default)
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use these techs only
 * **Array** `noTech` Exclude these techs
 * **Boolean** `force` Force files creating

###### Arguments

 * **Array** `names` List of block names

###### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    addTechs = ['bemhtml'],
    blocks = ['b-header'];

Q.when(BEM.create.block({ addTech: addTechs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

##### BEM.create.elem()

Creating an element.

###### Options

 * **String** `level` A directory of level. (Current directory by default)
 * **String** `blockName` A name of element's block (required)
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating element's files (to rewrite them)

###### Arguments

 * **Array** `names` List of element names

###### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    addTechs = ['bemhtml', 'title.txt'],
    block = 'b-header',
    elems = ['logo'];

Q.when(BEM.create.elem({ addTech: addTechs, blockName: block }, { names: elems }), function() {
    console.log('Create elems %s of block %s', elems.join(', '), block);
});
```

##### BEM.create.mod()

Creating a modifier for a block or an element.

###### Options

 * **String** `level` Level directory (current directory by default)
 * **String** `blockName` Block name of this modifier (required)
 * **String** `elemName` Element name
 * **Array** `modVal` Modifier value
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating modifier files (rewrite)

###### Arguments

 * **Array** `names` List of modifier

###### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    forceTechs = ['css'],
    block = 'b-header',
    elem = 'logo',
    mods = ['lang'],
    vals = ['ru', 'en'];

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, modVal: vals }, { names: mods }), function() {
    console.log('Create mod %s of block %s with vals %s', mods.join(', '), block, vals.join(', '));
});

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, elemName: elem, modVal: vals }, { names: mods }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', mods.join(', '), elem, block, vals.join(', '));
});
```

#### BEM.build()

Build files from blocks.

###### Options

 * **String** `outputDir` An output directory (current directory by default)
 * **String** `outputName` A filename (its prefix) for output
 * **Level** `outputLevel` Output level for BEM entity to create
 * **String** `block` Block name
 * **String** `elem` Element name
 * **String** `mod` Modifier name
 * **String** `val` Modifier name
 * **String** `declaration` A filename of input declaration (required)
 * **Array** `level` List of levels to use
 * **Array** `tech` List of techs to build

You should use one of the following to specify output prefix:

 * `outputName` to specify full path-prefix
 * `outputDir` plus `outputName` to specify directory path and file prefix (they will be joined for you)
 * `outputLevel` plus properties describing BEM entity: `block`, `elem`, `mod` and `val` (path-prefix will
   be constructed for you using level file mapping scheme)

###### Example

```js
var Q = require('q'),
    B = require('bem'),
    BEM = B.api,

    decl = 'page.deps.js',
    outputDir = 'build',
    outputName = 'page',
    levels = ['blocks-common', 'blocks-desktop'],
    techs = ['css', 'js'];

// use outputDir and outputName options
Q.when(
    BEM.build({
        outputDir: outputDir,
        outputName: outputName,
        declaration: decl,
        level: levels,
        tech: techs
    }),
    function() {
        console.log('Finished build of techs %s for levels %s. Result in %s/%s.* files.',
            techs.join(', '), levels.join(', '), outputDir, outputName);
    }
);

// use outputLevel option
var level = B.createLevel('path/to/level'),
    block = 'page';
Q.when(
    BEM.build({
        outputLevel: level,
        block: block
    }),
    function() {
        console.log('Finished build of techs %s for levels %s. Result in %s.* files.',
            techs.join(', '), levels.join(', '), level.getRelByObj({ block: block }));
    }
);
```

#### BEM.decl

Commands to work with declarations.

##### BEM.decl.merge()

Merging two or more declarations into one.

###### Options

 * **String** `output` A file for output result. By default output is in STDOUT
 * **Array** `declaration` List of filenames for declarations (required)

##### BEM.decl.subtract()

Subtracting the next declarations from the first one.

###### Options

 * **String** `output` A file for output result. By default output is in STDOUT
 * **Array** `declaration` List of filenames for declarations (required)

## Contribute to development 

### Executing autotests 

To verify that your changes do not break existing functionality we recommend to run autotests and check that all of them pass. You can do that by executing the following command in the root of the project:

    mocha 

### Running autotests with test coverage report

You can check the level of the code coverage by tests using the command: 

    make test-cover

Then open coverage.html file in a browser. Code lines which have not been executed during the tests run will be marked red.

<!-- Yandex.Metrika counter -->
<img src="//mc.yandex.ru/watch/12831025" style="position:absolute; left:-9999px;" alt="" />
<!-- /Yandex.Metrika counter -->

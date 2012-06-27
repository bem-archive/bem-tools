# BEM Tools [![Build Status](https://secure.travis-ci.org/bem/bem-tools.png?branch=nodejs)](http://travis-ci.org/bem/bem-tools)
Toolkit to work with files based on [BEM methodology](http://bem.github.com/bem-method/pages/beginning/beginning.en.html).

## Installation
You need [NodeJS 0.4.x](http://nodejs.org/) or later and [npm 1.x](http://npmjs.org/).

 * Install [bem-tools](https://github.com/bem/bem-tools)

        sudo npm -g install bem

 * Use this command [bem-tools](https://github.com/bem/bem-tools) to install the development version

        sudo npm -g install bem@unstable

### bem-bl

If you are going to use `bem` with
[bem-bl](https://github.com/bem/bem-bl) block library, you should also install
[XJST](https://github.com/veged/xjst) and [OmetaJS](https://github.com/veged/ometajs).

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

If you aren't using `bash-completion`, you can add `bem completion` to your `.bashrc`:

    bem completion >> ~/.bashrc

#### zsh

If you use `zsh`, you can add `bem completion` to your `.zshrc`:

    bem completion >> ~/.zshrc

then restart.

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

    https://github.com/bem/bem-tools/tree/nodejs/lib/techs

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

E.g., this is a module for `deps.js`: https://github.com/bem/bem-tools/blob/nodejs/lib/techs/deps.js.js

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

#### bem server

`bem server` starts a web server which serves static files, dynamic html generated form the BEMHTML and BEMJSON on the
fly, and pipes js and css files through borschik.

By default document root is the current directory. You can change that with the `--project` (`-r`) parameter. So if you have
`pages/about/main.css` file in the project folder it will be accessible with a browser using
[http://localhost:8080/pages/about/main.css](http://localhost:8080/pages/about/main.css) URL.

The default TCP port the server is listening to is 8080. You can change it with the `--port` (`-p`) parameter.

When the server gets a request for some `*.html` file it will look for appropriate BEMJSON and BEMHTML files, apply one
to another and return the result if both files do exist. The contents of the `*.html` file will be returned otherwise.

When requested URL corresponds to a directory server checks for index.html file in it and returns the content. If file is
not found, `index.bemhtml.js` and `index.bemjson.js` are checked for existance and the result of the template application is
returned. Otherwise the directory listing is returned.

### Tech modules

#### API

Look for a documentation in source [lib/tech.js](https://github.com/bem/bem-tools/blob/nodejs/lib/tech.js).

#### Creating tech module

There are three ways to write a tech module: very simple, simple and advanced.

Whatever manner you use you can get a tech object from `this`. Any base class is
available from `this.__base(...)`. Thanks to [inherit](https://github.com/dfilatov/node-inherit)
module that organizes inheritance here.

##### Very simple way

You only need to create regular CommonJS module and export some of its
functions to redefine them. By default all functions from the base class are put
in `Tech` module [lib/tech.js](https://github.com/bem/bem-tools/blob/nodejs/lib/tech.js).

##### Simple way

Besides function, you can also export `baseTechPath` variable to define an
absolute path to a tech module you are extending. By default you are
extending `Tech` class.

For example:

```js

exports.baseTechPath = require.resolve('bem/lib/techs/css');

```

##### Advanced way

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

When you need to base your tech on an existing one written in a simple way use
`getTechClass()` function from `bem/lib/tech` module
to get its class.

```js
var INHERIT = require('inherit'),
    getTechClass = require('bem/lib/tech').getTechClass,
    BaseTech = getTechClass(require.resolve('path/to/tech/module'));

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

##### BEM.create.block()

Creates a block.

###### Options

 * **String** `levelDir` A directory of block's level. (Current directory by default)
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

 * **String** `levelDir` A directory of level. (Current directory by default)
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

 * **String** `levelDir` Level directory (current directory by default)
 * **String** `blockName` Block name of this modifier (required)
 * **String** `elemName` Element name
 * **Array** `modVal` Modifier vaue
 * **Array** `addTech` Ad the techs listed
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
    console.log('Create mod %s of block %s with vals %s', elems.join(', '), block, vals.join(', '));
});

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, elemName: elem, modVal: vals }, { names: elems }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', elems.join(', '), elem, block, vals.join(', '));
});
```

#### BEM.build()

Build files from blocks.

###### Options

 * **String** `outputDir` An output directory (current directory by default)
 * **String** `outputName` A filename (its prefix) for output
 * **String** `declaration` A filename of input declaration (required)
 * **Array** `level` List of levels to use
 * **Array** `tech` List of techs to build

###### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    decl = 'page.deps.js',
    outputDir = 'build',
    outputName = 'page',
    levels = ['blocks-common', 'blocks-desktop'],
    techs = ['css', 'js'];

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

<!-- Yandex.Metrika counter -->
<img src="//mc.yandex.ru/watch/12831025" style="position:absolute; left:-9999px;" alt="" />
<!-- /Yandex.Metrika counter -->

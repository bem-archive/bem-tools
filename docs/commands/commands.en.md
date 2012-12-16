# bem create

You can create following entities using `bem create`:

 * levels of definition
 * blocks
 * elements
 * modifiers

## Level of definition

Level of definition is a directory that holds blocks and an utility directiry `.bem`.

A `.bem` directory holds configuration of a current level:

 * naming convention
 * links to the technologies

An example of technologies' links (this is `blocks-desktop` level of
`bem-bl` block library):

    https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js

### Create new level of definition named `blocks` under current directory:

    bem create level blocks

### Create a level for pages

In `bem-tools` terms pages are blocks as well and a directory which holds pages is a level of
definition itself. To create such a directory run this:

    bem create level pages

### Create a level based on an existing one

`bem create level` allows to use an existing level as a prototype for a level it creates.

    bem create level --level bem-bl/blocks-desktop blocks

## Block

Block is a bunch of files in different technologies that hold block's implementation.

### Create a new block

    bem create block b-my-block

By default, a block has several techs: (`bemhtml`, `css`, `js`).

### Create a new block using concrete tech

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

### Create element

Create element named `elem` for block `b-my-block`

    bem create elem -b b-my-block elem

### Create modifier of block or element

Create modifier named `mod` for block `b-my-block`

    bem create mod -b b-my-block mod

Create modifier named `mod` having value `val` for block `b-my-block`

    bem create mod -b b-my-block mod -v val

Create modifier named `mod` for element `elem` of block `b-my-block`

    bem create mod -b b-my-block -e elem mod

Create modifier named  `mod` having value `val` for element `elem` of block `b-my-block`

    bem create mod -b b-my-block -e elem mod -v val

### Create any BEM entity using `bem create` command only

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

# bem build

`bem build` command builds page files in different techs, according to a page declaration.

## Create bemdecl.js file from page's bemjson

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemjson.js -t bemdecl.js \
        -o pages/index -n index

You can use either tech's name or a path to its module as a value of -t flag. This
module says how to build a final file from a declaration.

E.g., this is a module for `deps.js`: https://github.com/bem/bem-tools/blob/master/lib/techs/deps.js.js

## Create deps.js file from bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

### Create js and css files for a page from deps.js

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

### Create bemhtml.js template for a page from deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemhtml.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

There is an example how pages are built using `bem build` in our test project that uses
`bem-bl` block library: https://github.com/toivonen/bem-bl-test/blob/master/GNUmakefile

# bem decl

`bem decl` is to work with declaration files. Thus,

 * to merge two or more decls into one
 * «subtract» decls

All subcommands of `bem decl` can take either bemdecl.js or deps.js as input declaration formats.
as input declaration (via `-d` flag).

Ouput data (`-o` flag) is always in `deps.js` format.

## bem decl merge

`bem decl merge` is to merge two or more decls into one. It is useful if you need, for example, to build
one file for several pages.

### Create a decl for all the pages

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

## bem decl subtract

`bem decl subtract` is to «subtract» all next decls from the first one.
You may use it to create a bundle that you request by application.

### Create a decl for a "heavy" block requested by application

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js

# bem make
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

# bem server

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

Add a link to client module `/refresh/vogue-client.js` in your `bemjson.js` to automatically update the page in a browser when the source code changes:

    ({
        block: 'b-page',
        head: [
            {elem: 'js', url: '/refresh/vogue-client.js'}
        ]
    })

CSS styles are updated without reloading the page. If you change the other files the page is reloaded completely.
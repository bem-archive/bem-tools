## bem create

You can create following entities using `bem create`:

 * levels of definition
 * blocks
 * elements
 * modifiers

### Level of definition

Level of definition is a directory that holds blocks and a utility directory `.bem`.

A `.bem` directory holds configuration of a current level:

 * naming convention
 * links to the technologies

See an example of technologies links (it is a [blocks-desktop level](https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js) of
`bem-bl` block library).

#### Create new level of definition named `blocks` in current directory

    bem create level blocks

#### Create a level for pages

In `bem-tools` terms pages are blocks as well, and a directory which holds pages is a level of definition itself. To create such a directory run the following command:

    bem create level pages

#### Create a level based on an existing one

`bem create level` allows to use an existing level as a prototype for a level being created.

    bem create level --level bem-bl/blocks-desktop blocks

### Block

Block is a bunch of files in different technologies that hold block's implementation.

#### Create a new block

    bem create block b-my-block

By default, a block has several techs (`BEMHTML`, `CSS`, `JS`).

#### Create a new block using concrete tech

Flags `-t` (`-T`) are to create files of technologies you need:

    bem create block -t deps.js b-my-block
        // Creates a block implementation in deps.js technology, except of default techs

    bem create block -T css b-my-block
        // Creates only CSS technology for a block

    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // -T flag is useful when you need to add a new tech to the existing block

The value of this flag may be either tech's name (for example, `CSS`) or a path to a tech module.

Tech names may be listed in `.bem/level.js` file of a level ([see example](https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js)).

You can find the examples of tech modules in the [repo](https://github.com/bem/bem-tools/tree/support/0.9.x/lib/techs).

#### Create element

Create element named `elem` for block `b-my-block`:

    bem create elem -b b-my-block elem

#### Create modifier of block or element

Create modifier named `mod` for block `b-my-block`:

    bem create mod -b b-my-block mod

Create modifier named `mod` with value `val` for block `b-my-block`:

    bem create mod -b b-my-block mod -v val

Create modifier named `mod` for element `elem` of block `b-my-block`:

    bem create mod -b b-my-block -e elem mod

Create modifier named `mod` with value `val` for element `elem` of block `b-my-block`:

    bem create mod -b b-my-block -e elem mod -v val

#### Create any BEM entity using `bem create` command only

You can create any BEM entities or bunches of them using `bem create` command.

Create blocks named `b-block1` and `b-block2`:

    bem create -b b-block1 -b b-block2

Create elements named `elem1` and `elem2` for block `b-block`:

    bem create -b b-block -e elem1 -e elem2

Create modifier names `mod` of block `b-block`:

    bem create -b b-block -m mod

Create modifier named `mod` of block `b-block` with values `val1` and `val2`:

    bem create -b b-block -m mod -v val1 -v val2

Create modifier named `mod` for element `elem` of block `b-block`

    bem create -b b-block -e elem -m mod

Create modifier named `mod` with values `val1` and `val2` for element `elem` of block `b-block`:

    bem create -b b-block -e elem -m mod -v val1 -v val2

### Create bemdecl.js file from page's bemjson

    bem create \
        -l pages \
        -b index \
        -T bemdecl.js

## bem build

`bem build` command builds page files in different techs, according to a page declaration.

You can use either tech's name or a path to its module as a value of `-t` flag. This
module specifies how to build a final file from a declaration (see [module for deps.js](https://github.com/bem/bem-tools/blob/support/0.9.x/lib/techs/deps.js.js) for example).

### Create deps.js file from bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

#### Create JS and CSS files for a page from deps.js

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

#### Create bemhtml.js template for a page from deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

## bem decl

`bem decl` is to work with declaration files. Thus,

 * to merge two or more decls into one
 * «subtract» decls

All subcommands of `bem decl` can take either `bemdecl.js` or `deps.js` as input declaration formats (via `-d` flag).

Ouput data (`-o` flag) is always in `deps.js` format.

### bem decl merge

`bem decl merge` is to merge two or more decls into one. It is useful in case, for example, you need to build
one file for several pages.

#### Create a decl for all the pages

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

### bem decl subtract

`bem decl subtract` is to «subtract» all next decls from the first one.
You may use it to create a bundle that is requested by demand.

#### Create a decl for a "heavy" block requested by demand

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js

## bem make

`make` command implements the build process of the BEM projects. You do not have to write your own scripts or makefiles (for GNU make or other build system) to build your BEM project.

During the build `bem make`:

 * fetches the block libraries
 * builds the levels content
 * builds the bundles
 * generates the templates (`BEMHTML`)
 * generates `HTML` from `bemjson.js`
 * generates the static content files (`JS`, `CSS`)
 * expands the `@import` directives in `CSS` files (`borschik`)
 * expands the `borschik:link:include` directives  in `JS` files (`borschik`)
 * optimizes `CSS` files using `CSSO`
 * optimizes `JS` files using `UglifyJS`

## bem server

`bem server` command runs a development server. It makes the project files being accessible via the HTTP protocol.
This includes the files which are generated during the build process. So the server can be useful when you develop the
static pages using the BEM method. You just edit the files, refresh the browser and get updated page. All the files
which are affected by your changes will be rebuilt automatically.
In case your project has no static pages, you can configure your backend server and production environment to retrieve
the stylesheets and scripts from the `bem server`. `bem server` accepts connections via normal TCP socket and via UNIX domain socket.

By default, the current directory is considered as a project root. You can change it using the `--project` (`-r`) option.

Default TCP port is 8080. You can change it using the `--port` (`-p`) option.

When requested URL is mapped to a directory, the server will check whether it is possible to build an `index.html` file for the requested directory.
If true, the content of the file will be returned to a browser. The directory content listing will be returned otherwise.

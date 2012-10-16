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

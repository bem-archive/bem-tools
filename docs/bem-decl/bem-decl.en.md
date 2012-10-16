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

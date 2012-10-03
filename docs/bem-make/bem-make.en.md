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

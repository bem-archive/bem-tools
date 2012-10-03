# bem create

You can create following entities using `bem create`:

 * levels of defenition
 * blocks
 * elements
 * modifiers

## Level of defenition

Level of defenition is a directory that holds blocks and an utility directiry `.bem`.

A `.bem` directory holds configuration of a current level:

 * naming convention
 * links to the technologies

An example of technologies' links (this is `blocks-desktop` level of
`bem-bl` block library):

    https://github.com/bem/bem-bl/blob/master/blocks-common/.bem/level.js

### Create new level of defenition named `blocks` under current directory:

    bem create level blocks

### Create a level for pages

In `bem-tools` terms pages are blocks as well and a directory which holds pages is a level of
defenition itself. To create such a directory run this:

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

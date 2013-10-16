exports.deps = [
    {
        "block": "i-jquery"
    },
    {
        "block": "i-jquery",
        "elem": "inherit"
    },
    {
        "block": "i-jquery",
        "elem": "identify"
    },
    {
        "block": "i-jquery",
        "elem": "is-empty-object"
    },
    {
        "block": "i-jquery",
        "elem": "debounce"
    },
    {
        "block": "i-jquery",
        "elem": "observable"
    },
    {
        "block": "i-bem"
    },
    {
        "block": "i-ecma",
        "elem": "object"
    },
    {
        "block": "i-ecma",
        "elem": "array"
    },
    {
        "block": "i-ecma",
        "elem": "function"
    },
    {
        "block": "i-bem",
        "elem": "internal"
    },
    {
        "block": "i-bem",
        "elem": "html"
    },
    {
        "block": "i-bem",
        "elem": "dom"
    },
    {
        "block": "i-ecma",
        "elem": "string"
    },
    {
        "block": "i-bem",
        "elem": "dom",
        "mod": "init"
    },
    {
        "block": "i-bem",
        "elem": "dom",
        "mod": "init",
        "val": "auto"
    },
    {
        "block": "i-ua"
    },
    {
        "block": "i-jquery",
        "elem": "core"
    },
    {
        "block": "b-page"
    },
    {
        "block": "b-page",
        "elem": "css"
    },
    {
        "block": "b-page",
        "elem": "js"
    },
    {
        "block": "b-link"
    },
    {
        "block": "i-jquery",
        "elem": "leftclick"
    },
    {
        "block": "b-link",
        "mod": "pseudo"
    },
    {
        "block": "b-link",
        "mod": "pseudo",
        "val": "yes"
    },
    {
        "block": "b-link",
        "elem": "inner"
    },
    {
        "block": "b-link",
        "mod": "pseudo",
        "val": "no"
    },
    {
        "block": "b-link",
        "mod": "togcolor"
    },
    {
        "block": "b-link",
        "mod": "togcolor",
        "val": "yes"
    },
    {
        "block": "b-link",
        "mod": "color"
    },
    {
        "block": "b-link",
        "mod": "color",
        "val": "red"
    },
    {
        "block": "b-link",
        "mod": "color",
        "val": "green"
    },
    {
        "block": "b-icon"
    },
    {
        "block": "b-logo"
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "b-page",
            "b-link",
            "b-link_pseudo",
            "b-link_pseudo_yes",
            "b-link_togcolor",
            "b-link_togcolor_yes",
            "b-link_color",
            "b-link_color_green",
            "i-bem",
            "i-bem__html",
            "i-bem__dom",
            "i-ua",
            "i-jquery__observable",
            "b-logo"
        ],
        "mustDeps": [],
        "item": {},
        "include": true
    },
    "b-page": {
        "shouldDeps": [
            "b-page",
            "b-page__css",
            "b-page__js"
        ],
        "mustDeps": [
            "i-bem",
            "i-bem__html",
            "i-bem__dom",
            "i-bem__dom_init",
            "i-bem__dom_init_auto",
            "i-ua",
            "i-jquery",
            "i-jquery__core"
        ],
        "item": {
            "block": "b-page"
        },
        "include": true,
        "key": "b-page"
    },
    "b-link": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link"
        },
        "include": true,
        "key": "b-link"
    },
    "b-link_pseudo": {
        "shouldDeps": [
            "b-link_pseudo",
            "b-link_pseudo_yes",
            "b-link_pseudo_no"
        ],
        "mustDeps": [
            "i-jquery",
            "i-jquery__leftclick"
        ],
        "item": {
            "block": "b-link",
            "mod": "pseudo"
        },
        "include": true,
        "key": "b-link_pseudo"
    },
    "b-link_pseudo_yes": {
        "shouldDeps": [
            "b-link_pseudo_yes",
            "b-link__inner"
        ],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "pseudo",
            "val": "yes"
        },
        "include": true,
        "key": "b-link_pseudo_yes"
    },
    "b-link_togcolor": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "togcolor"
        },
        "include": true,
        "key": "b-link_togcolor"
    },
    "b-link_togcolor_yes": {
        "shouldDeps": [
            "b-link",
            "b-link_color",
            "b-link_color_red",
            "b-link_color_green"
        ],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "togcolor",
            "val": "yes"
        },
        "include": true,
        "key": "b-link_togcolor_yes"
    },
    "b-link_color": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "color"
        },
        "include": true,
        "key": "b-link_color"
    },
    "b-link_color_green": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "color",
            "val": "green"
        },
        "include": true,
        "key": "b-link_color_green"
    },
    "i-bem": {
        "shouldDeps": [
            "i-ecma__object",
            "i-ecma__array",
            "i-ecma__function",
            "i-bem__internal"
        ],
        "mustDeps": [
            "i-jquery",
            "i-jquery__inherit",
            "i-jquery__identify",
            "i-jquery__is-empty-object",
            "i-jquery__debounce",
            "i-jquery__observable"
        ],
        "item": {
            "block": "i-bem"
        },
        "include": true,
        "key": "i-bem"
    },
    "i-bem__html": {
        "shouldDeps": [],
        "mustDeps": [
            "i-bem",
            "i-jquery"
        ],
        "item": {
            "block": "i-bem",
            "elem": "html"
        },
        "include": true,
        "key": "i-bem__html"
    },
    "i-bem__dom": {
        "shouldDeps": [
            "i-ecma__string"
        ],
        "mustDeps": [
            "i-bem",
            "i-bem__html"
        ],
        "item": {
            "block": "i-bem",
            "elem": "dom"
        },
        "include": true,
        "key": "i-bem__dom"
    },
    "i-bem__dom_init": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-bem",
            "elem": "dom",
            "mod": "init"
        },
        "include": true,
        "key": "i-bem__dom_init"
    },
    "i-bem__dom_init_auto": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-bem",
            "elem": "dom",
            "mod": "init",
            "val": "auto"
        },
        "include": true,
        "key": "i-bem__dom_init_auto"
    },
    "i-ua": {
        "shouldDeps": [],
        "mustDeps": [
            "i-bem",
            "i-bem__html"
        ],
        "item": {
            "block": "i-ua"
        },
        "include": true,
        "key": "i-ua"
    },
    "i-jquery": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery"
        },
        "include": true,
        "key": "i-jquery"
    },
    "i-jquery__core": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "core"
        },
        "include": true,
        "key": "i-jquery__core"
    },
    "b-page__css": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-page",
            "elem": "css"
        },
        "include": true,
        "key": "b-page__css"
    },
    "b-page__js": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-page",
            "elem": "js"
        },
        "include": true,
        "key": "b-page__js"
    },
    "i-jquery__leftclick": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "leftclick"
        },
        "include": true,
        "key": "i-jquery__leftclick"
    },
    "b-link_pseudo_no": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "pseudo",
            "val": "no"
        },
        "include": true,
        "key": "b-link_pseudo_no"
    },
    "b-link__inner": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "elem": "inner"
        },
        "include": true,
        "key": "b-link__inner"
    },
    "b-link_color_red": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "color",
            "val": "red"
        },
        "include": true,
        "key": "b-link_color_red"
    },
    "i-jquery__inherit": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "inherit"
        },
        "include": true,
        "key": "i-jquery__inherit"
    },
    "i-jquery__identify": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "identify"
        },
        "include": true,
        "key": "i-jquery__identify"
    },
    "i-jquery__is-empty-object": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "is-empty-object"
        },
        "include": true,
        "key": "i-jquery__is-empty-object"
    },
    "i-jquery__debounce": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "debounce"
        },
        "include": true,
        "key": "i-jquery__debounce"
    },
    "i-jquery__observable": {
        "shouldDeps": [
            "i-jquery__identify"
        ],
        "mustDeps": [
            "i-jquery__inherit"
        ],
        "item": {
            "block": "i-jquery",
            "elem": "observable"
        },
        "include": true,
        "key": "i-jquery__observable"
    },
    "i-ecma__object": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "object"
        },
        "include": true,
        "key": "i-ecma__object"
    },
    "i-ecma__array": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "array"
        },
        "include": true,
        "key": "i-ecma__array"
    },
    "i-ecma__function": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "function"
        },
        "include": true,
        "key": "i-ecma__function"
    },
    "i-bem__internal": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-bem",
            "elem": "internal"
        },
        "include": true,
        "key": "i-bem__internal"
    },
    "i-ecma__string": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "string"
        },
        "include": true,
        "key": "i-ecma__string"
    },
    "b-logo": {
        "shouldDeps": [],
        "mustDeps": [
            "b-link",
            "b-icon"
        ],
        "item": {
            "block": "b-logo"
        },
        "include": true,
        "key": "b-logo"
    },
    "b-icon": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-icon"
        },
        "include": true,
        "key": "b-icon"
    }
};

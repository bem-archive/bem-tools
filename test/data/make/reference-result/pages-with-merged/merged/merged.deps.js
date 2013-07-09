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
        "item": {}
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
        "key": "b-page"
    },
    "b-link": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link"
        },
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
        "key": "b-link_pseudo_yes"
    },
    "b-link_togcolor": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "togcolor"
        },
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
        "key": "b-link_togcolor_yes"
    },
    "b-link_color": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "mod": "color"
        },
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
        "key": "i-ua"
    },
    "i-jquery": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery"
        },
        "key": "i-jquery"
    },
    "i-jquery__core": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "core"
        },
        "key": "i-jquery__core"
    },
    "b-page__css": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-page",
            "elem": "css"
        },
        "key": "b-page__css"
    },
    "b-page__js": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-page",
            "elem": "js"
        },
        "key": "b-page__js"
    },
    "i-jquery__leftclick": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "leftclick"
        },
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
        "key": "b-link_pseudo_no"
    },
    "b-link__inner": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-link",
            "elem": "inner"
        },
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
        "key": "b-link_color_red"
    },
    "i-jquery__inherit": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "inherit"
        },
        "key": "i-jquery__inherit"
    },
    "i-jquery__identify": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "identify"
        },
        "key": "i-jquery__identify"
    },
    "i-jquery__is-empty-object": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "is-empty-object"
        },
        "key": "i-jquery__is-empty-object"
    },
    "i-jquery__debounce": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-jquery",
            "elem": "debounce"
        },
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
        "key": "i-jquery__observable"
    },
    "i-ecma__object": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "object"
        },
        "key": "i-ecma__object"
    },
    "i-ecma__array": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "array"
        },
        "key": "i-ecma__array"
    },
    "i-ecma__function": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "function"
        },
        "key": "i-ecma__function"
    },
    "i-bem__internal": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-bem",
            "elem": "internal"
        },
        "key": "i-bem__internal"
    },
    "i-ecma__string": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "i-ecma",
            "elem": "string"
        },
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
        "key": "b-logo"
    },
    "b-icon": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-icon"
        },
        "key": "b-icon"
    }
};

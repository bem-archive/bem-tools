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
        "block": "b-with-js"
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "b-page",
            "b-with-js",
            "i-bem",
            "i-bem__html",
            "i-bem__dom",
            "i-ua",
            "i-jquery__observable"
        ],
        "mustDeps": [],
        "item": {},
        "include": true,
        "key": ""
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
    "b-with-js": {
        "shouldDeps": [
            "b-with-css.css"
        ],
        "mustDeps": [],
        "item": {
            "block": "b-with-js"
        },
        "include": true,
        "key": "b-with-js"
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
    "b-with-css.css": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b-with-css",
            "tech": "css"
        },
        "include": true,
        "key": "b-with-css.css"
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
    }
};

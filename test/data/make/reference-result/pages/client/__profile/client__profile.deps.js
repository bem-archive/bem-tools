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
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "b-page",
            "b-page",
            "b-page",
            "i-bem",
            "i-bem__html",
            "i-ua",
            "i-bem__dom",
            "i-jquery__observable"
        ],
        "mustDeps": [],
        "item": {},
        "key": ""
    },
    "b-page": {
        "shouldDeps": [],
        "mustDeps": [
            "i-bem",
            "i-bem__html",
            "i-ua",
            "i-jquery",
            "i-jquery__core",
            "i-bem__dom",
            "i-bem__dom_init",
            "i-bem__dom_init_auto"
        ],
        "item": {
            "block": "b-page"
        },
        "key": "b-page"
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
    }
};

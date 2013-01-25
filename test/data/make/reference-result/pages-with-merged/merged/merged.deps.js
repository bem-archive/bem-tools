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
        "elem": "observable",
        "shouldDeps": [
            {
                "block": "i-jquery",
                "elem": "identify"
            },
            {
                "block": "i-jquery",
                "elem": "identify"
            }
        ],
        "mustDeps": [
            {
                "block": "i-jquery",
                "elem": "inherit"
            },
            {
                "block": "i-jquery",
                "elem": "inherit"
            }
        ]
    },
    {
        "block": "i-bem",
        "shouldDeps": [
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
            }
        ],
        "mustDeps": [
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
            }
        ]
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
        "elem": "html",
        "mustDeps": [
            {
                "block": "i-bem"
            },
            {
                "block": "i-jquery"
            },
            {
                "block": "i-bem"
            },
            {
                "block": "i-jquery"
            }
        ]
    },
    {
        "block": "i-ua",
        "mustDeps": [
            {
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            },
            {
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            }
        ]
    },
    {
        "block": "i-jquery",
        "elem": "core"
    },
    {
        "block": "i-bem",
        "elem": "dom",
        "shouldDeps": [
            {
                "block": "i-ecma",
                "elem": "string"
            },
            {
                "block": "i-ecma",
                "elem": "string"
            }
        ],
        "mustDeps": [
            {
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            },
            {
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            }
        ]
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
        "block": "b-page",
        "mustDeps": [
            {
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            },
            {
                "block": "i-ua"
            },
            {
                "block": "i-jquery"
            },
            {
                "block": "i-jquery",
                "elem": "core"
            },
            {
                "block": "i-bem",
                "elem": "dom"
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
                "block": "i-bem"
            },
            {
                "block": "i-bem",
                "elem": "html"
            },
            {
                "block": "i-ua"
            },
            {
                "block": "i-jquery"
            },
            {
                "block": "i-jquery",
                "elem": "core"
            },
            {
                "block": "i-bem",
                "elem": "dom"
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
            }
        ]
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
        "mod": "pseudo",
        "shouldDeps": [
            {
                "block": "b-link",
                "mod": "pseudo"
            },
            {
                "block": "b-link",
                "mod": "pseudo"
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
                "mod": "pseudo",
                "val": "no"
            }
        ],
        "mustDeps": [
            {
                "block": "i-jquery"
            },
            {
                "block": "i-jquery",
                "elem": "leftclick"
            }
        ]
    },
    {
        "block": "b-link",
        "mod": "pseudo",
        "val": "yes",
        "shouldDeps": [
            {
                "block": "b-link",
                "mod": "pseudo",
                "val": "yes"
            },
            {
                "block": "b-link",
                "elem": "inner"
            }
        ]
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
        "val": "yes",
        "shouldDeps": [
            {
                "block": "b-link"
            },
            {
                "block": "b-link",
                "mod": "color"
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
            }
        ]
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
        "block": "b-logo",
        "mustDeps": [
            {
                "block": "b-link"
            },
            {
                "block": "b-icon"
            }
        ]
    }
];
exports.depsByTechs = {
    "": {}
};

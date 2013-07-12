exports.deps = [
    {
        "block": "first-block"
    },
    {
        "block": "dep-block"
    },
    {
        "block": "first-block",
        "elem": "elem1"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod1"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod1",
        "val": "1"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod1",
        "val": "2"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod2"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod2",
        "val": "3"
    },
    {
        "block": "first-block",
        "elem": "elem1",
        "mod": "mod2",
        "val": "4"
    },
    {
        "block": "first-block",
        "elem": "elem2"
    },
    {
        "block": "first-block",
        "mod": "mod1"
    },
    {
        "block": "first-block",
        "mod": "mod1",
        "val": "1"
    },
    {
        "block": "first-block",
        "mod": "mod1",
        "val": "2"
    },
    {
        "block": "first-block",
        "mod": "mod2"
    },
    {
        "block": "first-block",
        "mod": "mod2",
        "val": "3"
    },
    {
        "block": "first-block",
        "mod": "mod2",
        "val": "4"
    },
    {
        "block": "second-block"
    },
    {
        "block": "second-block",
        "elem": "elem2"
    },
    {
        "block": "second-block",
        "elem": "elem2",
        "mod": "mod22"
    },
    {
        "block": "second-block",
        "elem": "elem2",
        "mod": "mod22",
        "val": "221"
    },
    {
        "block": "second-block",
        "elem": "elem2",
        "mod": "mod22",
        "val": "222"
    },
    {
        "block": "second-block",
        "elem": "elem3"
    },
    {
        "block": "second-block",
        "mod": "mod2"
    },
    {
        "block": "second-block",
        "mod": "mod2",
        "val": "21"
    },
    {
        "block": "second-block",
        "mod": "mod2",
        "val": "22"
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "first-block",
            "first-block__elem1",
            "first-block__elem1_mod1",
            "first-block__elem1_mod1_1",
            "first-block__elem1_mod1_2",
            "first-block__elem1_mod2",
            "first-block__elem1_mod2_3",
            "first-block__elem1_mod2_4",
            "first-block__elem2",
            "first-block_mod1",
            "first-block_mod1_1",
            "first-block_mod1_2",
            "first-block_mod2",
            "first-block_mod2_3",
            "first-block_mod2_4",
            "second-block",
            "second-block__elem2",
            "second-block__elem2_mod22",
            "second-block__elem2_mod22_221",
            "second-block__elem2_mod22_222",
            "second-block__elem3",
            "second-block_mod2",
            "second-block_mod2_21",
            "second-block_mod2_22",
            "dep-block"
        ],
        "mustDeps": [],
        "item": {},
        "key": ""
    },
    "first-block": {
        "shouldDeps": [
            "dep-block",
            "dep-block33.t3"
        ],
        "mustDeps": [],
        "item": {
            "block": "first-block"
        },
        "key": "first-block"
    },
    "first-block__elem1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1"
        },
        "key": "first-block__elem1"
    },
    "first-block__elem1_mod1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod1"
        },
        "key": "first-block__elem1_mod1"
    },
    "first-block__elem1_mod1_1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod1",
            "val": "1"
        },
        "key": "first-block__elem1_mod1_1"
    },
    "first-block__elem1_mod1_2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod1",
            "val": "2"
        },
        "key": "first-block__elem1_mod1_2"
    },
    "first-block__elem1_mod2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod2"
        },
        "key": "first-block__elem1_mod2"
    },
    "first-block__elem1_mod2_3": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod2",
            "val": "3"
        },
        "key": "first-block__elem1_mod2_3"
    },
    "first-block__elem1_mod2_4": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem1",
            "mod": "mod2",
            "val": "4"
        },
        "key": "first-block__elem1_mod2_4"
    },
    "first-block__elem2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "elem": "elem2"
        },
        "key": "first-block__elem2"
    },
    "first-block_mod1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod1"
        },
        "key": "first-block_mod1"
    },
    "first-block_mod1_1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod1",
            "val": "1"
        },
        "key": "first-block_mod1_1"
    },
    "first-block_mod1_2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod1",
            "val": "2"
        },
        "key": "first-block_mod1_2"
    },
    "first-block_mod2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod2"
        },
        "key": "first-block_mod2"
    },
    "first-block_mod2_3": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod2",
            "val": "3"
        },
        "key": "first-block_mod2_3"
    },
    "first-block_mod2_4": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "first-block",
            "mod": "mod2",
            "val": "4"
        },
        "key": "first-block_mod2_4"
    },
    "second-block": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block"
        },
        "key": "second-block"
    },
    "second-block__elem2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "elem": "elem2"
        },
        "key": "second-block__elem2"
    },
    "second-block__elem2_mod22": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "elem": "elem2",
            "mod": "mod22"
        },
        "key": "second-block__elem2_mod22"
    },
    "second-block__elem2_mod22_221": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "elem": "elem2",
            "mod": "mod22",
            "val": "221"
        },
        "key": "second-block__elem2_mod22_221"
    },
    "second-block__elem2_mod22_222": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "elem": "elem2",
            "mod": "mod22",
            "val": "222"
        },
        "key": "second-block__elem2_mod22_222"
    },
    "second-block__elem3": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "elem": "elem3"
        },
        "key": "second-block__elem3"
    },
    "second-block_mod2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "mod": "mod2"
        },
        "key": "second-block_mod2"
    },
    "second-block_mod2_21": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "mod": "mod2",
            "val": "21"
        },
        "key": "second-block_mod2_21"
    },
    "second-block_mod2_22": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "second-block",
            "mod": "mod2",
            "val": "22"
        },
        "key": "second-block_mod2_22"
    },
    "dep-block": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "dep-block"
        },
        "key": "dep-block"
    },
    "dep-block33.t3": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "dep-block33",
            "tech": "t3"
        },
        "key": "dep-block33.t3"
    },
    "dep-block2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "dep-block2"
        },
        "key": "dep-block2"
    }
};

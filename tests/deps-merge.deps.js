exports.deps = [
    {
        "block": "b1",
        "elem": "e1"
    },
    {
        "block": "b2"
    },
    {
        "block": "b3",
        "elem": "e1",
        "mod": "m1"
    },
    {
        "block": "b1"
    },
    {
        "block": "b1",
        "elem": "e2"
    },
    {
        "block": "b3",
        "elem": "e1",
        "mod": "m1",
        "val": "v1"
    },
    {
        "block": "b3",
        "elem": "e1",
        "mod": "m1",
        "val": "v2"
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "b1__e1",
            "b2",
            "b3__e1_m1",
            "b1",
            "b1__e2",
            "b3__e1_m1_v1",
            "b3__e1_m1_v2"
        ],
        "mustDeps": [],
        "item": {},
        "key": ""
    },
    "b1__e1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b1",
            "elem": "e1"
        },
        "key": "b1__e1"
    },
    "b2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b2"
        },
        "key": "b2"
    },
    "b3__e1_m1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b3",
            "elem": "e1",
            "mod": "m1"
        },
        "key": "b3__e1_m1"
    },
    "b1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b1"
        },
        "key": "b1"
    },
    "b1__e2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b1",
            "elem": "e2"
        },
        "key": "b1__e2"
    },
    "b3__e1_m1_v1": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b3",
            "elem": "e1",
            "mod": "m1",
            "val": "v1"
        },
        "key": "b3__e1_m1_v1"
    },
    "b3__e1_m1_v2": {
        "shouldDeps": [],
        "mustDeps": [],
        "item": {
            "block": "b3",
            "elem": "e1",
            "mod": "m1",
            "val": "v2"
        },
        "key": "b3__e1_m1_v2"
    }
};

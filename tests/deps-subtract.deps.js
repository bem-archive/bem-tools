exports.deps = [
    {
        "block": "b1"
    },
    {
        "block": "b1",
        "elem": "e2"
    }
];
exports.depsFull = {
    "": {
        "shouldDeps": [
            "b1",
            "b1__e1",
            "b1__e2"
        ],
        "mustDeps": [],
        "item": {},
        "key": ""
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
    }
};

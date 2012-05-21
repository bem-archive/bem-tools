({
    mustDeps: [
        {
            block: 'i-jquery',
            elems: [
                'inherit',
                'identify',
                'is-empty-object',
                'debounce',
                'observable'
            ]
        }
    ],
    shouldDeps: [
        { block: 'i-ecma', elem: 'object' },
        { block: 'i-ecma', elem: 'array' },
        { block: 'i-ecma', elem: 'function' },
        { elem: 'internal' }
    ]
})

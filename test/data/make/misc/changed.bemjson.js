({
    block: 'b-page',
    title: 'Pseudo link',
    head: [
        { elem: 'css', url: 'example.min.css'},
        { elem: 'css', url: 'example.min', ie: true },
        { elem: 'js', url: 'example.min.js' }
    ],
    content: [
        {
            block: 'b-link',
            mods : { togcolor : 'yes', color: 'green' },
            url: '#',
            target: '_blank',
            title: 'Click me',
            content : 'This pseudo link changes its color after click'
        }
    ]
})

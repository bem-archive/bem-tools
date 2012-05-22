({
    block: 'b-page',
    title: 'Pseudo link',
    head: [
        { elem: 'css', url: '_example.css'},
        { elem: 'css', url: '_example.ie.css', ie: 'lt IE 8' },
        { block: 'i-jquery', elem: 'core' },
        { elem: 'js', url: 'example.js' }
    ],
    content: [
        {
            block: 'b-link',
            mods : { pseudo : 'yes', togcolor : 'yes', color: 'green' },
            url: '#',
            target: '_blank',
            title: 'Click me',
            content : 'This pseudo link changes its color after click'
        }
    ]
})

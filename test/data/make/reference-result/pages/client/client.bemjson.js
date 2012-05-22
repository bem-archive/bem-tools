({
    block: 'b-page',
    js: true,
    title: 'Client-side template work',
    head: [
        { elem: 'css', url: '_client.css'},
        { elem: 'css', url: '_client.ie.css', ie: true },
        { block: 'i-jquery', elem: 'core' },
        { elem: 'js', url: 'client.bemhtml.js' },
        { elem: 'js', url: 'client.js' }
    ],
    content: ''
})

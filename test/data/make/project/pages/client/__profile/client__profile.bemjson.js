({
    block: 'b-page',
    js: true,
    title: 'Client-side template work',
    head: [
        { elem: 'css', url: '_client.css'},
        { elem: 'css', url: '_client', ie: true },
        { block: 'i-jquery', elem: 'core' },
        { elem: 'js', url: '_client.bemhtml.js' },
        { elem: 'js', url: '_client.js' }
    ],
    content: ''
})

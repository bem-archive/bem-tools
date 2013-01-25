BEM.DOM.decl('b-page', {
    onSetMod : {
        'js' : function() {
            BEM.DOM.update(this.domElem, BEMHTML.apply(
                {
                    block: 'b-link',
                    mods : { pseudo : 'yes', togcolor : 'yes', color: 'green' },
                    url: '#',
                    target: '_blank',
                    title: 'Click me',
                    content : 'This pseudo link changes its color after click'
                }
            ));
            BEM.DOM.init(this.domElem);
        }
    }
});

BEM.DOM.decl({'name': 'b-link', 'modName': 'pseudo', 'modVal': 'yes'}, {

    _onClick : function(e) {

        e.preventDefault();

        this.hasMod('disabled', 'yes') || this.afterCurrentEvent(function() {
            this.trigger('click');
        });

    }

}, {

    live : function() {

        this.__base.apply(this, arguments);

        this.liveBindTo({ modName : 'pseudo', modVal : 'yes' }, 'leftclick', function(e) {
            this._onClick(e);
        });

    }

});

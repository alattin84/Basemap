define(["dijit/registry",
        "dojo/dom",
        "dojox/widget/Toaster",
        "dojo/domReady!"
], function(registry, dom, Toaster) {

    var errorToaster;

    return {
        init: function(){
            errorToaster = new Toaster({id: 'errorToaster'}, dom.byId('errorPane'));
            errorToaster.positionDirection = "br-left";
        },

        showMessage: function(errorMsg){
            errorToaster.setContent(errorMsg, "error", 3000);
            errorToaster.show();
        }
    };

});


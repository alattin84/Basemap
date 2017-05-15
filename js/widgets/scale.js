define(["dojo/_base/declare",
        "dijit/registry",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "events/appMessages",
        "dojo/text!./templates/scaleWidget.html",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dojo/domReady!"],
    function(declare, registry, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, messages, template){

        var scale;

        return declare("scaleWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function(){

                on(registry.byId("btnScale"), "click", function(){
                    var scale = dojo.byId("txtScale").value;

                    if(Number(scale)){
                        map.setScale(scale);
                    }else{
                        messages.showMessage("Please enter a valid scale!");
                    }
                });

            },

            postCreate: function(){
                scale = this;
                scale.init();
            }
        });
    });

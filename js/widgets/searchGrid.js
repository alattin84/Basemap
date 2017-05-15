define(["dojo/_base/declare",
        "dijit/registry",
        "dojo/dom-class",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "dojo/text!./templates/searchGrid.html",
        "dijit/form/Button",
        "dojo/domReady!"],
    function(declare, registry, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, template){

        var globSearchGrid;

        return declare("searchGrid", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function() {

                globSearchGrid = this;

                var cssFiles = [
                    "css/printDocument.css"
                ];

                on(registry.byId("printAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){
                        grid.exportToHTML({
                            title: "Benton County GIS Data:",
                            cssFiles: cssFiles
                        }, function(str){
                            var win = window.open();
                            win.document.open();
                            win.document.write(str);
                            /*Adjust row height/view width for multi-view grid*/
                            dijit.byId("grid").normalizePrintedGrid(win.document);
                            win.document.close();
                        });
                    }
                });

                /*on(registry.byId("printAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){
                        grid.printGrid({
                            title: "Benton County GIS Data:",
                            cssFiles: cssFiles
                        });
                    }
                });*/

                on(registry.byId("exportAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){
                        grid.exportGrid("csv", function(str){
                            var print = window.open('', '_blank');
                            print.document.write('<html><head><title>Benton County GIS: Exported Data</title></head>');
                            print.document.write('<body><textarea style="width: 100%; height: 100%;">' + str + '</textarea></body></html>');
                        });
                    }
                });

                on(registry.byId("clearAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){

                        domClass.toggle("resultsContainer", "results-open");
                        esri.hide(grid);
                        map.graphics.clear();

                        var printAll = registry.byId("printAll");
                        var exportAll = registry.byId("exportAll");
                        var clearAll = registry.byId("clearAll");
                        printAll.setDisabled(true);
                        exportAll.setDisabled(true);
                        clearAll.setDisabled(true);
                    }
                });
            },

            postCreate: function(){
                globSearchGrid = this;
                globSearchGrid.init();
            }
        });
    });

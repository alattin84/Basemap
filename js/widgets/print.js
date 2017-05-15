define(["dojo/_base/declare",
        "dojo/query",
        "dijit/registry",
        "esri/tasks/PrintTask",
        "esri/tasks/PrintTemplate",
        "esri/tasks/PrintParameters",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "events/appMessages",
        "dojo/text!./templates/printWidget.html",
        "dijit/form/Button",
        "dojox/layout/TableContainer",
        "dijit/form/Select",
        "dojo/domReady!"],
    function(declare, query, registry, PrintTask, PrintTemplate, PrintParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, messages, template){

        var print;

        return declare("printWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function(){

                on(registry.byId("btnPrint"), 'click', function () {
                    var mapTitle = dojo.byId("txtTitle").value;
                    var layout = dojo.byId("ddlPrintLayouts").textContent;
                    var format = dojo.byId("ddlPrintFormat").textContent;
                    print.createPrint(mapTitle, layout, format);
                });

            },

            createPrint: function(title, layout, format) {

                //$('#prSpinner').css('display', 'block');
                //dojo.style(dojo.byId("prtSpinner"), "display", "block");

                //Set up print stuff
                var printUrl = "http://gis.bentoncountyar.gov/arcgis/rest/services/PrintService/GeneralExportWebMap/GPServer/Export%20Web%20Map";
                var printTask = new PrintTask(printUrl, { async: true });
                var params = new PrintParameters();
                var template = new PrintTemplate();

                params.map = map;
                template.exportOptions = {
                    width: map.width,
                    height: map.height,
                    dpi: 300
                };

                template.layoutOptions = { titleText: title };
                template.format = format;
                template.layout = layout;
                template.preserveScale = false;

                params.template = template;
                printTask.execute(params, print.printResult, print.printError);
            },

            printResult: function (result) {
                //dojo.style(dojo.byId("prtSpinner"), "display", "none");
                messages.showMessage("Print was successful!");

                setTimeout(function(){
                    window.open(result.url);
                }, 5000)
            },

            printError: function (result) {
                messages.showMessage("Print service error!");
            },

            postCreate: function(){
                print = this;
                print.init();
            }
        });
    });

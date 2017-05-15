define(["dojo/aspect",
        "dojo/_base/kernel",
        "dojo/dom-construct",

        "esri/toolbars/draw",
        "esri/config",
        "esri/toolbars/edit",
        "esri/tasks/GeometryService",
        "esri/symbols/TextSymbol",

        'dojo/_base/lang',
        "dojo/_base/event",
        "dojo/_base/connect",

        "dojo/on",
        "dojo/dom",
        "dojo/query",
        "dojo/dom-style",
        "dojo/_base/declare",

        "dijit/registry",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "events/appMessages",
        "dojo/text!./templates/drawWidget.html",
        "bootstrap/Popover",
        "dijit/form/Button",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dijit/layout/ContentPane",
        "dijit/form/DropDownButton",
        "dojox/widget/ColorPicker",
        "dojo/domReady!"],
    function(aspect, kernel, domConstruct, Draw, esriConfig, Edit,
             GeometryService, TextSymbol, lang, event, connect, on, dom, query, domStyle, declare,
             registry, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, messages, template){

    var addedText;
    var globDraw;
    var editToolbar;
    var inputText;
    var isText = false;
    var markerSymbol;
    var lineSymbol;
    var polygonSymbol;

    return declare("drawWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

        widgetsInTemplate: true,

        templateString: template,

        init: function () {

            globDraw = this;

            esriConfig.defaults.geometryService = new GeometryService("http://gis.bentoncountyar.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer");

            markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 20, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([169,3,41]), 1), new dojo.Color([169,3,41, 1]));
            lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 4);
            polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([169,3,41]), 4), new dojo.Color([237, 194, 132, 0.3]));

            globDraw.initDrawingTools();
        },

        initDrawingTools: function(){

            var drawingTb = new Draw(map);
            drawingTb.on("draw-end", globDraw.addGraphic);

            var drawFeatures = registry.byId("drawFeatures");
            var drawButtons = registry.findWidgets(drawFeatures.domNode);
            for(var i = 0; i < drawButtons.length; i++){
                var currentBtn = drawButtons[i];
                on(currentBtn, "click", function(){
                    var splitID = this.id.toLowerCase().split("-");
                    var tool = splitID[1];
                    map.disableMapNavigation();
                    drawingTb.activate(tool);
                });
            }

            var addText = registry.byId("btnAddText");
            var ddlFontSize = registry.byId("ddlFontSize");
            var colorPicker = registry.byId("picker1");

            on(addText, "click", function(){
                var inputText = dom.byId("txtDrawText").value;
                if (inputText != "") {
                    isText = true;
                    addedText = new TextSymbol(inputText).setColor(new dojo.Color(colorPicker.value));
                    var selectedFontSize = ddlFontSize.value;
                    addedText.font.setSize(selectedFontSize + "pt");
                    map.disableMapNavigation();
                    drawingTb.activate("point");
                }else{
                    messages.showMessage("There is no text to add to map!");
                }
            });

            var btnClrDrawings = registry.byId("btnClrDrawings");
            on(btnClrDrawings, "click", function(){
                map.graphics.clear();
            });

        },

        addGraphic: function(evt) {

            //drawToolActive = false;

            //deactivate the toolbar and clear existing graphics
            this.deactivate();
            map.enableMapNavigation();

            // figure out which symbol to use
            if (isText){
                map.graphics.add(new esri.Graphic(evt.geometry, addedText));
                isText = false;
            }
            else
            {
                var symbol;
                if (evt.geometry.type === "point" || evt.geometry.type === "multipoint") {
                    //selectionGeometry = evt.geometry;
                    symbol = markerSymbol;
                } else if (evt.geometry.type === "line" || evt.geometry.type === "polyline") {
                    //selectionGeometry = evt.geometry;
                    symbol = lineSymbol;
                }
                else {
                    //selectionGeometry = evt.geometry;
                    symbol = polygonSymbol;
                }
                map.graphics.add(new esri.Graphic(evt.geometry, symbol));
            }
        },

        postCreate: function(){
            globDraw = this;
            globDraw.init();
        }
    });
});
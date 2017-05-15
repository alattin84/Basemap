define(["dojo/window",
        "dojo/dom",
        "dojo/dom-class",
        "dojo/_base/declare",
        "dojo/_base/kernel",
        "dojo/_base/array",
        "dojo/dom-construct",
        "dojo/query",
        "dijit/registry",
        'dojox/grid/EnhancedGrid',
        'dojo/data/ItemFileWriteStore',
        'dojo/date/stamp',
        "esri/tasks/query",
        "esri/graphicsUtils",
        "esri/layers/GraphicsLayer",
        "esri/toolbars/draw",
        "esri/graphic",
        "esri/tasks/GeometryService",
        "esri/tasks/BufferParameters",
        "esri/InfoTemplate",
        "esri/SpatialReference",
        "esri/tasks/QueryTask",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "events/appMessages",
        "dojo/text!./templates/searchWidget.html",
        "dijit/form/Select",
        "dijit/form/Button",
        "dijit/form/NumberSpinner",
        "dijit/layout/ContentPane",
        "dojox/layout/ContentPane",
        "dojox/grid/enhanced/plugins/Pagination",
        "dojox/grid/enhanced/plugins/Printer",
        "dojox/grid/enhanced/plugins/exporter/CSVWriter",
        "dojo/domReady!"],
    function(win, dom, domClass, declare, kernel, arrayUtil, domConstruct, query, registry, EnhancedGrid, ItemFileWriteStore, stamp,
             Query, graphicsUtils, GraphicsLayer, Draw, Graphic, GeometryService, BufferParameters, InfoTemplate, SpatialReference,
             QueryTask, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, messages, template){

        var dataField;
        var globSearch;
        var hasLink;
        var identifyGraLayer;
        var isDisabled;
        var isIdentify = false;
        var isSpatial = false;
        var layerInfo;
        var layerObj;
        var layout;
        var link;
        var linkTitle;
        var markerSymbol;
        var lineSymbol;
        var polygonSymbol;
        var options = [];
        var selectionGeometry;
        var splitOutFields;
        var splitAliasValues;
        var resultItems;

        return declare("searchWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function() {

                globSearch = this;
                identifyGraLayer = new GraphicsLayer({id: "identifyGra"});

                markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 25, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 1]));
                lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 0.25);
                polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0]));


                var ddlTxtSearch = registry.byId("ddlTxtSearch");
                var txtSearch = registry.byId("txtSearch");
                var ddlIdentifyLayers = registry.byId("ddlIdentifyLayers");
                var ddlSpatialLayers = registry.byId("ddlSpatialLayers");
                var ddlUnit = registry.byId("ddlUnit");
                var txtDistance = registry.byId("txtDistance");

                dojo.xhrGet({
                    url: "xml/searchConfig.json",
                    handleAs: "json",
                    load: function (obj) {
                        var layers = obj.layers.layer;
                        layerInfo = layers;
                        kernel.global.layerInfo = layerInfo;

                        var defaultOption = {value: 0, label: "--", selected: false};
                        options.push(defaultOption);

                        arrayUtil.forEach(layers, function (item, index) {
                            var option = {value: index + 1, label: item.name, selected: false};
                            options.push(option);
                        });
                        kernel.global.layerOptions = options;
                        ddlTxtSearch.addOption(options);
                        ddlIdentifyLayers.addOption(options);
                        ddlSpatialLayers.addOption(options);

                    }/*,
                    error: function () {
                        var error = "Could not load search list.";
                        globSearch.searchErrorDialog(error);
                    }*/
                });

                on(ddlTxtSearch, "change", function(index){
                    if(index > 0){
                        layerObj = layerInfo[index - 1];
                        txtSearch.textbox.placeholder = layerObj.placeholder;
                        globSearch.example.innerHTML = "i.e. " + layerObj.example;

                    }else{
                        txtSearch.textbox.placeholder = "Select layer to search...";
                        globSearch.example.innerHTML = "";
                    }
                });

                on(registry.byId("btnBuffer"), "click", function(){
                    var bufferDist = txtDistance.value;
                    var unitVal = ddlUnit.value;
                    globSearch.createBuffer(bufferDist, unitVal);
                });

                on(registry.byId("btnClrBuffer"), "click", function() {
                    map.graphics.clear();
                });

                on(registry.byId("btnSpaCon"), "click", function(){
                    if(kernel.global.selectedItem != null){
                        isSpatial = true;
                        var spaRelation = "SPATIAL_REL_CONTAINS";
                        layerObj = layerInfo[ddlSpatialLayers.value - 1];
                        globSearch.createInfoWindow(layerObj, "", kernel.global.selectedItem.geometry, spaRelation);
                    }
                });

                on(registry.byId("btnSpaInt"), "click", function(){
                    if(kernel.global.selectedItem != null){
                        isSpatial = true;
                        var spaRelation = "SPATIAL_REL_INTERSECTS";
                        layerObj = layerInfo[ddlSpatialLayers.value - 1];
                        globSearch.createInfoWindow(layerObj, "", kernel.global.selectedItem.geometry, spaRelation);
                    }
                });

                on(registry.byId("btnSearch"), "click", function(){
                    layerObj = layerInfo[ddlTxtSearch.value - 1];
                    globSearch.validateSearch(ddlTxtSearch, txtSearch);
                });

                on(registry.byId("txtSearch"), "keyup", function(evt){
                    if (evt) {
                        if (evt.keyCode == 13) {
                            layerObj = layerInfo[ddlTxtSearch.value - 1];
                            globSearch.validateSearch(ddlTxtSearch, txtSearch);
                        }
                        else {
                            return;
                        }
                    }
                });

                var drawingTb = new Draw(map);
                drawingTb.on("draw-end", globSearch.addGraphic);

                //Set draw button events
                var infoDraw = registry.byId("infoDraw");
                var drawButtons = registry.findWidgets(infoDraw.domNode);
                for(var i = 0; i < drawButtons.length; i++){
                    var currentBtn = drawButtons[i];
                    on(currentBtn, "click", function(){
                        var splitID = this.id.toLowerCase().split("-");
                        var tool = splitID[1];
                        if(tool === "remove"){
                            identifyGraLayer.clear();
                            map.graphics.clear();
                            return;
                        }
                        map.disableMapNavigation();
                        drawingTb.activate(tool);
                    });
                }
            },

            addGraphic: function(evt){

                if(registry.byId("ddlIdentifyLayers").value > 0){

                    layerObj = layerInfo[registry.byId("ddlIdentifyLayers").value - 1];

                    //deactivate the toolbar and clear existing graphics
                    this.deactivate();
                    map.enableMapNavigation();

                    // figure out which symbol to use
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
                    identifyGraLayer.add(new Graphic(evt.geometry,symbol));
                    map.addLayer(identifyGraLayer);

                    isIdentify = true;
                    globSearch.createInfoWindow(layerObj, "", evt.geometry, "");
                }else{
                    var error = "Please select a layer to identify!";
                    messages.showMessage(error);
                }
            },

            createInfoWindow: function (layer, searchValue, geometry, spatialRel) {
                var content = "";
                var outFields = [];
                var layerField = layer.fields.field;
                splitOutFields = [];
                splitAliasValues = [];

                infoTemplate = new InfoTemplate();

                if(layerField.length > 1){
                    for (var m = 0; m < layerField.length; m++) {
                        outFields.push(layerField[m].name);
                        splitOutFields[m] = layerField[m].name;
                        splitAliasValues[m] = layerField[m].alias;

                        if (layerField[m].name === "HYPEXT"){
                            content += "<b>" + layerField[m].alias + ":</b><a style='margin-left: 10px;' href='${" + layerField[m].name + "}' target='_blank'><i class='fa fa-file-pdf-o fa-2x'></i></a>";
                        }
                        else {
                            content += "<b>" + layerField[m].alias + ":</b> ${" + layerField[m].name + "}<br>";
                        }
                    }
                }else{
                    outFields.push(layerField.name);
                    splitOutFields[0] = layerField.name;
                    splitAliasValues[0] = layerField.alias;

                    if (layerField[m].name === "HYPEXT"){
                        content += "<b>" + layerField[m].alias + ":</b><a style='margin-left: 10px;' href='${" + layerField[m].name + "}' target='_blank'><i class='fa fa-file-pdf-o fa-2x'></i></a>";
                    }
                    else {
                        content += "<b>" + layerField[m].alias + ":</b> ${" + layerField[m].name + "}<br>";
                    }
                }

                if(layer.link){
                    var infoLink;
                    splitAliasValues.push("Link");
                    splitOutFields.push("link");
                    link = layer.link;
                    linkTitle = layer.linkTitle;
                    dataField = layer.dataField;
                    infoLink = "<b>Link: </b><a href='" + link + "' target='_blank'>" + linkTitle + "</a>";
                    content += infoLink;
                }

                infoTemplate.setTitle("${" + dataField + "}");
                infoTemplate.setContent(content);

                globSearch.createQueryTask(layer, outFields, searchValue, geometry, spatialRel);
            },

            createQueryTask: function(layer, outFields, searchValue, geometry, spatialRel){

                var queryExpr = layer.value.replace(/value/g, searchValue);
                var queryTask = new QueryTask(layer.url);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = outFields;
                query.outSpatialReference = map.spatialReference;
                queryTask.useAMF = false;

                if(isIdentify){

                    if(geometry.type === "point"){
                        query.geometry = globSearch.pointToExtent(map, geometry, 0.5);
                    }else{
                        query.geometry = geometry.getExtent();
                    }

                    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                    queryExpr = "";
                    isIdentify = false;
                }

                if(isSpatial){
                    query.spatialRelationship = dojo.eval("esri.tasks.Query." + spatialRel);
                    query.geometry = geometry;
                    queryExpr = "";
                    isSpatial = false;
                }

                query.where = queryExpr;

                queryTask.execute(query, globSearch.getResults);
            },

            createTable: function(){
                layout = [];

                var colWidth;
                var window = win.getBox();
                if(window.w < 768){
                    colWidth = Math.round(768 / (splitAliasValues.length + 1)) + "px";
                }else{
                    colWidth = "auto";
                }

                var identifyObj = {field: "id", name: "ID", styles: 'text-align: center;'};
                layout.push(identifyObj);

                //Create columns
                for (var i = 0; i < splitAliasValues.length; i++) {
                    var layoutObj;
                    if(splitAliasValues[i] == "Link" && splitOutFields[i] !== "HYPEXT"){
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', formatter: globSearch.makeCustomLink, width: colWidth};
                    }
                    else if(splitAliasValues[i] == "Link" && splitOutFields[i] == "HYPEXT"){
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', formatter: globSearch.makeHTMLLink, width: colWidth};
                    }
                    else{
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', width: colWidth};
                    }
                    layout.push(layoutObj);
                }
            },

            createGridSize: function(curRowCnt, layout, store){

                var grid;

                if(kernel.global.grid){
                    kernel.global.grid.destroy();
                }

                if(curRowCnt > 5){
                    grid = new EnhancedGrid({
                        id: 'grid',
                        store: store,
                        structure: layout,
                        autoHeight: false,
                        plugins: {
                            pagination: {
                                defaultPageSize: 5,
                                /*pageSizes: ["5", "10", "25", "50", "100", "All"],*/
                                description: true,
                                sizeSwitch: false,
                                pageStepper: true,
                                gotoButton: true,
                                /*page step to be displayed*/
                                maxPageStep: 4,
                                /*position of the pagination bar*/
                                position: "bottom"
                            },
                            printer: true,
                            exporter: true
                        }
                    });
                }else{
                    grid = new EnhancedGrid({
                        id: 'grid',
                        store: store,
                        structure: layout,
                        autoHeight: true,
                        plugins: {
                            printer: true,
                            exporter: true
                        }
                    });
                }

                grid.placeAt('resultsDiv');
                grid.startup();

                kernel.global.grid = grid;

                on(window, "resize", function(){

                    var window = win.getBox();
                    if(window.w < 768){
                        if(domClass.contains("resultsContainer", "results-open") & domClass.contains("panelSearch", "in")){
                            domClass.toggle("panelSearch", "in");
                        }
                    }

                    grid.resize();
                    grid.update();
                });
            },

            getResults: function(results){

                /*markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 25, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 1]));
                lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 0.25);
                polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0]));*/

                var data = {
                    identifier: 'id',
                    items: []
                };

                resultItems = results.features;

                globSearch.createTable();

                map.graphics.clear();

                for (var i = 0; i < resultItems.length; i++) {
                    var content = "";
                    var featureAttributes = resultItems[i].attributes;

                    var symbol;
                    var graphic = resultItems[i];
                    switch (graphic.geometry.type){
                        case "point":
                            //symbol = graphic.setSymbol(markerSymbol);
                            symbol = new esri.symbol.PictureMarkerSymbol("images/bluePin.png", 45, 45);
                            var mp = new esri.geometry.Point(graphic.geometry);
                            map.graphics.add(new esri.Graphic(mp, symbol));
                            break;
                        case "polyline":
                            symbol = graphic.setSymbol(lineSymbol);
                            map.graphics.add(symbol);
                            break;
                        case "polygon":
                            symbol = graphic.setSymbol(polygonSymbol);
                            map.graphics.add(symbol);
                            break;
                    }

                    for (var att in featureAttributes) {
                        if (att === dataField) {
                            var value = featureAttributes[att];
                            featureAttributes.link = value;
                        }
                    }

                    //Set the infoTemplate.
                    graphic.setInfoTemplate(infoTemplate);

                    data.items.push(dojo.mixin({id: i+1}, featureAttributes));
                }

                var store = new ItemFileWriteStore({data: data});

                globSearch.createGridSize(resultItems.length, layout, store);

                //resize the info window
                map.infoWindow.resize(300,250);

                //Set buttons and set them to disabled
                var printAll = registry.byId("printAll");
                var exportAll = registry.byId("exportAll");
                var clearAll = registry.byId("clearAll");
                printAll.setDisabled(false);
                exportAll.setDisabled(false);
                clearAll.setDisabled(false);

                var grid = kernel.global.grid;
                grid.on("rowclick", globSearch.onRowClickHandler);

                if(resultItems.length == 1){
                    kernel.global.selectedItem = resultItems[0];

                    if(resultItems[0].geometry.type != "point"){
                        map.setExtent(resultItems[0].geometry.getExtent(), true);
                    }
                }else{
                    if(results.features != null){
                        var featureExtent = graphicsUtils.graphicsExtent(results.features);
                        map.setExtent(featureExtent);
                    }else{
                        messages.showMessage("Search Error");
                    }
                }
            },

            makeCustomLink: function (data) {
                return "<a style='color: #396b9e' href='" + link.replace("${" + dataField + "}", data) + "' target='_blank'>" + linkTitle + "</a>";
            },

            makeHTMLLink: function (data) {
                return "<a style='color: #396b9e' href='" + data + "' target = '_blank'>" + data + "</a>";
            },

            onRowClickHandler: function(evt){
                var selectedFeature = resultItems[evt.rowIndex];
                kernel.global.selectedItem = selectedFeature;
                if(selectedFeature.geometry.type == "point"){
                    var mp = new esri.geometry.Point(selectedFeature.geometry);
                    map.centerAndZoom(mp, 19);
                }else{
                    map.setExtent(selectedFeature.geometry.getExtent(), true);
                }
            },

            validateSearch: function(ddlTxtSearch, txtSearch){

                if(ddlTxtSearch.value > 0){

                    if(txtSearch.textbox.value !== ""){
                        globSearch.createInfoWindow(layerObj, txtSearch.textbox.value);

                        var window = win.getBox();
                        if(window.w < 768){
                            domClass.toggle("panelSearch", "in");

                        }

                        if(!domClass.contains("resultsContainer", "results-open")){
                            domClass.toggle("resultsContainer", "results-open");
                        }
                    }else{
                        var error = "Please enter a search value!";
                        messages.showMessage(error);
                    }
                }else{
                    var error = "Please select a search layer!";
                    messages.showMessage(error);
                }

            },

            pointToExtent: function (map, point, toleranceInPixel) {
                //calculate map coords represented per pixel
                var pixelWidth = map.extent.getWidth() / map.width;

                //calculate map coords for tolerance in pixel
                var toleraceInMapCoords = toleranceInPixel * pixelWidth;

                var xmin = point.x - toleraceInMapCoords;
                var ymin = point.y - toleraceInMapCoords;
                var ymax = point.y + toleraceInMapCoords;
                var xmax = point.x + toleraceInMapCoords;

                var newExtent = new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);

                return newExtent;
            },

            createBuffer: function(bufferDist, unitVal){
                var gsvc = new GeometryService("http://gis.bentoncountyar.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                var params = new BufferParameters();
                var unit = unitVal;
                params.distances = [bufferDist];
                params.bufferSpatialReference = new SpatialReference(map.spatialReference);
                params.outSpatialReference = map.spatialReference;
                params.unit = dojo.eval("esri.tasks.GeometryService." + unit);
                try {

                    var selectedItem = kernel.global.selectedItem;
                    var geometry = selectedItem.geometry;

                    //if geometry is a polygon then simplify polygon.  This will make the user drawn polygon topologically correct.
                    gsvc.simplify([geometry], function (geometries) {
                        params.geometries = geometries;
                        gsvc.buffer(params, globSearch.showBuffer);
                    });
                }
                catch (error) {
                    var error = "Please search for feature first";
                    messages.showMessage(error);
                }
            },

            showBuffer: function (bufferedGeometries) {
                var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0, 0.65]), 2), new dojo.Color([255, 0, 0, 0.35]));

                dojo.forEach(bufferedGeometries, function (geometry) {
                    var graphic = new Graphic(geometry, symbol);
                    kernel.global.selectedItem = graphic;
                    map.graphics.add(graphic);
                });
            },

            postCreate: function(){
                globSearch = this;
                globSearch.init();
            }
        });
    });

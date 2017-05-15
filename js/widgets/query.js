define(["dojo/window",
        "dojo/_base/declare",
        "dojo/dom-class",
        "dijit/registry",
        "dojo/_base/kernel",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "dojo/_base/array",
        "esri/graphicsUtils",
        'dojox/grid/EnhancedGrid',
        'dojo/data/ItemFileWriteStore',
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "events/appMessages",
        "dojo/text!./templates/queryWidget.html",
        "dijit/layout/ContentPane",
        "dijit/layout/TabContainer",
        "dojox/layout/TableContainer",
        "dijit/form/Select",
        "dijit/form/SimpleTextarea",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dojo/domReady!"],
    function(win, declare, domClass, registry, kernel, Query, QueryTask, arrayUtil, graphicsUtils, EnhancedGrid, ItemFileWriteStore,
             _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, messages, template){

        var globQuery;
        var isRelational;
        var layerObj;
        var splitOutFields;
        var splitAliasValues;
        var layout;
        var layerInfo;
        var options = [];
        var link;
        var linkTitle;
        var hasLink;
        var dataField;
        var resultItems;

        return declare("queryWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function(){

                var operators = ["--", "=", "<>", "<", ">", "<=", ">=", "%", "Or", "And", "Like"];

                var spatialRel = [
                    { value: "SPATIAL_REL_INTERSECTS", label: "partially or completely within" },
                    { value: "SPATIAL_REL_CONTAINS", label: "completely within"},
                    { value: "SPATIAL_REL_OVERLAPS", label: "partially within"},
                    { value: "SPATIAL_REL_WITHIN", label: "fully inside"}];

                //var ddlSearch = registry.byId("ddlSearch");
                var ddlQueryLayer = registry.byId("ddlQueryLayer");
                var ddlQueryFields = registry.byId("ddlQueryFields");
                var ddlQueryOps = registry.byId("ddlQueryOps");
                var ddlSpaRelation = registry.byId("ddlSpaRelation");
                var ddlSourceLayer = registry.byId("ddlSourceLayer");
                var txtQueryExpr = registry.byId("txtQueryExpr");
                var btnQuery = registry.byId("btnQuery");
                var btnSelectByLoc = registry.byId("btnSelectByLoc");
                var btnClrQuery = registry.byId("btnClrQuery");

                dojo.xhrGet({
                    url: "xml/searchConfig.json",
                    handleAs: "json",
                    load: function (obj) {
                        var layers = obj.layers.layer;
                        layerInfo = layers;

                        var defaultOption = {value: 0, label: "--", selected: false};
                        options.push(defaultOption);

                        arrayUtil.forEach(layers, function (item, index) {
                            var option = {value: index + 1, label: item.name, selected: false};
                            options.push(option);
                        });
                        ddlQueryLayer.addOption(options);

                        //Setup select by location
                        ddlSpaRelation.addOption(spatialRel);
                        ddlSourceLayer.addOption(options);

                    },
                     error: function () {
                     var error = "Could not load search list!";
                     messages.showMessage(error);
                     }
                });

                var option = { value: "--", label: "--", selected: false };
                ddlQueryFields.addOption(option);

                //Load Operator list
                for(var i = 0; i < operators.length; i++){
                    var op = { value: operators[i], label: operators[i], selected: false };
                    ddlQueryOps.addOption(op);
                }

                //On layer change
                on(ddlQueryLayer, "change", function(index){
                    var options = [];

                    //Clear old field options in case another layer is selected.
                    ddlQueryFields.options = [];

                    //If not default value
                    if(index > 0){

                        //LayerInfo is a global variable used throughout application.
                        layerObj = layerInfo[index - 1];
                        var fields = layerObj.fields.field;

                        //Create option markup
                        if(fields.length > 0){
                            for(var i = 0; i < fields.length; i++){
                                options.push({ value: fields[i].name, label: fields[i].name, selected:false });
                            }
                        }else{
                            options.push({ value: fields.name, label: fields.name, selected:false });
                        }
                    }else{
                        options.push({ value: 0, label: "--", selected: false });
                    }

                    //Add the compiled options to the dijit.
                    ddlQueryFields.addOption(options);
                });

                on(ddlQueryFields, "change", function(index){
                    var currText = txtQueryExpr.get("value");
                    txtQueryExpr.set("value", currText + index);
                });

                //On Operator change
                on(ddlQueryOps, "change", function(index){
                    var currText = txtQueryExpr.get("value");
                    txtQueryExpr.set("value", currText + index);
                });

                //On select by attribute click
                on(btnQuery, "click", function(){
                    isRelational = false;
                    layerObj = layerInfo[ddlQueryLayer.value - 1];

                    var loadedFeatures = dojo.byId("loadedFeatures");
                    if(ddlQueryLayer.value > 0){
                        if(txtQueryExpr.value != ""){
                            globQuery.createInfoWindow(layerObj, spatialRel.value, txtQueryExpr.value);
                        }else{
                            messages.showMessage("Please enter a query expression!");
                        }
                    }else{
                        messages.showMessage("Please select a search layer!");
                    }
                });

                on(btnSelectByLoc, "click", function(){
                    isRelational = true;
                    layerObj = layerInfo[ddlSourceLayer.value - 1];

                    if(loadedFeatures.innerHTML != ""){
                        if(ddlSourceLayer.value > 0) {
                            globQuery.createInfoWindow(layerObj, spatialRel.value, "");
                        }else{
                            messages.showMessage("Please select a source layer!");
                        }
                    }else{
                        messages.showMessage("Please load a feature by selecting a result first!");
                    }
                });

                on(btnClrQuery, "click", function(){
                    map.graphics.clear();
                });

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
                        if(domClass.contains("resultsContainer", "results-open") & domClass.contains("panelQuery", "in")){
                            domClass.toggle("panelQuery", "in");
                        }
                    }

                    grid.resize();
                    grid.update();
                });
            },

            createInfoWindow: function(layer, spaRelation, queryExpr){
                var content = "";
                var outFields = [];
                var layerField = layer.fields.field;
                splitOutFields = [];
                splitAliasValues = [];

                if(layerField.length > 1){
                    for (var m = 0; m < layerField.length; m++) {
                        outFields.push(layerField[m].name);
                        splitOutFields[m] = layerField[m].name;
                        splitAliasValues[m] = layerField[m].alias;
                    }
                }else{
                    outFields.push(layerField.name);
                    splitOutFields[0] = layerField.name;
                    splitAliasValues[0] = layerField.alias;
                }

                if(layer.link){
                    splitAliasValues.push("Link");
                    splitOutFields.push("link");
                    link = layer.link;
                    linkTitle = layer.linkTitle;
                    dataField = layer.dataField;
                }

                var window = win.getBox();
                if(window.w < 768){
                    domClass.toggle("panelQuery", "in");

                }

                if(!domClass.contains("resultsContainer", "results-open")){
                    domClass.toggle("resultsContainer", "results-open");
                }

                globQuery.createQueryTask(layer, outFields, spaRelation, queryExpr);
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
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', formatter: globQuery.makeCustomLink, width: colWidth};
                    }
                    else if(splitAliasValues[i] == "Link" && splitOutFields[i] == "HYPEXT"){
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', formatter: globQuery.makeHTMLLink, width: colWidth};
                    }
                    else{
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', width: colWidth};
                    }
                    layout.push(layoutObj);
                }
            },

            createQueryTask: function(layer, outFields, spaRelation, queryExpr){
                //var queryExpr = layer.value.replace(/value/g, searchValue);
                var queryTask = new QueryTask(layer.url);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = outFields;
                query.outSpatialReference = map.spatialReference;
                queryTask.useAMF = false;
                query.where = queryExpr;

                if(isRelational) {
                    if (spaRelation == "SPATIAL_REL_INTERSECTS") {
                        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
                    }
                    else if (spaRelation == "SPATIAL_REL_CONTAINS") {
                        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
                    }
                    else if (spaRelation == "SPATIAL_REL_OVERLAPS") {
                        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_OVERLAPS;
                    }
                    isRelational = false;
                    query.geometry = kernel.global.selectedItem.geometry;
                }
                queryTask.execute(query, globQuery.getResults);
            },

            getResults: function(results){

                var markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 25, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 1]));
                var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 0, 0]), 0.25);
                var polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 233, 0]), 4), new dojo.Color([255, 0, 0, 0]));

                var data = {
                    identifier: 'id',
                    items: []
                };

                globQuery.createTable();

                resultItems = results.features;

                map.graphics.clear();

                for (var i = 0; i < resultItems.length; i++) {
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
                    data.items.push(dojo.mixin({id: i+1}, featureAttributes));
                }
                var store = new ItemFileWriteStore({data: data});

                globQuery.createGridSize(resultItems.length, layout, store);

                var printAll = registry.byId("printAll");
                var exportAll = registry.byId("exportAll");
                var clearAll = registry.byId("clearAll");
                printAll.setDisabled(false);
                exportAll.setDisabled(false);
                clearAll.setDisabled(false);

                var grid = kernel.global.grid;
                grid.on("rowclick", globQuery.onRowClickHandler);

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
                        messages.showMessage("Query could not find results!");
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

                var loadedFeatures = dojo.byId("loadedFeatures");
                loadedFeatures.innerHTML = 1;

                if(selectedFeature.geometry.type == "point"){
                    var mp = new esri.geometry.Point(selectedFeature.geometry);
                    map.centerAndZoom(mp, 19);
                }else{
                    map.setExtent(selectedFeature.geometry.getExtent(), true);
                }
            },

            postCreate: function(){
                globQuery = this;
                globQuery.init();
            }
        });
    });

define(["dojo/_base/declare",
        "dojo/query",
        "dojo/on",
        "dojo/dom-style",
        "dijit/registry",
        "dijit/Dialog",
        "esri/toolbars/draw",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/tasks/Geoprocessor",
        "esri/tasks/FeatureSet",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "events/appMessages",
        "dojo/text!./templates/dataExtWidget.html",
        "dijit/form/Button",
        "dojox/layout/TableContainer",
        "dijit/form/CheckBox",
        "dijit/form/Select",
        "dijit/form/Button",
        "dojo/domReady!"],
    function(declare, query, on, domStyle, registry, Dialog, Draw, ArcGISDynamicMapServiceLayer, Geoprocessor,
             FeatureSet, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, messages, template){

        var AOI;
        var globData;
        var gp = new Geoprocessor("http://gis.bentoncountyar.gov/arcgis/rest/services/DataExtract/ExtractDataTask/GPServer/Extract%20Data%20Task");
        var polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([169,3,41]), 4), new dojo.Color([237, 194, 132, 0.3]));


        return declare("dataExtWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function(){

                gp.setOutSpatialReference({wkid: 102651});

                var drawingBtn = new Draw(map);
                drawingBtn.on("draw-end", globData.addGraphic);

                on(registry.byId("draw-Extent"), "click", function(){
                    map.graphics.clear();
                    map.disableMapNavigation();
                    drawingBtn.activate("polygon");
                });

                on(registry.byId("clrExtent"), "click", function(){
                    map.graphics.clear();
                });

                on(registry.byId("download"), "click", function() {
                    var dataLayers = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/DataExtract/DataExtract/MapServer");
                    map.addLayer(dataLayers);

                    var layersToClip = [];
                    if (registry.byId("chkRoads").get("checked")) {
                        layersToClip.push("ACF_Roads");
                    }
                    if (registry.byId("chkContours").get("checked")) {
                        layersToClip.push("Contours_2ft");
                    }
                    if (registry.byId("chkParcels").get("checked")) {
                        layersToClip.push("Parcels");
                    }
                    if (registry.byId("chkSubs").get("checked")) {
                        layersToClip.push("Subdivisions");
                    }
                    var featureFormat = registry.byId("ddlFeatureFormat").value;

                    if (layersToClip.length === 0 || map.graphics.graphics.length === 0) {
                        alert("Select layers to extract and draw an area of interest.");
                        return;
                    }

                    var featureSet = new FeatureSet();
                    var features = [];
                    features.push(map.graphics.graphics[0]);
                    featureSet.features = features;

                    var params = {
                        "Layers_to_Clip": layersToClip,
                        "Area_of_Interest": featureSet,
                        "Feature_Format": featureFormat
                    };

                    domStyle.set("loadingImg", { display: "block" });

                    gp.submitJob(params, globData.completeCallback, globData.statusCallback, globData.showError);
                    map.removeLayer(dataLayers);
                });
            },

            addGraphic: function(evt){
                //deactivate the toolbar and clear existing graphics
                this.deactivate();
                map.enableMapNavigation();
                map.graphics.add(new esri.Graphic(evt.geometry, polygonSymbol));
            },

            completeCallback: function(jobInfo){
                if (jobInfo.jobStatus !== "esriJobFailed") {
                    gp.getResultData(jobInfo.jobId, "Output_Zip_File", function(outputFile){
                        map.graphics.clear();
                        var jobUrl = outputFile.value.url;
                        window.location = jobUrl;
                    });
                }
            },

            statusCallback: function(jobInfo){
                var status = jobInfo.jobStatus;
                if (status === "esriJobFailed") {
                    var error = "<p style='text-align: center; font-size: 16px; margin: 0;'>Request Failed!</p>";
                    messages.showMessage(error);

                    setTimeout(function(){
                        domStyle.set("loadingImg", { display: "none" });
                    }, 1000);
                }
                else if (status === "esriJobSucceeded"){
                    var content = "<p style='text-align: center; font-size: 16px; margin: 0;'>Request Succeeded!</p>";
                    messages.showMessage(content);

                    setTimeout(function(){
                        domStyle.set("loadingImg", { display: "none" });
                    }, 1000);
                }
            },

            showError: function(error){
                /*var errorDiag = new Dialog({
                    title: "Download Status:",
                    content: error,
                    style: "width: 250px"
                });
                errorDiag.show();*/
                messages.showMessage(error);
            },

            showSuccess: function(content){
                /*var successDiag = new Dialog({
                    title: "Download Status:",
                    content: content,
                    style: "width: 250px"
                });
                successDiag.show();*/
                messages.showMessage(content);
            },

            postCreate: function(){
                globData = this;
                globData.init();
            }
        });
    });

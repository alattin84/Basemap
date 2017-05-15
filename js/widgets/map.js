var app;
define([
    // ArcGIS
    "dojo/_base/kernel",
    "dojo/_base/array",
    "esri/arcgis/utils",
    "esri/dijit/LayerList",
    "esri/map",
    "esri/InfoTemplate",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ImageParameters",
    "esri/layers/LayerInfo",
    "esri/dijit/Search",
    "esri/geometry/Extent",
    "esri/dijit/Scalebar",
    "esri/toolbars/navigation",
    "esri/dijit/Legend",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",
    "esri/InfoTemplate",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/MenuSeparator",
    "dojo/query",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.2",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",
    "bootstrap/Tab",

    "dojo/domReady!"
], function(kernel, arrayUtil, arcgisUtils, LayerList, Map, InfoTemplate, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer,
            ImageParameters, LayerInfo, Search, Extent, Scalebar, Navigation, Legend, webMercatorUtils, Point, InfoTemplate, Menu, MenuItem, MenuSeparator,
            query, dom, domConstruct, domClass, domStyle, on, CalciteMaps) {

    var globMap;

    return {

        init: function () {

            globMap = this;

            // App
            app = {
                map: null,
                //basemap: "dark-gray",
                //center: [-40, 40], // lon, lat
                zoom: 1,
                initialExtent: null,
                searchWidgetNav: null,
                searchWidgetPanel: null
            };

            app.initialExtent = new Extent({
                "xmin": 541916,
                "ymin": 635021,
                "xmax": 778177,
                "ymax": 799939,
                "spatialReference": {"wkid": 102651}
            });

            // Map
            app.map = new Map("mapViewDiv", {
                extent: app.initialExtent,
                center: app.center,
                logo: false,
                zoom: app.zoom
            });

            var imageParameters = new ImageParameters();
            imageParameters.format = "png32";

            //Standard Basemap Layers
            var aerial16 = new ArcGISTiledMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Aerials/Aerials_2016/MapServer", {
                className: "Aerial: 2016",
                visible: true,
                id: "Aerial: 2016"
            });
            var usgs = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/ArcGIS/rest/services/Basemaps/USGSQuad/MapServer", {
                "className": "USGS Topo",
                visible: false,
                id: "USGS Topo"
            });
            var districts = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Districts/MapServer", {
                "className": "District Maps",
                imageParameters: imageParameters,
                visible: true,
                id: "District Maps"
            });
            var planning = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Planning/MapServer", {
                "className": "Planning",
                imageParameters: imageParameters,
                visible: true,
                id: "Planning"
            });
            var places = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Places/MapServer", {
                "className": "Places",
                imageParameters: imageParameters,
                visible: true,
                id: "Places"
            });
            var fema = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/FEMA/MapServer", {
                "className": "FEMA",
                imageParameters: imageParameters,
                visible: true,
                id: "FEMA"
            });
            var environ = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Environmental/MapServer", {
                "className": "Environmental",
                imageParameters: imageParameters,
                visible: true,
                id: "Environmental"
            });
            var trans = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Transportation/MapServer", {
                "className": "Transportation",
                visible: true,
                id: "Transportation"
            });
            var contour = new ArcGISTiledMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Topography/MapServer", {
                "className": "Contours",
                visible: false,
                id: "Contours"
            });
            var cadastral = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/Cadastral/MapServer", {
                className: "Cadastral",
                imageParameters: imageParameters,
                visible: true,
                id: "Cadastral"
            });
            var uspls = new ArcGISDynamicMapServiceLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Basemaps/USPLS/MapServer", {
                "className": "USPLS",
                visible: true,
                id: "USPLS"
            });

            //Add Layers to map
            app.map.addLayers([aerial16, usgs, districts, planning, places, fema, environ, trans, contour, cadastral, uspls]);

            kernel.global.map = app.map;

            /*//Added For Popup Templates- Modifications
             var popupDiv = document.createElement("div");
             popupDiv.id = "esriPopUp";
             var popup = new esri.dijit.PopupMobile(null, popupDiv);
             map.setInfoWindow(popup);

             var template = new InfoTemplate();

             template.setTitle("<b>Parcel Id:</b> ${PARCELID}");
             var link = "<a href='http://www.arcountydata.com/parcel.asp?parcelid=${PARCELID}&county=Benton&AISGIS=Benton' target='_blank'>ARCounty Data Information</a>";
             template.setContent("<b>Owner:</b> ${OW_NAME}<br /><b>Address:</b> ${PH_ADD}<br /><b>Acres:</b> ${GIS_EST_ACREAGE}<br /><b>Link: </b>" + link);*/

            //add the legend
            map.on("layers-add-result", function (evt) {
                var layerInfo = arrayUtil.map(evt.layers, function (layer, index) {
                    return {layer: layer.layer, title: layer.layer.name};
                });

                if (layerInfo.length > 0) {
                    var legendDijit = new Legend({
                        map: app.map,
                        layerInfos: layerInfo
                    }, "legendList");
                    legendDijit.startup();
                }

                globMap.initNavigation(map);
            });

            var layerList = new LayerList({
                map: app.map,
                showOpacitySlider: true,
                showLegend: true,
                layers: arcgisUtils.getLayerList(app.map)
            }, "layerList");
            layerList.startup();

            layerList.on('load', function () {
                expandLayerList();
                enhanceLayer();
            });

            var scalebar = new Scalebar({
                map: app.map,
                // "dual" displays both miles and kilometers
                // "english" is the default, which displays miles
                // use "metric" for kilometers
                scalebarUnit: "english",
                scalebarStyle: "ruler",
                attachTo: "bottom-right"
            });

            function expandLayerList() {
                //This first part will expand the main layers.
                /*query('.esriLayer').forEach(function(node){
                 domClass.add(node, "esriListExpand");
                 });*/
                /*query('.esriToggleButton').forEach(function(node){
                 domClass.replace(node, "esri-icon-down", "esri-icon-right");
                 });*/

                //This part will collapse the sublayer lists
                query('.esriSubListLayer.esriHasSubList.esriSubListExpand.esriListVisible').forEach(function (node) {
                    //console.info(node);
                    domClass.remove(node, "esriSubListExpand");
                    domClass.remove(node, "esriListVisible");
                });
            }

            function enhanceLayer() {
                var subListNodes = query('.esriSubListLayer.esriHasSubList');
                if (subListNodes.length > 0) {
                    arrayUtil.map(subListNodes, function (subListNode) {
                        var titleContainerNode = query(subListNode).children(".esriTitle").children(".esriTitleContainer");
                        var subListExpander = domConstruct.create("div", {
                            role: "button",
                            style: {
                                backgroundPosition: "center",
                                height: "20px",
                                width: "20px",
                                float: "left",
                                marginTop: "5px",
                                marginLeft: "8px",
                                textAlign: "center",
                                cursor: "pointer"
                            },
                            className: "esri-icon-right"
                        });
                        domConstruct.place(subListExpander, titleContainerNode[0], 'first');

                        on(subListExpander, 'click', function (evt) {
                            var esriSubList = query(subListExpander).closest(".esriSubListLayer.esriHasSubList").children(".esriSubList");
                            if (domClass.contains(esriSubList[0], "esriSubListToggle")) {
                                domClass.replace(subListExpander, "esri-icon-right", "esri-icon-down");
                                domClass.remove(esriSubList[0], "esriSubListToggle");
                            } else {
                                domClass.replace(subListExpander, "esri-icon-down", "esri-icon-right");
                                domClass.add(esriSubList[0], "esriSubListToggle");
                            }
                            //domClass.toggle(esriSubList[0], "esriSubList");
                        });

                    });
                }
            }

            map.on("load", function(){

                // Creates right-click context menu for map
                var ctxMenuForGraphics, ctxMenuForMap, locX, locY, template;

                ctxMenuForMap = new Menu({
                    onOpen: function(box) {
                        // Lets calculate the map coordinates where user right clicked.
                        currentLocation = getMapPointFromMenuPosition(box);
                    }
                });


                ctxMenuForMap.addChild(new MenuItem({
                    label: "Find X,Y (State Plane)",
                    onClick: function() {
                        var sp = esri.geometry.ScreenPoint(locX, locY);
                        var mp = map.toMap(sp);
                        var inputpoint = new esri.geometry.Point(mp.x, mp.y);
                        var title = "State Plane Coordinates";
                        var content = "(" + inputpoint.x.toFixed(6) + ", " + inputpoint.y.toFixed(6) + ")";
                        addInfoTemplate(inputpoint, title, content);
                        console.log("State Plane: " + mp.x.toFixed(2)  + ", " + mp.y.toFixed(2));
                    }
                }));

                ctxMenuForMap.addChild(new MenuItem({
                    label: "Find Latitude/Longitude",
                    onClick: function() {
                        var sp = esri.geometry.ScreenPoint(locX, locY);
                        var mp = map.toMap(sp);
                        var inSR = new esri.SpatialReference({
                            wkid: map.spatialReference.wkid
                        });
                        var outSR = new esri.SpatialReference({
                            wkid: 4326
                        });
                        var geometryService = new esri.tasks.GeometryService("http://gis.bentoncountyar.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                        var inputpoint = new esri.geometry.Point(mp.x, mp.y, inSR);
                        var PrjParams = new esri.tasks.ProjectParameters();
                        PrjParams.geometries = [inputpoint];
                        PrjParams.outSR = outSR;
                        PrjParams.transformation = {
                            wkid: parseInt("1188", 10)
                        };
                        geometryService.project(PrjParams, function (outputpoint) {
                            var title = "Lat/Long Coordinates";
                            var content = "(" + outputpoint[0].y.toFixed(6) + ", " + outputpoint[0].x.toFixed(6) + ")";
                            addInfoTemplate(inputpoint, title, content);
                            console.log("Lat/Long: " + outputpoint[0].y.toFixed(6) + ", " + outputpoint[0].x.toFixed(6) );
                        });
                    }
                }));

                ctxMenuForMap.addChild(new MenuSeparator());
                ctxMenuForMap.addChild(new MenuItem({
                    label: "Clear Graphics",
                    onClick: function() {
                        map.graphics.clear();
                    }
                }));

                function addInfoTemplate(inputpoint, title, content){
                    var infoTemplate = new InfoTemplate(title, content);
                    var symbol = new esri.symbol.PictureMarkerSymbol("images/bluePin.png", 35, 35);
                    var graphic = new esri.Graphic(inputpoint, symbol);
                    graphic.setSymbol(symbol);
                    graphic.setInfoTemplate(infoTemplate);
                    map.graphics.add(graphic);
                }

                function getMapPointFromMenuPosition(box) {
                    var x = box.x, y = box.y;
                    switch( box.corner ) {
                        case "TR":
                            x += box.w;
                            break;
                        case "BL":
                            y += box.h;
                            break;
                        case "BR":
                            x += box.w;
                            y += box.h;
                            break;
                    }

                    locX = x - map.position.x;
                    locY = y - map.position.y;
                }

                ctxMenuForMap.startup();
                ctxMenuForMap.bindDomNode(map.container);
            });
        },

        initNavigation: function(map){
            var navToolbar = new Navigation(map);
            //navToolbar.on("onExtentHistoryChange", globMap.extentHistoryChangeHandler);

            on(dom.byId("fullExt"), "click", function () {
                navToolbar.zoomToFullExtent();
            });

            on(dom.byId("prevExt"), "click", function () {
                navToolbar.zoomToPrevExtent();
            });

            on(dom.byId("nextExt"), "click", function () {
                navToolbar.zoomToNextExtent();
            });
        }

       /* extentHistoryChangeHandler: function(navToolbar){
            registry.byId("btnPrevExt").disabled = navToolbar.isFirstExtent();
            registry.byId("btnNextExt").disabled = navToolbar.isLastExtent();
        }*/
    }
});

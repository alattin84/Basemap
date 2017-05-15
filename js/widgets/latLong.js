define(["dojo/_base/declare",
        "dijit/registry",
        "esri/geometry/Point",
        "esri/tasks/ProjectParameters",
        "esri/SpatialReference",
        "esri/tasks/GeometryService",
        "dojo/dom",
        "events/appMessages",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/on",
        "dojo/text!./templates/latLongWidget.html",
        "dijit/form/Button",
        "dojo/domReady!"],
    function(declare, registry, Point, ProjectParameters, SpatialReference, GeometryService, dom, messages, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, template){

        var globLatLong;
        var isLatValid;
        var isLongValid;
        var geometryService = new GeometryService("http://gis.bentoncountyar.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer");

        return declare("latLongWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            widgetsInTemplate: true,

            templateString: template,

            init: function() {
                var ddlCoord = registry.byId("ddlCoord");
                on(ddlCoord, "change", function(index){

                    if(index == "DD"){
                        dojo.style(dojo.byId("divDMS"), "display", "none");
                        dojo.style(dojo.byId("divDecDeg"), "display", "block");
                    }else{
                        dojo.style(dojo.byId("divDecDeg"), "display", "none");
                        dojo.style(dojo.byId("divDMS"), "display", "block");
                    }

                });

                on(registry.byId('btnLocate'), 'click', function(){
                    isLatValid = false;
                    isLongValid = false;
                    if(ddlCoord.value === "DMS") {
                        var latDeg = parseInt(dom.byId('txtLatDeg').value);
                        var latMin = parseInt(dom.byId('txtLatMin').value);
                        var latSec = parseFloat(dom.byId('txtLatSec').value);
                        var lonDeg = parseInt(dom.byId('txtLonDeg').value);
                        var lonMin = parseInt(dom.byId('txtLonMin').value);
                        var lonSec = parseFloat(dom.byId('txtLonSec').value);
                        var latDD = globLatLong.formatLat(latDeg, latMin, latSec);
                        var lonDD = globLatLong.formatLong(lonDeg, lonMin, lonSec);
                        var point = latDD + "," + (lonDD * -1);
                        if(isLatValid && isLongValid){
                            globLatLong.reproject(point);
                        }
                    }
                    else{
                        var point = dom.byId("txtDecDeg").value;
                        var pointStr = point.split(",");

                        if(Number(pointStr[0]) && Number(pointStr[1])){
                            globLatLong.reproject(point);
                        }else{
                            messages.showMessage("Enter a valid coordinate.")
                        }
                    }
                });
            },

            formatLat: function(degree, minute, second){
                if(Number.isInteger(degree)  && Number.isInteger(minute) && Number(second)){
                    isLatValid = true;
                    var dd = (second/3600) + (minute/60) + degree;
                    return dd;
                }else{
                    messages.showMessage("Enter valid a latitude!")
                }
            },

            formatLong: function(degree, minute, second){
                if(Number.isInteger(degree)  && Number.isInteger(minute) && Number(second)){
                    isLongValid = true;
                    var dd = (second/3600) + (minute/60) + degree;
                    return dd;
                }else{
                    messages.showMessage("Enter valid a longitude!")
                }
            },

            reproject: function(pt){
                var spLatLong = pt.split(',');
                var inLat = spLatLong[0];
                var inLon = spLatLong[1];
                var inSR = new SpatialReference(4326);
                var outRef = new SpatialReference(102651);
                var inputPoint = new Point(inLon, inLat, inSR);
                //globLocate.zoomToPoint(inputPoint);
                var PrjParams = new ProjectParameters();
                PrjParams.transformation = new SpatialReference(108190);
                geometryService.project([inputPoint], outRef, globLatLong.zoomToPoint);
            },

            zoomToPoint: function(point){
                var outLatLong = point[0].y + ", " + point[0].x;
                map.centerAndZoom(point[0], 19);
                var symbol = new esri.symbol.PictureMarkerSymbol("images/bluePin.png", 64, 64);
                map.graphics.add(new esri.Graphic(point[0], symbol));
                setTimeout(function () { map.graphics.clear(); }, 5000);
            },

            postCreate: function(){
                globLatLong = this;
                globLatLong.init();
            }
        });
    });

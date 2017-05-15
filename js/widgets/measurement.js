define(["dojo/dom",
    "esri/tasks/GeometryService",
    "esri/dijit/Measurement",
    "dojo/domReady!"], function(dom, GeometryService, Measurement){

    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

    return {
        init: function(){
            var measurement = new Measurement({
                map: map
            }, dom.byId("measurementDiv"));
            measurement.startup();
        }
    }
});

require(["widgets/map",
         "widgets/measurement",
         "widgets/draw",
         "widgets/dataExtractor",
         "widgets/latLong",
         "widgets/print",
         "widgets/scale",
         "widgets/search",
         "widgets/searchGrid",
         "widgets/query",
         "dojo/dom",
         "dojo/dom-class",
         "dojo/on",
         "dojo/query",
         "events/appEvents",
         "events/appMessages",
         "dojo/ready"
], function (Map, Measure, Draw, DataExtractor, LatLong, Print, Scale, Search, SearchGrid, QuerySearch, dom, domClass, on, query, events, messages, ready) {
    //Load components
    ready(function(){

        //Loading map
        Map.init();

        //Load measure tool
        Measure.init();

        //Load draw
        var drawWidget = new Draw();
        drawWidget.placeAt("drawDiv").startup();

        //Load data extractor
        var dataExtWidget = new DataExtractor();
        dataExtWidget.placeAt("dataExtDiv").startup();

        //Load lat/long
        var latLongWidget = new LatLong();
        latLongWidget.placeAt("latLongDiv").startup();

        //Load print
        var printWidget = new Print();
        printWidget.placeAt("printDiv").startup();

        //Load scale
        var scaleWidget = new Scale();
        scaleWidget.placeAt("scaleDiv").startup();

        //Load search
        var searchWidget = new Search();
        searchWidget.placeAt("searchDiv").startup();

        //Load results grid
        var searchGridWidget = new SearchGrid();
        searchGridWidget.placeAt("resultsContainer").startup();

        //Load query
        var queryWidget = new QuerySearch();
        queryWidget.placeAt("queryDiv").startup();

        var loadingPane = dom.byId("loadingPane");
        setTimeout(function(){
            domClass.add(loadingPane, "loader-hidden");
        }, 5000);

        //Load events
        events.init();
        messages.init();
    });
});

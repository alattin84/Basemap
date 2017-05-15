define(["dojo/query",
        "dojo/on",
        "dojo/dom-class",
        "bootstrap/Modal",
        "bootstrap/Popover",
        "dojo/domReady!"
], function(query, on, domClass) {

    return {
        init: function(){

             var discModal = query('#disc-modal');
             discModal.modal('show');

             var btnDecline = query('#btnDecline');
             btnDecline.on('click', function(){
                window.location.href = "http://gis.bentoncountyar.gov";
             });

            //Popovers for application
             var menuMsg = query("#menu-pop");
             menuMsg.popover('show').on('click', function(){
                menuMsg.popover('destroy');
             });

             setTimeout(function(){
             menuMsg.popover('destroy');
             }, 15000);

            //Result tab events
            var enabled = false;
            var resultTab = dojo.byId("panelResults");
            on(resultTab, "click", function(){
                /*if(enabled){
                    domClass.replace("result-icon", "glyphicon glyphicon-list-alt");
                    enabled = false;
                }else{
                    domClass.replace("result-icon", "glyphicon glyphicon-resize-small");
                    enabled = true;
                }*/
                domClass.toggle("resultsContainer", "results-open");
            });

            /*var gridMenu = dojo.byId("gridMenu");
            on(gridMenu, "click", function(){
                domClass.toggle("resultsContainer", "results-open");
            });*/

            domClass.toggle("panelSearch", "in");
            domClass.toggle("collapseSearch", "in");

            //Draw
            var drawPop = query("#drawPop");
            drawPop.popover({
                html: true,
                content: "<p>1: Click a shape to start drawing.</p>" +
                         "<p>2: Next, begin to draw feature on the map.</p>" +
                         "<p>3: Clear the drawing with the Clear graphics button.</p>"
            });

            query("#drawTxtPop").popover({
                html: true,
                content: "<p>1: Enter your text.</p>" +
                         "<p>2: Select color of text.</p>" +
                         "<p>3: Click the add text button then select at location on the map with mouse.</p>"
            });

            //Data Extract
            query("#extractPop").popover({
                html: true,
                content: "<p>1: Select which layers to download.</p>" +
                "<p>2: Next, draw the extent around the area you want to download.</p>" +
                "<p>3: Choose a format to download.</p>" +
                "<p>4: Click the download button to finish extracting your data.</p>"
            });

            //Search
            query("#txtSrchPop").popover({
                html: true,
                content: "<p>1: Start by selecting a search layer.</p>" +
                         "<p>2: Enter your search query.</p>"
            });

            query("#graSrchPop").popover({
                html: true,
                content: "<p>1: Start by selecting a search layer.</p>" +
                         "<p>2: Draw a feature on the map to search your area of interest.</p>"
            });

            query("#spaSrchPop").popover({
                html: true,
                content: "<p>1: Start by using the text/graphical search and getting a result.</p>" +
                         "<p>2: From the result window, select the feature you want to process.</p>" +
                         "<p>3: Choose a buffer distance and apply buffer.</p>" +
                         "<p>4: Select features in another layer and click the intersect/contained by button.</p>"
            });

            //Print
            query("#printPop").popover({
                html: true,
                content: "<p>1: Enter a title for your map.</p>" +
                         "<p>2: Select a layout and format.</p>" +
                         "<p>3: Click the print button.</p>" +
                         "<p>Note: Popup blocker can sometimes block the printed map."
            });

            //Layer List
            query("#layerPop").popover({
                html: true,
                content: "<p>Turn off layers by selecting/unselecting checkbox.</p>" +
                "<p>Layer opacity can be set with the opacity slider.</p>" +
                "<p>Labels can be found under each parent layer. They will automatically be expanded as well.</p>"
            });

            //Lat/Long
            query("#latLongPop").popover({
                html: true,
                content: "<p>1: Select a format.</p>" +
                         "<p>2: Enter the latitude.</p>" +
                         "<p>3: Enter the longitude.</p>" +
                         "<p>4: Click locate to zoom to coordinates."
            });

            //Legend
            query("#legendPop").popover({
                html: true,
                content: "<p>Only layers that are visible will be displayed in legend.</p>"
            });

            //Measurement
            query("#measurePop").popover({
                html: true,
                content: "<p>1: Select measurement tool to enable.</p>" +
                         "<p>2: Select a unit of measure.</p>" +
                         "<p>3: Then begin measuring on the map and to finish just double click/tap.</p>"
            });

            //Scale
            query("#scalePop").popover({
                html: true,
                content: "<p>1: Enter a scale.</p>" +
                         "<p>2: Click enter to go to scale.</p>"
            });

            //Query
            query("#selAttrPop").popover({
                html: true,
                content: "<p>1: Select a layer.</p>" +
                         "<p>2: Select a field to search on.</p>" +
                         "<p>3: Enter your query statement into the where box.</p>"
            });

            query("#selLocPop").popover({
                html: true,
                content: "<p>1: Load a feature by having a result selected.</p>" +
                "<p>2: Once loaded, select a search feature.</p>" +
                "<p>3: Then select a source layer that you want to select features in.</p>"
            });
        }
    };
});

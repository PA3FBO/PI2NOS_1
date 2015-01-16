(function () {

    // #region Fields

    var ww, wh, oiw, oih, centerVertical, iw, ih, iTop, iLeft, xw, xh, jsonStream, canvas, context, map, lastUpdateJson, lastUpdateObject, lastWH;
    var $body, $canvas, $gmaps, $header, $overlay, $btSwitchMap, $btSwitchMapType, $btResetView, $btCircleStyle, $btBarType;
var $btSwitchRepeater;

    var googleMapsEnabled = isIOS() ? false : localStorage["googleMapsEnabled"] != 0;
    var mapType = localStorage["googleMapType"];
var BarType = localStorage["BarType"];
    var circleStyle = localStorage["circleStyle"];
    var rescheduleTimers = null;
    var connectSequence = -1;
var SwitchRepeater = localStorage["SwitchRepeater"];
if ( SwitchRepeater == undefined ) SwitchRepeater = "pi2nos" ;


    var receivers = {

        "Rx_Hilversum": {

            name: "Hilversum",
            mapPosition: { x: 906, y: 1024 },
            range: 150,
            latitude: 52.242490,
            longitude: 5.164339
        },
        "NetRx_HVS": {

            name: "Hilversum",
            mapPosition: { x: 906, y: 1024 },
            range: 150,
            latitude: 52.242490,
            longitude: 5.164339
        },
        "Rx_Utrecht": {

            name: "Ijselstein",
            mapPosition: { x: 860, y: 1226 },
            range: 150,
            latitude: 52.010271,
            longitude: 5.053336
        },
        "Rx1": {

            name: "Ijselstein",
            mapPosition: { x: 860, y: 1226 },
            range: 150,
            latitude: 52.010271,
            longitude: 5.053336
        },
        "Rx_Amsterdam": {

            name: "Amsterdam",
            mapPosition: { x: 748, y: 955 },
            range: 150,
            latitude: 52.360329,
            longitude: 4.790518
        },
        "Rx_Zierikzee": {

            name: "Zierikzee",
            mapPosition: { x: 325, y: 1490 },
            range: 150,
            latitude: 51.647364,
            longitude: 3.931846
        },
        "Rx_Apeldoorn": {

            name: "Apeldoorn",
            mapPosition: { x: 1295, y: 1070 },
            range: 150,
            latitude: 52.225169,
            longitude: 5.905830
        },
        "Rx_DenHaag": {

            name: "Den Haag",
            mapPosition: { x: 527, y: 1166 },
            range: 150,
            latitude: 52.071458,
            longitude: 4.324271
        },
        "NetRx_DHG": {

            name: "Den Haag",
            mapPosition: { x: 527, y: 1166 },
            range: 150,
            latitude: 52.071458,
            longitude: 4.324271
        },
        "Rx_PI4RCG": {

            isInetLink: true,
            name: "Radiokelder",
            mapPosition: { x: 923, y: 1042 },
            range: 25,
            latitude: 52.231182,
            longitude: 5.190791
        },
        "Dailyminutes": {

            isInetLink: true,
            name: "John Piek",
            mapPosition: { x: 1016, y: 1073 },
            range: 25,
            latitude: 52.183156,
            longitude: 5.408128
        },
        "NetRx_ETE": {

            isInetLink: true,
            name: "John Piek",
            mapPosition: { x: 1016, y: 1073 },
            range: 25,
            latitude: 52.183156,
            longitude: 5.408128
        },
        "NetRx_VRZ": {

            isInetLink: true,
            name: "PI4VRZ/A",
            mapPosition: { x: 1229, y: 1080 },
            range: 25,
            latitude: 52.174761,
            longitude: 5.826592
        },
        "Rx_VRZ": {

            isInetLink: true,
            name: "PI4VRZ/A",
            mapPosition: { x: 1229, y: 1080 },
            range: 25,
            latitude: 52.174761,
            longitude: 5.826592
        }
    };

    // #endregion

    // #region Scaling
    function initScaling() {

        try {
            // iOS viewport setting
            if (isIOS()) {
                try {

                    if (window.devicePixelRatio) {

                        $(window).bind('orientationchange', setIOSPixelDensity);
                        setIOSPixelDensity();
                    }
                } catch (e) {
                    alert(e);
                }
            }

            // create reference
            var $html = $('html');
            var $dynamicLayoutDiv = $('#dynamic');
            var maxWindowSmall, maxWindowLarge = 0;

            // enable stylesheet
            $html.addClass("scaled");

            function calcDynamicScale(min, max, size) {
                max--;                          // min 800, max 1023, size 830
                var difference = (max - min);     // 212
                var into = size - min;            // 30
                var ratio = into / difference;    // 0.13452914798206
                var origin = min / max;           // 0.7820136852394
                var target = 1;                 // 1
                return target * (origin + ((target - origin) * ratio))
            }

            // updating css classes
            function onResize(e) {

                // set sizes
                $canvas.attr("width", $canvas.width());
                $canvas.attr("height", $canvas.height());

                // setup scaling parameters for canvas map
                ww = $body.width();
                wh = $body.height();
                oiw = 1920;
                oih = 2202;
                centerVertical = (ww / wh) < (oiw / oih);
                iw = centerVertical ? ww : (oiw / oih) * wh;
                ih = centerVertical ? (oih / oiw) * ww : wh;
                iTop = centerVertical ? (wh - ih) / 2 : 0;
                iLeft = centerVertical ? 0 : (ww - iw) / 2;
                xw = (iw / oiw);
                xh = (ih / oih);

                // update google maps
                if (googleMapsEnabled && map) {

                    google.maps.event.trigger(map, 'resize');
                    centerGoogleMap();
                }

                // get classnames as array
                var classes = $html.attr('class').split(' ');

                // remove all known classes
                for (var i = classes.length - 1; i >= 0; i--) {

                    // reference
                    var className = classes[i];

                    // remove?
                    if ((className == 'portrait') ||
                        (className == 'landscape') ||
                        (className == 'small') ||
                        (className == 'medium') ||
                        (className == 'compact') ||
                        (className == 'large') ||
                        (className.indexOf('size') == 0)) {

                        // remove
                        classes.splice(i, 1);
                    }
                }

                // determine orientation
                var w = $(window).height();
                var h = $(window).width();
                var maxNow = Math.max(w, h);
                if (maxNow > maxWindowLarge) {

                    maxWindowLarge = maxNow;
                    maxWindowSmall = Math.min(w, h);
                }
                var ratioThreshold = (maxWindowLarge / maxWindowSmall);
                var ratio = (h / w);
                var isLandscape = (ratio >= ((isAndroid() && ($(':focus').length > 0)) ? ratioThreshold /* 1.44 */ : 1));

                // get height or width, depending on orientation
                var size = $(window).width();// isLandscape ? $(window).width() : $(window).height();
                var test = calcDynamicScale(0, 1050, size);

                // add oriention class
                classes.push(isLandscape ? "landscape" : "portrait");

                if ($html.hasClass("mobile") && isLandscape) {

                    classes.push("compact");
                    classes.push("medium");
                }
                if ($html.hasClass("mobile") && (!isLandscape)) {

                    classes.push("compact");
                    classes.push("small");
                }
                if ((!$html.hasClass("mobile")) && isLandscape) {

                    classes.push("large");
                }
                if ((!$html.hasClass("mobile")) && (!isLandscape)) {

                    classes.push("compact");
                    classes.push("medium");
                }

                //sizeClass = "size240";

                //if (size > 240) {

                //    sizeClass = "size320";
                //    test = calcDynamicScale(240, 320, size);
                //}
                //if (size > 320) {

                //    sizeClass = "size480";
                //    test = calcDynamicScale(320, 480, size);
                //}
                //if (size > 480) {

                //    sizeClass = "size640";
                //    test = calcDynamicScale(480, 640, size);
                //}
                //if (size > 640) {

                //    sizeClass = "size800";
                //    test = calcDynamicScale(640, 800, size);
                //}
                //if (size > 800) {

                //    sizeClass = "size1024";
                //    test = calcDynamicScale(800, 1024, size);
                //}
                //if (size > 1024) {

                //    sizeClass = "size1200";
                //    test = calcDynamicScale(1024, 1200, size);
                //}
                //if (size > 1200) {

                //    sizeClass = "size1280";
                //    test = calcDynamicScale(1200, 1280, size);
                //}
                //if (size > 1280) {

                //    sizeClass = "size1360";
                //    test = calcDynamicScale(1280, 1360, size);
                //}
                //if (size > 1360) {

                //    sizeClass = "size1440";
                //    test = calcDynamicScale(1360, 1440, size);
                //}
                //if (size > 1440) {

                //    sizeClass = "size1536";
                //    test = calcDynamicScale(1440, 1536, size);
                //}
                //if (size > 1536) {

                //    sizeClass = "size1600";
                //    test = calcDynamicScale(1536, 1600, size);
                //}
                //if (size > 1600) {

                //    sizeClass = "size1680";
                //    test = calcDynamicScale(1600, 1680, size);
                //}
                //if (size > 1680) {

                //    sizeClass = "size1920";
                //    test = calcDynamicScale(1680, 1920, size);
                //}
                //if (size > 1920) {
                //    test = calcDynamicScale(1920, 2400, size);
                //}
                //if (size > 2400) {

                //    sizeClass = "size2560";
                //    test = calcDynamicScale(2400, 2560, size);
                //}

                //// add it
                //classes.push(sizeClass);

                // assign 
                $dynamicLayoutDiv.css('font-size', test + 'em');
                $html.attr('class', classes.join(' '));
            }

            $(window).resize(onResize);
            onResize();
        } catch (e) {
            alert(e);
        }
    };

    function setIOSPixelDensity() {

        // http://www.quirksmode.org/blog/archives/2012/07/more_about_devi.html
        // http://www.quirksmode.org/mobile/tableViewport.html      

        var vp = document.getElementById("vp");
        if (vp) {

            // no reset for non retina ipads
            if (!((window.devicePixelRatio == 1) && isIPad())) {

                // init the meta tag to it's original values, so that we get the right values reported back
                vp.attributes.content.value = "width=device-width, user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1";
            }

            rescheduleTimer("setIOSPixelDensity", 150, function () {

                // get scale factor
                var scale = (1 / window.devicePixelRatio);

                // get width reported by iOS in device independent pixels (dips)
                var ww = document.documentElement.offsetWidth < document.documentElement.offsetHeight ? document.documentElement.offsetWidth : document.documentElement.offsetHeight;

                // calculate the width we need so that after scaling by iOS + the scaling we set below, it will end up in the original device specific pixel width
                var vp_width = "width=" + (ww * scale) + ", ";

                // exception for non retina ipads
                if ((window.devicePixelRatio == 1) && isIPad()) {

                    // in landscape mode?
                    if ((window.orientation + "").indexOf("90") >= 0) {

                        vp_width = "width=1024,height=768,";
                    }
                    else {
                        vp_width = "width=768,height=1024,";
                    }
                    scale = 1;
                }

                // don't allow the user to scale
                var vp_user_scalable = "user-scalable=no, ";

                // set the scaling we need to do, so that we counter act the scaling that iOS does, and we get images that in the end, are not down- or up- scaled at all
                // and look crystal sharp
                var vp_initial_scale = "initial-scale=" + scale + ", ";
                var vp_minimum_scale = "minimum-scale=" + scale + ", ";
                var vp_maximum_scale = "maximum-scale=" + scale;

                // set the meta tag
                vp.attributes.content.value =
                    vp_width +
                    vp_user_scalable +
                    vp_initial_scale +
                    vp_minimum_scale +
                    vp_maximum_scale;

                $window.trigger("resize");
            });
        }
    };

    // #endregion 

    // #region Google Map Classes

    // Initialize the map and the custom overlay.

    /** @constructor */
    function LogoOverlay(bounds, image, map) {

        // Initialize all properties.
        this.bounds_ = bounds;
        this.image_ = image;
        this.map_ = map;

        // Define a property to hold the image's div. We'll
        // actually create this div upon receipt of the onAdd()
        // method so we'll leave it null for now.
        this.div_ = null;

        // Explicitly call setMap on this overlay.
        this.setMap(map);
    }

    // #endregion

    // #region Page setup

    function setCaptions() {
        $btSwitchMap.attr("value", googleMapsEnabled ? "GOOGLE MAPS" : "SIMPLE MAP");
        $btSwitchMapType.attr("value", localStorage["googleMapType"] ? localStorage["googleMapType"].toUpperCase() : "TERRAIN");
        $btCircleStyle.attr("value", localStorage["circleStyle"] ? localStorage["circleStyle"].toUpperCase() : "OUTWARDS");
        $btBarType.attr("value", localStorage["BarType"] ? localStorage["BarType"].toUpperCase() : "BARS");
        $btSwitchRepeater.attr("value", localStorage["SwitchRepeater"] ? localStorage["SwitchRepeater"].toUpperCase() : "PI2NOS");
    }

    function toggleMapType() {

        // toggle
        googleMapsEnabled = !googleMapsEnabled;
        localStorage["googleMapsEnabled"] = googleMapsEnabled ? 1 : 0;

        // setup page
        setupMaps();

        // display last update
        redrawReceivers();

        // update captions
        setCaptions();
    }

    function redrawReceivers() {
        if (googleMapsEnabled) updateGoogleMaps(); else updateCanvasMap();
    }

    function setupMaps() {

        if (googleMapsEnabled) {

            setup4GoogleMaps();
        }
        else {

            setup4CanvasMaps();
        }
    }

    function setup4GoogleMaps() {

        // show/hide
        $canvas.hide();
        $gmaps.show();
        $body.css("background-image", "none");
        $btSwitchMapType.show();
        $btResetView.show();

        // init maptype
        var mapTypeId = getGoogleMapTypeId();

        // init zoom
        var zoom = parseInt(sessionStorage["googleMapsZoomLevel"], 10);
        if (isNaN(zoom)) zoom = 8;

        // init center
        var lat = parseFloat(sessionStorage["googleMapsCenterLatitude"]);
        var lng = parseFloat(sessionStorage["googleMapsCenterLongitude"]);
        if (isNaN(lat) || isNaN(lng)) {

            lat = 52.115650;
            lng = 5.360739;
        }

        // init map options
        var mapOptions = {
            center: { lat: lat, lng: lng },
            zoom: zoom,
            mapTypeId: mapTypeId,
            panControl: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.RIGHT_TOP
            }
        };

        // init map
        map = new google.maps.Map(document.getElementById('map'), mapOptions);

        // setup events
        google.maps.event.addListener(map, 'zoom_changed', onGoogleMapZoomChanged);
        google.maps.event.addListener(map, 'center_changed', onGoogleMapCenterhanged);

        new LogoOverlay(
            new google.maps.LatLngBounds(
                new google.maps.LatLng(52.431251, 3.615959),
                new google.maps.LatLng(52.911693, 4.375059)),
//            repeater + ".png",

            SwitchRepeater + ".png",
            map);
    }

    function toggleCircleStyle() {

        // toggle
        switch (circleStyle) {
            case "inwards":
                circleStyle = "outwards"; break;
            default:
                circleStyle = "inwards"; break;
        }

        // store
        localStorage["circleStyle"] = circleStyle;

        // redraw
        redrawReceivers();

        // update captions
        setCaptions();
    }

//---------------------- bar naar cirkel en terug
    function toggleBarType() {

        // toggle
        switch (BarType) {
            case "bars":
                BarType = "circles"; break;
            default:
                BarType = "bars"; break;
            }

        // store
        localStorage["BarType"] = BarType;

        // redraw
        redrawReceivers();

        // update captions
        setCaptions();

    }

//---------------------- van PI2NOS naar PI3UTR en terug
    function toggleSwitchRepeater() {
        // toggle
        switch (SwitchRepeater) {
            case "pi2nos":
                SwitchRepeater = "pi3utr"; break;
//                document.body.background = SwitchRepeater + "map.jpg"; break;
            default:
                SwitchRepeater = "pi2nos";  break;
//                document.body.background = SwitchRepeater + "map.jpg";
            }

        // store
        localStorage["SwitchRepeater"] = SwitchRepeater;

        // redraw
        redrawReceivers();

        // update captions
        setCaptions();

        // reload page
        window.location.reload()

    }

//----------------------


    function centerGoogleMap() {

        // get page sizes
        var w = $(window).width();
        var h = $(Window).height();
        lastWH = w + "_" + h;

        if (googleMapsEnabled) {

            // init center
            var lat = parseFloat(sessionStorage["googleMapsCenterLatitude"]);
            var lng = parseFloat(sessionStorage["googleMapsCenterLongitude"]);
            if (isNaN(lat) || isNaN(lng)) {

                lat = 52.115650;
                lng = 5.360739;
            }

            // init map options
            map.setOptions({
                center: { lat: lat, lng: lng },
            });
        }
    }
    function toggleGoogleMapType() {

        // toggle
        switch (mapType) {
            case "roadmap":
                mapType = google.maps.MapTypeId.SATELLITE; break;
            case "satellite":
                mapType = google.maps.MapTypeId.HYBRID; break;
            case "hybrid":
                mapType = google.maps.MapTypeId.TERRAIN; break;
            default:
                mapType = google.maps.MapTypeId.ROADMAP; break;
        }

        // store
        localStorage["googleMapType"] = mapType;

        // set map type
        map.setMapTypeId(getGoogleMapTypeId());

        // update captions
        setCaptions();
    }

    function getGoogleMapTypeId() {

        switch (mapType) {

            case "roadmap":
                return google.maps.MapTypeId.ROADMAP;
            case "satellite":
                return google.maps.MapTypeId.SATELLITE;
            case "hybrid":
                return google.maps.MapTypeId.HYBRID;
            case "terrain":
                return google.maps.MapTypeId.TERRAIN;
        }

        return google.maps.MapTypeId.TERRAIN;
    }


    function resetGoogleMapsView() {

        // reset map style
        mapType = "";
        localStorage["googleMapType"] = "";

        // reset zoom
        map.setZoom(8);

        // set center
        map.setCenter(new google.maps.LatLng(52.11650, 5.360739));

        // set map type
        map.setMapTypeId(getGoogleMapTypeId());

        // reset circle style
        circleStyle = "outwards";
        localStorage["circleStyle"] = "outwards";

        // redraw
        redrawReceivers();

        // update captions
        setCaptions()
    }

    function setup4CanvasMaps() {

        // show/hide
        $gmaps.hide();
        $canvas.show();
        $body.removeAttr("style");
        $btSwitchMapType.hide();
        $btResetView.hide();
document.body.background = SwitchRepeater + "map.jpg";
    }

    // #endregion

    // #region Timers

    function cancelTimer(key) {

        // get current timer, or create it and return 0
        var timer = (rescheduleTimers ? rescheduleTimers[key] : ((rescheduleTimers = {})[key] = 0)) | 0;

        // timer set?
        if (timer !== 0) {

            // cancel it
            clearTimeout(timer);

            // clear it
            rescheduleTimers[key] = 0;
        }
    };

    function rescheduleTimer(key, timeWindowMs, callback) {

        // cancel scheduled call
        cancelTimer(key);

        // reschedule
        rescheduleTimers[key + "_cb"] = callback;
        rescheduleTimers[key] = setTimeout(

            function () {

                // not cancelled already?
                if (rescheduleTimers[key] != 0) {

                    // clear timer value
                    rescheduleTimers[key] = 0;

                    var cb = rescheduleTimers[key + "_cb"];

                    rescheduleTimers[key + "_cb"] = undefined;

                    cb();
                }
            },

            timeWindowMs
         );
    };

    // #endregion

    // #region Platform detection

    function isPhoneGap() {

        if ((window.cordova) || (window.PhoneGap) || (window.phoneGap)) {

            isPhoneGap = function () { return true; };

            return true;
        }

        isPhoneGap = function () { return false; };

        return false;
    };

    function isAndroid() {

        if (((window.navigator) && (window.navigator.userAgent) && (/Android/i.test(window.navigator.userAgent)))) {

            return true;
        }

        return false;
    }

    function isOldPhoneGap() {

        if (isPhoneGap()) {

            var result = false;
            try {

                var v = device.cordova;
                if (!v) v = device.phonegap;

                if ((v + "").substr(0, 1) == "2") {

                    result = true;
                }

                isOldPhoneGap = function () { return result; };
            }
            catch (e) {
                result = false;
            }
            return result;
        }

        isOldPhoneGap = function () { return false; };

        return false;
    };

    function isSurface() {

        if (((window.navigator) && (window.navigator.userAgent) && (/Tablet PC/i.test(window.navigator.userAgent)))) {

            isSurface = function () { return true; };

            return true;
        }

        isSurface = function () { return false; };

        return false;
    };

    function isMobile() {

        if ((isPhoneGap()) || ((window.navigator) && (window.navigator.userAgent) && (/Android|IEMobile|webOS|iPhone|iPod|BlackBerry/i.test(window.navigator.userAgent)))) {

            isMobile = function () { return true; };

            return true;
        }

        isMobile = function () { return false; };

        return false;
    };

    function isIPad() {

        if (((window.navigator) && (window.navigator.userAgent) && (/iPad/i.test(window.navigator.userAgent)))) {

            isIPad = function () { return true; };

            return true;
        }

        isIPad = function () { return false; };

        return false;
    };

    function isIOS() {

        if (((window.navigator) && (window.navigator.userAgent) && (/iPhone|iPad|iPod/i.test(window.navigator.userAgent)))) {

            isIOS = function () { return true; };

            return true;
        }

        isIOS = function () { return false; };

        return false;
    };

    function IEVersion() {

        var rv = -1;
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
                rv = parseFloat(RegExp.$1);
        }
        else if (navigator.appName == 'Netscape') {
            var ua = navigator.userAgent;
            var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
                rv = parseFloat(RegExp.$1);
        }
        return rv;

        function IEVersion() { return rv; };
        return rv;
    };

    function isIE() {

        if (IEVersion() > 0) {

            isIE = function () { return true; };
            return true;
        }

        isIE = function () { return false; };
        return false;
    };

    function canUseWebsockets() {

        var result = false;

        try {
            if (!("WebSocket" in window)) { result = false; return result; }

            // get useragent
            var userAgent = "";
            if ((window.navigator) && (window.navigator.userAgent)) {

                userAgent = window.navigator.userAgent.toLowerCase();
            }

            if (isSurface()) {

                result = true; return result;
            }

            if (userAgent.indexOf("seamonkey") >= 0) { result = false; return result; }

            // chrome = OK
            if (userAgent.indexOf("chrome") >= 0) { result = true; return result; }

            // we are using a plug-in that enables this
            if (isAndroid()) {

                result = (userAgent.indexOf("kitkat") >= 0) || (!isOldPhoneGap());
                return result;
            }

            if (isIOS()) {

                // let's use websockets on ios >= 6 on phonegap
                if (((userAgent.indexOf("os 3_") < 0) && (userAgent.indexOf("os 4_") < 0) && (userAgent.indexOf("os 5_") < 0)) && (userAgent.indexOf("os 6_0") < 0) &&
                     isPhoneGap()) {

                    result = true;
                    return true;
                }
                else {
                    result = false; return result;
                }
            }

            if (isIE()) {

                result = IEVersion() >= 10;
                return result;
            }

            result = true;
            return result;
        }
        finally {

            if (result) {
                canUseWebsockets = function () { return true; };
            }
            else {
                canUseWebsockets = function () { return false; };
            }
        }
    };

    // #endregion

    // #region Connection

    function connect() {

        if (jsonStream != null) {
            try {
                jsonStream.abort();
                jsonStream = null;
            }
            catch (e) {

            }
        }
        var currentSequence = ++connectSequence;

        jsonStream = canUseWebsockets() ? new WebSocket('ws://pc7x.net:1535/ws/', SwitchRepeater.toLowerCase()) : new EventSource('http://pc7x.net:1535/json/' + SwitchRepeater.toLowerCase() + '/');

        jsonStream.onclose = function () {

            if (currentSequence != connectSequence) return;
            rescheduleTimer("connect", 100, connect);
        };

        jsonStream.onerror = function () {

            if (currentSequence != connectSequence) return;
            rescheduleTimer("connect", 100, connect);
        };

        jsonStream.onmessage = function (e) {

            if (currentSequence != connectSequence) return;

            setTimeout(function () {

                // remember
                lastUpdateJson = e.data;

                // parse Json
                lastUpdateObject = JSON.parse(e.data);

                // init object
                lastUpdateObject.receivers = [];

                // init state
                lastUpdateObject.isActive = lastUpdateJson.indexOf('"active"') > 0;

                // enumerate receivers
                for (index = 0; index < lastUpdateObject.rxlist.length; ++index) {

                    // get next receiver name
                    var rxName = lastUpdateObject.rxlist[index];

                    // reference state object
                    var rxState = lastUpdateObject.rx[rxName];

                    // lookup receiver info
                    var rxInfo = receivers[rxName];

                    // found?
                    if (rxInfo) {

                        // get squelsch setting
                        rxInfo.sql = rxState.sql;

                        // get normalized level
                        var normalizedLevel = Math.min(100, Math.max(0, parseFloat(rxState.lvl)));
                        rxInfo.lvl = circleStyle == "inwards" ? 100 - normalizedLevel : normalizedLevel;

                        if (rxInfo.sql != 'active') {

                            // add to top of the list
                            lastUpdateObject.receivers.splice(0, 0, rxInfo);
                        }
                        else {

                            // add to end of the list
                            lastUpdateObject.receivers.push(rxInfo);
                        }
                    }
                }

                try {
                    if (googleMapsEnabled) {

                        updateGoogleMaps();
                    }
                    else {
                        updateCanvasMap();
                    }
                }
                catch (e) { }

                if (canUseWebsockets()) {

                    jsonStream.send("!");
                }
            }, 1);
        };
    }

    // #endregion

    // #region Canvas map

    function updateCanvasMap() {

        // clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // quit if empty message
        if (!lastUpdateObject || lastUpdateObject.empty) return;

        // enumerate receivers
        for (index = 0; index < lastUpdateObject.receivers.length; ++index) {

            // get next receiver name
            var rx = lastUpdateObject.receivers[index];

            // determine colors
            var color = lastUpdateObject.isActive ? '#808080' : '#FFFFFF';
            var backgroundColor = rx.isInetLink ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.2)';
            if (lastUpdateObject.isActive) {
                if (rx.sql == 'open') { color = 'yellow'; backgroundColor = "rgba(255,255,0,0.3)"; };
                if (rx.sql == 'active') { color = 'red'; backgroundColor = "rgba(255,0,0,0.3)"; };
            }
            // should we show this receiver?
            if ((!rx.isInetLink || (rx.sql == 'active')) && ((!lastUpdateObject.isActive) || ((circleStyle != "inwards") || (rx.sql != "closed")))) {

                // start drawing path
                context.beginPath();

                // draw inner circle
                var radiusOuter = (rx.isInetLink ? rx.range : (rx.range * (rx.lvl / 100))) * xh * 2.5;
                var radiusInner = lastUpdateObject.isActive ? (Math.max(Math.min(radiusOuter, 15 * xh), (150 * (3 / 100)) * xh * 2.5)) : (150 * (3 / 100)) * xh * 2.5;

//------------ switch bar-circle Inner
if (BarType == 'bars') {
                context.rect(iLeft + (rx.mapPosition.x * xw) - (0.5 * radiusInner), iTop + (rx.mapPosition.y * xh) + (0.5 * radiusInner),radiusInner,-1*radiusInner);
                } else {
                context.arc(iLeft + (rx.mapPosition.x * xw), iTop + (rx.mapPosition.y * xh), radiusInner, 0, 2 * Math.PI, false);
                }
//------------


                // draw background
                context.fillStyle = color;
                context.fill();

                // draw border
                context.lineWidth = 2;
                context.strokeStyle = lastUpdateObject.isActive ? color : '#000000';
                context.stroke();

                // finish drawing of path
                context.closePath()

                if (lastUpdateObject.isActive) {

                    // start drawing path
                    context.beginPath();

                    // draw outer circle

//------------ switch bar-circle Outer
if (BarType == 'bars') {
                    context.rect(iLeft + (rx.mapPosition.x * xw) - (0.5 * radiusInner), iTop + (rx.mapPosition.y * xh) + (0.5 * radiusInner),radiusInner,-1*radiusOuter);
                    } else {
                    context.arc(iLeft + (rx.mapPosition.x * xw), iTop + (rx.mapPosition.y * xh), radiusOuter, 0, 2 * Math.PI, false);
                    }
//------------

                    // draw background
                    context.fillStyle = backgroundColor;
                    context.fill();

                    // draw border
                    context.lineWidth = 2;
                    context.strokeStyle = color;
                    context.stroke();

                    // finish drawing of path
                    context.closePath()
                }

            }
        }
    }

    // #endregion

    //#region Google Maps

    function updateGoogleMaps() {

        // quit if empty message
        if (!lastUpdateObject || lastUpdateObject.empty) {

            // remove circles
            for (var i = 0; i < receivers.length; i++) {
                var rx = receivers[i];
                if (rx.gmCircle) rx.gmCircle.setMap(null);
                if (rx.gmCircleInner) rx.gmCircleInner.setMap(null);
                if (rx.gmRectangle) rx.gmRectangle.setMap(null);
                if (rx.gmRectangleInner) rx.gmRectangleInner.setMap(null);
            }

            return;
        }

        // init flags
        var isTerrainMapType = getGoogleMapTypeId() == google.maps.MapTypeId.TERRAIN;

        // enumerate receivers
        for (index = 0; index < lastUpdateObject.receivers.length; ++index) {

            // get next receiver name
            var rx = lastUpdateObject.receivers[index];

            // determine colors            
            var color = lastUpdateObject.isActive ? '#808080' : '#FFFFFF';
            var colorOpacity = 1;
            var backgroundColor = rx.isInetLink ? '#FF0000' : '#FFFFFF';
            var backgroundColorOpacity = isTerrainMapType ? 0.4 : 0.2;

            if (lastUpdateObject.isActive) {
                if (rx.sql == 'open') {
                    color = '#FFFF00';
                    colorOpacity = 1;
                    backgroundColor = isTerrainMapType ? '#CCCC00' : '#FFFF00';
                    backgroundColorOpacity = 0.3;
                }
                if (rx.sql == 'active') {
                    color = '#FF0000';
                    colorOpacity = 1;
                    backgroundColor = '#FF0000';
                    backgroundColorOpacity = 0.3;;
                };
            }

            // determine sizes
            var radiusOuter = 350 * (rx.isInetLink ? rx.range : rx.range * (rx.lvl / 100));
            var maxInnerRadius1 = Math.max(30, 2000 - (250 * (Math.max(8, Math.min(16, map.getZoom())) - 8)));
            var maxInnerRadius2 = Math.max(30, 500 - (62.5 * (Math.max(8, Math.min(16, map.getZoom())) - 8)));
            var radiusInner = lastUpdateObject.isActive ? Math.max(Math.min(radiusOuter, 2000), maxInnerRadius2) : maxInnerRadius1;
var showrectangle = 1;

            // should we hide this receiver?
            if ((rx.isInetLink && (rx.sql != 'active')) ||
                ((lastUpdateObject.isActive) && ((circleStyle == "inwards") && (rx.sql == "closed")))) {

                radiusInner = 0;
                radiusOuter = 0;
                showrectangle = 0;
            }


// show bars or circles
if (BarType == 'bars') {
                // remove circles
                if (rx.gmCircle) rx.gmCircle.setMap(null);
                if (rx.gmCircleInner) rx.gmCircleInner.setMap(null);

                // inner rectangle
                if (!rx.gmRectangleInner) {
                    rx.gmRectangleInner = new google.maps.Rectangle({
                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: lastUpdateObject.isActive ? colorOpacity : 1,
                        fillColor: color,
                        fillOpacity: colorOpacity,
                        strokeWeight: 2,
                        map: map,
                        bounds: new google.maps.LatLngBounds(
                                new google.maps.LatLng((rx.latitude - 0.015) * showrectangle, (rx.longitude - 0.025) * showrectangle),
                                new google.maps.LatLng((rx.latitude + 0.015) * showrectangle,  (rx.longitude + 0.025) * showrectangle))


                    });
                }
                else {
                    rx.gmRectangleInner.setOptions({

                        map: map,
                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: lastUpdateObject.isActive ? colorOpacity : 1,
                        fillColor: color,
                        fillOpacity: colorOpacity,
                        strokeWeight: 2,
                        bounds: new google.maps.LatLngBounds(
                                new google.maps.LatLng((rx.latitude - 0.015) * showrectangle, (rx.longitude - 0.025) * showrectangle),
                                new google.maps.LatLng((rx.latitude + 0.015) * showrectangle, (rx.longitude + 0.025) * showrectangle))

                    });
                }
                // end inner rectangle

                // outer rectangle
                if (!rx.gmRectangle) {
                    rx.gmRectangle = new google.maps.Rectangle({
                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: lastUpdateObject.isActive ? colorOpacity : 1,
                        fillColor: color,
                        fillOpacity: colorOpacity,
                        strokeWeight: 2,
                        map: map,
                        bounds: new google.maps.LatLngBounds(
                                new google.maps.LatLng((rx.latitude - 0.015) * showrectangle, (rx.longitude - 0.025) * showrectangle),
                                new google.maps.LatLng(((rx.latitude - 0.015) + ((lastUpdateObject.isActive ? radiusOuter : 0)/80000) * showrectangle), (rx.longitude + 0.025) * showrectangle))

                    });
                }
                else {
                    rx.gmRectangle.setOptions({

                        map: map,
                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: colorOpacity,
                        fillColor: backgroundColor,
                        fillOpacity: backgroundColorOpacity,
                        strokeWeight: 2,
                        bounds: new google.maps.LatLngBounds(
                                new google.maps.LatLng((rx.latitude - 0.015) * showrectangle, (rx.longitude - 0.025) * showrectangle),
                                new google.maps.LatLng((((rx.latitude - 0.015)  * showrectangle) + ((lastUpdateObject.isActive ? radiusOuter : 0)/80000) * showrectangle), (rx.longitude + 0.025) * showrectangle))

                    });
                }
                // end outer rectangle
            } else {
                // remove rectangles
                if (rx.gmRectangle) rx.gmRectangle.setMap(null);
                if (rx.gmRectangleInner) rx.gmRectangleInner.setMap(null);

                // inner circle
                if (!rx.gmCircleInner) {
                    rx.gmCircleInner = new google.maps.Circle({

                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: lastUpdateObject.isActive ? colorOpacity : 1,
                        fillColor: color,
                        fillOpacity: colorOpacity,
                        strokeWeight: 2,
                        map: map,
                        center: new google.maps.LatLng(rx.latitude, rx.longitude),
                        radius: radiusInner,
                        zIndex: index * 2
                    });

                    (function (rx) {
                        //circle is the google.maps.Circle-instance
                        google.maps.event.addListener(rx.gmCircleInner, 'mouseover', function () {

                            onCircleMouseOver(rx);

                        });

                        google.maps.event.addListener(rx.gmCircleInner, 'mouseout', function () {
    
                            onCircleMouseOut(rx);
                        });
                    })(rx);
                }
                else {
                    rx.gmCircleInner.setOptions({

                        map: map,
                        strokeColor: lastUpdateObject.isActive ? color : '#000000',
                        strokeOpacity: lastUpdateObject.isActive ? colorOpacity : 1,
                        fillColor: color,
                        fillOpacity: colorOpacity,
                        strokeWeight: 2,
                        radius: radiusInner,
                        zIndex: index * 2
                    });
                }
        
                // outer circle
                if (!rx.gmCircle) {
                    rx.gmCircle = new google.maps.Circle({

                        strokeColor: color,
                        strokeOpacity: colorOpacity,
                        fillColor: backgroundColor,
                        fillOpacity: backgroundColorOpacity,
                        strokeWeight: 2,
                        map: map,
                        center: new google.maps.LatLng(rx.latitude, rx.longitude),
                        radius: lastUpdateObject.isActive ? radiusOuter : 0,
                        zIndex: (index * 2) + 1
                    });

                    (function (rx) {
                        //circle is the google.maps.Circle-instance
                        google.maps.event.addListener(rx.gmCircle, 'mouseover', function () {

                            onCircleMouseOver(rx);
    
                        });

                    google.maps.event.addListener(rx.gmCircle, 'mouseout', function () {

                        onCircleMouseOut(rx);
                        });
                    })(rx);
                }
                else {
                    rx.gmCircle.setOptions({

                        map: map,
                        strokeColor: color,
                        strokeOpacity: colorOpacity,
                        fillColor: backgroundColor,
                        fillOpacity: backgroundColorOpacity,
                        strokeWeight: 2,
                        radius: lastUpdateObject.isActive ? radiusOuter : 0,
                        zIndex: (index * 2) + 1
                    });
                }
            }
// end bar/circle

        }
    }

    function onCircleMouseOver(rx) {

        $gmaps.attr("title", rx.name);
    }

    function onCircleMouseOut(rx) {

        $gmaps.removeAttr("title");
    }

    function onGoogleMapZoomChanged(e) {

        sessionStorage["googleMapsZoomLevel"] = map.getZoom();
        updateGoogleMaps();
    }

    function onGoogleMapCenterhanged(e) {

        // get page sizes
        var w = $(window).width();
        var h = $(Window).height();
        var wh = w + "_" + h;

        if ((lastWH == wh)) {

            var center = map.getCenter();
            sessionStorage["googleMapsCenterLatitude"] = center.lat();
            sessionStorage["googleMapsCenterLongitude"] = center.lng();
        }
    }

    //#endregion

    // #region Application cache

    function initAppCache() {

        if (window.applicationCache) {
            window.applicationCache.addEventListener("updateready", function () {

                window.applicationCache.swapCache();

                setTimeout(function () {
                    document.location.reload();
                }, 1500);
            });

            if (window.applicationCache.update) {
                setInterval(function () { applicationCache.update(); }, 120000);
            }
        }
    }

    // #endregion

    // #region Initialization

    $(document).ready(function () {

        // #region Google Map Classes
        try {
            LogoOverlay.prototype = new google.maps.OverlayView();

            /**
             * onAdd is called when the map's panes are ready and the overlay has been
             * added to the map.
             */
            LogoOverlay.prototype.onAdd = function () {

                var div = document.createElement('div');
                div.style.borderStyle = 'none';
                div.style.borderWidth = '0px';
                div.style.position = 'absolute';

                // Create the img element and attach it to the div.
                var img = document.createElement('img');
                img.src = this.image_;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.position = 'absolute';
                div.appendChild(img);

                this.div_ = div;

                // Add the element to the "overlayLayer" pane.
                var panes = this.getPanes();
                panes.overlayLayer.appendChild(div);
            };

            LogoOverlay.prototype.draw = function () {

                // We use the south-west and north-east
                // coordinates of the overlay to peg it to the correct position and size.
                // To do this, we need to retrieve the projection from the overlay.
                var overlayProjection = this.getProjection();

                // Retrieve the south-west and north-east coordinates of this overlay
                // in LatLngs and convert them to pixel coordinates.
                // We'll use these coordinates to resize the div.
                var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
                var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

                // Resize the image's div to fit the indicated dimensions.
                var div = this.div_;
                div.style.left = sw.x + 'px';
                div.style.top = ne.y + 'px';
                div.style.width = (ne.x - sw.x) + 'px';
                div.style.height = (sw.y - ne.y) + 'px';
            };

            // The onRemove() method will be called automatically from the API if
            // we ever set the overlay's map property to 'null'.
            LogoOverlay.prototype.onRemove = function () {
                this.div_.parentNode.removeChild(this.div_);
                this.div_ = null;
            };
        } catch (e) { }
        // #endregion

        // dom references
        $body = $('body');
        $gmaps = $('#gmaps');
        $header = $('#header');
        $overlay = $('#overlay');
        $canvas = $('canvas');
        $btSwitchMap = $("#btSwitchMap");
        $btSwitchMapType = $("#btSwitchMapType")
        $btResetView = $("#btResetView");
        $btCircleStyle = $("#btCircleStyle");
        $btBarType = $("#btBarType");
        $btSwitchRepeater = $("#btSwitchRepeater");

        // assign event handlers
        $btSwitchMap.on("click", toggleMapType);
        $btSwitchMapType.on("click", toggleGoogleMapType);
        $btResetView.on("click", resetGoogleMapsView);
        $btCircleStyle.on("click", toggleCircleStyle);
        $btBarType.on("click", toggleBarType);
        $btSwitchRepeater.on("click", toggleSwitchRepeater);

        // tja..
        if (isIOS()) {
            $overlay.hide();
        }

        // reference canvas
        canvas = $canvas[0];
        context = canvas.getContext('2d');

        // setup page
        initScaling();
        setupMaps();

        // schedule connection
        rescheduleTimer("connect", 100, connect);

        // initialize captions
        setCaptions();

        // application cache for non IE
        if (!isIE()) initAppCache();
    });

    // application cache for IE
    if (isIE()) initAppCache();

    // #endregion

})();
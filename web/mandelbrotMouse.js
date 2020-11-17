
var tpCache = new Array()
var request_in_progress = false;

//-------------------------------------------------------------------------------------

function zoom(amount) {

    if (request_in_progress) {
        return;
    }

    if (amount <= 0) {
        return;
    }
    scale *= amount;
    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
}

function zoom_handler(event) {

    var delta = 0;

    if (!event) event = window.event;
    // normalize the delta
    if (event.wheelDelta) {
        // IE and Opera
        delta = event.wheelDelta / 60;
    } else if (event.detail) {
        // W3C
        delta = -event.detail / 2;
    }

    if (delta > 0) {
        amount = delta;
    } else {
        amount = -1/delta;
    }

    zoom(amount);
    NewMandelbrot();
}

function right_click_handler(event) {

    event.preventDefault();
    if (request_in_progress) {
        return;
    }

    offset_x = 0;
    offset_y = 0;
    scale = 1;

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));

    NewMandelbrot();
}

function setLocation(x, y) {
    if (request_in_progress) {
        return;
    }

    var complex = ViewToComplex(x, y);
    offset_x = complex[0];
    offset_y = complex[1];
}

function click_handler(event) {
    setLocation(event.offsetX, event.offsetY);
    NewMandelbrot();
}

function newPalette() {
    if (request_in_progress) {
        return;
    }
    small_palette = CreatePalette(small_palette_size);
    palette_counter = 0;
    CopySmallPaletteIntoLargeOne();
}

location_counter = 0;
locations = [
    { x: 0,         y: 0,           s: 1                },
    { x: -1.749195, y: 0.00000001,  s: 132382.72        },
    { x: 0.434571,  y: -0.357455,   s: 4136.96          },
    { x: -0.128550, y: -0.985627,   s: 2118123.52       },
    { x: -1.251657, y: 0.389325,    s: 2190648069.3248  },
];

function newLocation() {
    if (request_in_progress) {
        return;
    }
    location_counter++;
    location_counter = location_counter % locations.length;
    offset_x = locations[location_counter].x;
    offset_y = locations[location_counter].y;
    scale = locations[location_counter].s;

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
    NewMandelbrot();
}

//-------------------------------------------------------------------------------------

function doKeyDown(e) {
    if (e.keyCode == 87) {
        newPalette();
    }
}

$(document).ready(function () {
    var canvas = document.getElementById('MandelbrotCanvas');

    var mc = new Hammer(canvas);
    mc.on("tap", function (ev) {
        setLocation(ev.center.x, ev.center.y);
        NewMandelbrot();
    });
    mc.on("press", function (ev) {
        setLocation(ev.center.x, ev.center.y);
        zoom(2);
        NewMandelbrot();
    });
    mc.on("panleft", function (ev) {
        newPalette();
    });
    mc.on("panright", function (ev) {
        newLocation();
    });
    //mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
    //mc.add(new Hammer.Tap({ event: 'singletap' }));
    //mc.get('doubletap').recognizeWith('singletap');
    //mc.get('singletap').requireFailure('doubletap');
    //mc.get('singletap').set({ enable: true });

    //mc.on("singletap", function (ev) {
    //    alert("fs");
        //setLocation(ev.center.x, ev.center.y);
    //});
    //mc.on("doubletap", function (ev) {
    //    alert("ghj");
        //setLocation(ev.center.x, ev.center.y);
        //zoom(2);
    //});

    //if (window.addEventListener) {
    //    document.addEventListener('DOMMouseScroll', zoom_handler, false);
    //    document.addEventListener("keydown", doKeyDown, true);
    //}
    //document.onmousewheel = zoom_handler;

    SetUp();
});

$(window).resize(function () {
    StopColourLoop();
    setTimeout(
        () => {
            SetUpWithoutChangingThePalette();
        },
        500
    );
});

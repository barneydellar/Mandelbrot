
var tpCache = new Array()
var request_in_progress = false;

//-------------------------------------------------------------------------------------

function zoom_handler(event) {

    if (request_in_progress) {
        return;
    }

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
        scale *= delta;
    } else {
        scale /= -delta;
    }

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));

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

function click_handler(event) {

    if (request_in_progress) {
        return;
    }

    var complex = ViewToComplex(event.offsetX, event.offsetY);
    offset_x = complex[0];
    offset_y = complex[1];

    NewMandelbrot();
}

//-------------------------------------------------------------------------------------

function doKeyDown(e) {
    if (e.keyCode == 87) {
        small_palette = CreatePalette(small_palette_size);
        palette_counter = 0;
        CopySmallPaletteIntoLargeOne();
        return;
    }

    if (e.keyCode == 49) {
        offset_x = -1.749195;
        offset_y = 0.00000001;
        scale = 132382.72;
    }
    if (e.keyCode == 50) {
        offset_x = 0.434571;
        offset_y = -0.357455;
        scale = 4136.96;
    }
    else if (e.keyCode == 51) {
        offset_x = -0.128550;
        offset_y = -0.985627;
        scale = 2118123.52;
    }
    else if (e.keyCode == 52) {
        offset_x = -1.251657;
        offset_y = 0.389325;
        scale = 2190648069.324800;
    }

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
    NewMandelbrot();

}

function touch_start_handler(ev) {
    // If the user makes simultaneous touches, the browser will fire a 
    // separate touchstart event for each touch point. Thus if there are 
    // three simultaneous touches, the first touchstart event will have 
    // targetTouches length of one, the second event will have a length 
    // of two, and so on.
    ev.preventDefault();
    // Cache the touch points for later processing of 2-touch pinch/zoom
    if (ev.targetTouches.length == 2) {
        for (var i = 0; i < ev.targetTouches.length; i++) {
            tpCache.push(ev.targetTouches[i]);
        }
    }
}
function touch_end_handler(ev) {
    // Note: if the user makes more than one "simultaneous" touches, most browsers 
    // fire at least one touchmove event and some will fire several touchmoves.
    // Consequently, an application might want to "ignore" some touchmoves.
    //
    // This function sets the target element's border to "dashed" to visually
    // indicate the target received a move event.
    //
    ev.preventDefault();
    // To avoid too much color flashing many touchmove events are started,
    // don't update the background if two touch points are active
    if (!(ev.touches.length == 2 && ev.targetTouches.length == 2)) {

        if (ev.targetTouches.length == 2 && ev.changedTouches.length == 2) {
            // Check if the two target touches are the same ones that started
            // the 2-touch
            var point1 = -1, point2 = -1;
            for (var i = 0; i < tpCache.length; i++) {
                if (tpCache[i].identifier == ev.targetTouches[0].identifier) point1 = i;
                if (tpCache[i].identifier == ev.targetTouches[1].identifier) point2 = i;
            }
            if (point1 >= 0 && point2 >= 0) {
                // Calculate the difference between the start and move coordinates
                var initial_gap = Math.abs(tpCache[point2].clientY - tpCache[point1].clientY);
                var current_gap = Math.abs(ev.targetTouches[0].clientY - ev.targetTouches[1].clientY);
                var diff = current_gap - initial_gap;


                // This threshold is device dependent as well as application specific
                var PINCH_THRESHHOLD = ev.target.clientWidth / 10;
                if (Math.abs(diff) >= PINCH_THRESHHOLD) {
                    scale *= -diff;
                    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
                    NewMandelbrot();
                }
            }
            else {
                // empty tpCache
                tpCache = new Array();
            }
        }
    }
}

$(document).ready(function () {

    var canvas = $("#MandelbrotCanvas")[0];
    canvas.addEventListener('click', click_handler, false);
    canvas.addEventListener('contextmenu', right_click_handler, true);
    canvas.addEventListener('touchstart', touch_start_handler, true);
    canvas.addEventListener('touchcancel', touch_end_handler, true);
    canvas.addEventListener('touchend', touch_end_handler, true);

    if (window.addEventListener) {
        document.addEventListener('DOMMouseScroll', zoom_handler, false);
        document.addEventListener("keydown", doKeyDown, true);
    }
    document.onmousewheel = zoom_handler;

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
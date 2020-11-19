
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

    scale = Math.min(scale, 600000000000)
    scale = Math.max(scale, 0.2)

    SetOneOverMinHalf();
    NewMandelbrot();
}

function setLocation(x, y) {
    if (request_in_progress) {
        return;
    }

    var complex = ViewToComplex(x, y);
    offset_x = complex[0];
    offset_y = complex[1];
    NewMandelbrot();
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
}

function newPalette() {
    if (request_in_progress) {
        return;
    }
    small_palette = CreatePalette(small_palette_size);
    palette_counter = 0;
    CopySmallPaletteIntoLargeOne();
}

function validAngle(angle) {

    tolerance = 10;

    function nearlyRight(angle) {
        return Math.abs(angle) < tolerance;
    }
    function nearlyLeft(angle) {
        return Math.abs(180 - Math.abs(angle)) < tolerance;
    }
    function nearlyVertical(angle) {
        return Math.abs(90 - Math.abs(angle)) < tolerance;
    }

    return nearlyRight(angle) ||
           nearlyLeft(angle) ||
           nearlyVertical(angle);
}

$(document).ready(function () {
    var canvas = document.getElementById('MandelbrotCanvas');

    var mc = new Hammer(canvas);
    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

    mc.on("tap", function (ev) {
        setLocation(ev.center.x, ev.center.y);
    });
    mc.on("swipe", function (ev) {
        if (!validAngle(ev.angle)) {
            return;
        }
        if (ev.direction == Hammer.DIRECTION_RIGHT || ev.direction == Hammer.DIRECTION_LEFT) {
            newPalette();
        } else if (ev.direction == Hammer.DIRECTION_UP) {
            zoom(1 + Math.abs(ev.velocity));
        } else if (ev.direction == Hammer.DIRECTION_DOWN) {
            zoom(1 / (1 + Math.abs(ev.velocity)));
        }
    });

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

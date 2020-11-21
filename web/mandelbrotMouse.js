
var tpCache = new Array()
var request_in_progress = false;

//-------------------------------------------------------------------------------------

function updateUrl() {
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set("x", offset_x);
    queryParams.set("y", offset_y);
    queryParams.set("s", scale);
    history.replaceState(null, null, "?" + queryParams.toString());
}

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

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
    NewMandelbrot();
    updateUrl();
}

function setLocation(x, y) {
    if (request_in_progress) {
        return;
    }

    var complex = ViewToComplex(x, y);
    offset_x = complex[0];
    offset_y = complex[1];
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

$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    xParam = urlParams.get('x');
    if (xParam) {
        offset_x = parseFloat(xParam);
    }
    yParam = urlParams.get('y');
    if (yParam) {
        offset_y = parseFloat(yParam);
    }
    sParam = urlParams.get('s');
    if (sParam) {
        scale = parseFloat(sParam);
    }

    var canvas = document.getElementById('MandelbrotCanvas');
    canvas.style.background = "black";
    context = canvas.getContext("2d");

    var mc = new Hammer(canvas);
    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    mc.get('pinch').set({ enable: true });

    mc.on("tap", function (ev) {
        setLocation(ev.center.x, ev.center.y);

        NewMandelbrot();
        updateUrl();
    });

    var imageObject;
    mc.on("pinchstart", function (ev) {
        StopColourLoop();
        imageObject = new Image();
        imageObject.onload = function () {
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(imageObject, 0, 0);
        }
        imageObject.src = canvas.toDataURL();
    });
    mc.on("pinchin pinchout", function (ev) {
        new_scale = ev.scale;
        delta_x = ev.deltaX;
        delta_y = ev.deltaY;

        context.save();
        
        translation_factor = (new_scale - 1) / (2 * new_scale);
        context.scale(new_scale, new_scale);
        context.translate(delta_x - canvas.width * translation_factor, delta_y - canvas.height * translation_factor);

        context.rect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "black";
        context.fill();

        context.drawImage(imageObject, 0, 0);
        
        context.restore();
    });
    mc.on("pinchend", function (ev) {
        setLocation(canvas.width * 0.5 - ev.deltaX, canvas.height * 0.5 - ev.deltaY);
        zoom(ev.scale);
    });

    mc.on("swipe", function (ev) {
        newPalette();
    });

    document.onmousewheel = zoom_handler;

    SetUp();
    updateUrl();
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

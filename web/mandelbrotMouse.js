
var tpCache = new Array()
var request_in_progress = false;
var width;
var height;
var canvas;

//-------------------------------------------------------------------------------------

function updateUrl() {
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set("x", offset_x);
    queryParams.set("y", offset_y);
    queryParams.set("s", scale);
    history.replaceState(null, null, "?" + queryParams.toString());
}

function limitZoom(s) {

    s = Math.min(s, 600000000000)
    s = Math.max(s, 0.2)
    return s;
}

function zoom(amount) {

    if (request_in_progress) {
        return;
    }

    if (amount <= 0) {
        return;
    }
    scale *= amount;

    scale = limitZoom(scale);

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

    if (event.wheelDelta) {
        delta = event.wheelDelta / 60;
    } else if (event.detail) {
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

    canvas = document.getElementById('MandelbrotCanvas');
    canvas.style.background = "black";
    context = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;

    imageObject = new Image();
    imageObject.onload = function () {
        context.clearRect(0, 0, width, height);
        context.drawImage(imageObject, 0, 0);
    }

    var mc = new Hammer(canvas);

    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    mc.get('pinch').set({ enable: true });
    mc.get('doubletap').set({ enable: true });


    mc.on("pinchstart panstart", function (ev) {
        if (request_in_progress) {
            return;
        }
        StopColourLoop(); 
        width = canvas.width;
        height = canvas.height;

        imageObject.src = canvas.toDataURL();
    });
    
    var new_scale;
    var delta_x;
    var delta_y;
    var translation_factor;
    mc.on("pinchmove panmove", function (ev) {
        if (request_in_progress) {
            return;
        }
        new_scale = limitZoom(ev.scale);

        delta_x = ev.deltaX;
        delta_y = ev.deltaY;

        context.save();

        context.rect(0, 0, width, height);
        context.fillStyle = "black";
        context.fill();

        translation_factor = (new_scale - 1) / (2 * new_scale);
        context.scale(new_scale, new_scale);
        context.translate(delta_x - width * translation_factor, delta_y - height * translation_factor);
        context.clearRect(0, 0, width, height);
        
        context.drawImage(imageObject, 0, 0);
        context.restore();
    });

    mc.on("pinchend panend", function (ev) {
        if (request_in_progress) {
            return;
        }
        new_scale = limitZoom(ev.scale);

        setLocation(width * 0.5 - ev.deltaX, height * 0.5 - ev.deltaY);
        zoom(new_scale);
    });

    mc.on("doubletap", function (ev) {
        if (request_in_progress) {
            return;
        }
        newPalette();
    });

    document.onmousewheel = zoom_handler;

    SetUp();
    updateUrl();
});

$(window).resize(function () {
    width = canvas.width;
    height = canvas.height;
    StopColourLoop();
    setTimeout(
        () => {
            SetUpWithoutChangingThePalette();
        },
        500
    );
});

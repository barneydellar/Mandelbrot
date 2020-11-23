
var tpCache = new Array()
var request_in_progress = false;
var width;
var height;
var canvas;

var new_scale;
var delta_x;
var delta_y;
var translation_factor;
var imageObject = new Image();

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

function limitPinchZoom(s) {
    if (s * scale > 600000000000) {
        s = 600000000000 / scale;
    }
    if (s * scale < 0.2) {
        s = 0.2 / scale;
    }
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

    StopColourLoop();

    imageObject.src = canvas.toDataURL();

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();

    translation_factor = (amount - 1) / (2 * amount);
    context.scale(amount, amount);

    context.drawImage(imageObject, 0, 0);

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

function dragStart(ev) {
    if (request_in_progress) {
        return;
    }
    StopColourLoop();
    width = canvas.width;
    height = canvas.height;

    imageObject.src = canvas.toDataURL();
}

function dragMove(ev) {
    if (request_in_progress) {
        return;
    }
    new_scale = limitPinchZoom(ev.scale);

    delta_x = ev.deltaX;
    delta_y = ev.deltaY;

    if (delta_x === 0 && delta_y === 0 && new_scale === 1) {
        return;
    }

    context.clearRect(0, 0, width, height);
    context.save();

    translation_factor = (new_scale - 1) / (2 * new_scale);
    context.scale(new_scale, new_scale);
    context.translate(delta_x - width * translation_factor, delta_y - height * translation_factor);

    context.drawImage(imageObject, 0, 0);
    context.restore();
}

function dragEnd(ev) {
    if (request_in_progress) {
        return;
    }
    new_scale = limitPinchZoom(ev.scale);

    setLocation(width * 0.5 - ev.deltaX, height * 0.5 - ev.deltaY);
    zoom(new_scale);
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

    imageObject.onload = function () {
        context.clearRect(0, 0, width, height);
        context.drawImage(imageObject, 0, 0);
    }

    var mc = new Hammer(canvas);

    mc.get('tap').set({ enable: false });
    mc.get('swipe').set({ enable: false });

    mc.get('pinch').set({ enable: true });
    mc.get('pan').set({ enable: true });
    mc.get('press').set({ enable: true });

    mc.on("pinchstart", function (ev) {
        if (ev.maxPointers <= 1) {
            return;
        }
        dragStart(ev);
    });
    mc.on("panstart", function (ev) {
        if (ev.maxPointers > 1) {
            return;
        }
        dragStart(ev);
    });

    mc.on("pinchmove", function (ev) {
        if (ev.maxPointers <= 1) {
            return;
        }
        dragMove(ev);
    });
    mc.on("panmove", function (ev) {
        if (ev.maxPointers > 1) {
            return;
        }
        dragMove(ev);
    });

    mc.on("pinchend", function (ev) {
        if (ev.maxPointers <= 1) {
            return;
        }
        dragEnd(ev);
    });
    mc.on("panend", function (ev) {
        if (ev.maxPointers > 1) {
            return;
        }
        dragEnd(ev);
    });

    mc.on("press", function (ev) {
        if (request_in_progress) {
            return;
        }
        newPalette();
        ev.stopPropagation();
    });

    document.onmousewheel = zoom_handler;

    SetUp();
    updateUrl();

    window.addEventListener('selectstart', function (e) { e.preventDefault(); });
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

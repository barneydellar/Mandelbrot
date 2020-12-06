
var request_in_progress = false;
var drag_in_progress = false;

var new_scale;
var delta_x;
var delta_y;
var translation_factor;
var imageObject = new Image();

const zoom_in_limit = 100000000000;
const zoom_out_limit = 0.2;

//-------------------------------------------------------------------------------------

function updateUrl() {
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set("x", offset_x);
    queryParams.set("y", offset_y);
    queryParams.set("s", scale);
    history.replaceState(null, null, "?" + queryParams.toString());
}

function limitZoom(s) {
    s = Math.min(s, zoom_in_limit)
    s = Math.max(s, 0.2)
    return s;
}

function limitPinchZoom(s) {
    if (s * scale > zoom_in_limit) {
        s = zoom_in_limit / scale;
    }
    if (s * scale < zoom_out_limit) {
        s = zoom_out_limit / scale;
    }
    return s;
}

function zoom(amount) {

    if (amount <= 0) {
        return;
    }
    scale *= amount;

    scale = limitZoom(scale);

    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));
    resizeCount++;
    NewMandelbrot();
    updateUrl();
}

function setLocation(x, y) {

    var complex = ViewToComplex(x, y);
    offset_x = complex[0];
    offset_y = complex[1];
}

function zoom_handler(event) {
    if (request_in_progress) {
        return;
    }
    request_in_progress = true;

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
    setLocation(event.offsetX, event.offsetY);
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
    if (drag_in_progress) {
        return;
    }
    drag_in_progress = true;
    request_in_progress = true;
    StopColourLoop();
    full_w = canvas.width;
    full_h = canvas.height;

    imageObject.src = canvas.toDataURL();
}

function dragMove(ev) {
    if (!drag_in_progress) {
        return;
    }
    new_scale = limitPinchZoom(ev.scale);

    delta_x = ev.deltaX;
    delta_y = ev.deltaY;

    if (delta_x === 0 && delta_y === 0 && new_scale === 1) {
        return;
    }

    context.clearRect(0, 0, full_w, full_h);
    context.save();

    translation_factor = (new_scale - 1) / (2 * new_scale);
    context.scale(new_scale, new_scale);
    context.translate(delta_x - full_w * translation_factor, delta_y - full_h * translation_factor);

    context.drawImage(imageObject, 0, 0);
    context.restore();
}

function dragEnd(ev) {
    if (!drag_in_progress) {
        return;
    }
    new_scale = limitPinchZoom(ev.scale);

    setLocation(full_w * 0.5 - ev.deltaX, full_h * 0.5 - ev.deltaY);
    zoom(new_scale);

    drag_in_progress = false;
}

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

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
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    context = canvas.getContext("2d");
    full_w = canvas.width;
    full_h = canvas.height;

    imageObject.onload = function () {
        context.clearRect(0, 0, full_w, full_h);
        context.drawImage(imageObject, 0, 0);
    }

    var mc = new Hammer(canvas);

    mc.get('tap').set({ enable: false });
    mc.get('swipe').set({ enable: false });
    mc.get('press').set({ enable: true, time:1200});
    mc.on("press", function (ev) {
        if (request_in_progress) {
            return;
        }
        newPalette();
    });

    if (isMobile.any()) {
        mc.get('pinch').set({ enable: true, threshold: 0 });
        mc.get('pan').set({ enable: false });

        mc.on("pinchstart", function (ev) {
            dragStart(ev);
        });
        mc.on("pinchmove", function (ev) {
            dragMove(ev);
        });
        mc.on("pinchend", function (ev) {
            dragEnd(ev);
        });
    } else {

        mc.get('pinch').set({ enable: false });
        mc.get('pan').set({ enable: true, threshold: 0 });

        mc.on("panstart", function (ev) {
            dragStart(ev);
        });
        mc.on("panmove", function (ev) {
            dragMove(ev);
        });
        mc.on("panend", function (ev) {
            dragEnd(ev);
        });
        document.onmousewheel = zoom_handler;
    }

    SetUp();

    updateUrl();

    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, false);
    canvas.addEventListener('selectstart', function (e) { e.preventDefault(); }, false);
});

var resizeCount = 0;
$(window).resize(function () {
    resizeCount++;
    StopColourLoop();

    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    full_w = canvas.width;
    full_h = canvas.height;
    context = canvas.getContext("2d");
    context.clearRect(0, 0, full_w, full_h);
    setTimeout(
        () => {
            SetUpWithoutChangingThePalette();
        },
        500
    );
});

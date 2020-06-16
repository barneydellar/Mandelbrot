
var offset_x = -0.1089;
var offset_y = -0.89598;
var scale = 128;

var half_h;
var half_w;
var full_h;
var full_w;
var one_over_min_half;
var context;

var request_in_progress = false;

var old_palette;
var new_palette;
var palette_counter = 0;
var palette_size = 10000;

var escape_array;

var interval_token = -1;

function MandelbrotToColour(mand) {
    return palette[mand];
}

//-------------------------------------------------------------------------------------

function BrightColourValue() {
    return getRndBias(0, 255, 255, 1);
}

//-------------------------------------------------------------------------------------

function DimColourValue() {
    return getRndBias(0, 255, 0, 1);
}

//-------------------------------------------------------------------------------------

function RandomColour() {

    // Choose a colour (red, green, blue, cyan, magenta, yellow, dark);
    var bright_index = Math.floor(Math.random() * 7);

    var r_func;
    if (bright_index === 0 || bright_index === 3 || bright_index === 4) {
        r_func = BrightColourValue;
    } else {
        r_func = DimColourValue;
    }

    var g_func;
    if (bright_index === 1 || bright_index === 3 || bright_index === 5) {
        g_func = BrightColourValue;
    } else {
        g_func = DimColourValue;
    }

    var b_func;
    if (bright_index === 2 || bright_index === 4 || bright_index === 5) {
        b_func = BrightColourValue;
    } else {
        b_func = DimColourValue;
    }

    return [r_func(), g_func(), b_func()];
}

//-------------------------------------------------------------------------------------

function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min,
        mix = Math.random() * influence;
    return Math.round(rnd * (1 - mix) + bias * mix);
}

//-------------------------------------------------------------------------------------

function CreatePalette() {
    // Set up the palette:
    var palette = new Array(palette_size);
    palette[0] = [0, 0, 0]

    start_colour = RandomColour();
    end_colour = RandomColour();

    loop_size = getRndBias(1, 100, 3, 1);

    for (i = 1; i < palette_size; i += loop_size) {

        for (j = 0; j < loop_size; j++) {

            if (i + j >= palette_size) {
                break;
            }

            start_frac = (loop_size - j) / loop_size;
            end_frac = j / loop_size;

            palette[i + j] = [
                start_colour[0] * start_frac + end_colour[0] * end_frac,
                start_colour[1] * start_frac + end_colour[1] * end_frac,
                start_colour[2] * start_frac + end_colour[2] * end_frac
            ];
        }
        start_colour = end_colour;
        end_colour = RandomColour();
    }
    return palette;
}

//-------------------------------------------------------------------------------------

function GetColour(palette, palette_length, mandelbrot) {

    if (mandelbrot < palette_length - 1) {
        return palette[mandelbrot];
    }

    return RandomColour();
}

//-------------------------------------------------------------------------------------

function GetCurrentPalette() {

    var iterations = 100;

    var old_frac = 1 - (palette_counter / iterations);
    var new_frac = palette_counter / iterations;

    var size = old_palette.length;
    var current_palette = new Array(size);

    for (i = 0; i < size; i++) {

        current_palette[i] = [
            old_palette[i][0] * old_frac + new_palette[i][0] * new_frac,
            old_palette[i][1] * old_frac + new_palette[i][1] * new_frac,
            old_palette[i][2] * old_frac + new_palette[i][2] * new_frac
        ];
    }

    palette_counter++;

    if (palette_counter >= iterations) {
        palette_counter = 0;
        old_palette = new_palette;
        new_palette = CreatePalette();
    }

    return current_palette;
}

//-------------------------------------------------------------------------------------

function DrawCanvas() {

    var canvasData = context.getImageData(0, 0, full_w, full_h);
    var palette = GetCurrentPalette();

    var colour;
    var canvas_index;

    var palette_length = palette.length;

    for (i = 0; i < escape_array.length; i++) {

        colour = GetColour(palette, palette_length, escape_array[i]);

        canvas_index = 4 * i;

        canvasData.data[canvas_index + 0] = colour[0];
        canvasData.data[canvas_index + 1] = colour[1];
        canvasData.data[canvas_index + 2] = colour[2];
        canvasData.data[canvas_index + 3] = 255;
    }

    context.putImageData(canvasData, 0, 0);

}

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

//-------------------------------------------------------------------------------------

function ViewToComplex(x, y) {

    // Map (0->w) to (-1, 1);
    var x_complex = offset_x + ((x - half_w) * one_over_min_half);
    var y_complex = offset_y + ((y - half_h) * one_over_min_half);

    return ([x_complex, y_complex]);
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

function StopColourLoop() {

    if (interval_token !== -1) {
        clearInterval(interval_token);
        interval_token = -1;
    }
}

//-------------------------------------------------------------------------------------

function StartColourLoop() {

    // Start the tick function to change the colours
    StopColourLoop();

    interval_token = setInterval(function () { DrawCanvas(); }, 20);
}

//-------------------------------------------------------------------------------------

$(window).resize(function () {
    SetUp();
});

//-------------------------------------------------------------------------------------

$(document).ready(function () {

    var canvas = $("#MandelbrotCanvas")[0];
    canvas.addEventListener('click', click_handler, false);
    canvas.addEventListener('contextmenu', right_click_handler, true);

    if (window.addEventListener) {
        document.addEventListener('DOMMouseScroll', zoom_handler, false);
    }
    document.onmousewheel = zoom_handler;

    SetUp();
});

//-------------------------------------------------------------------------------------

function SetUp() {

    StopColourLoop();

    // Set up some initial variables
    var canvas = $("#MandelbrotCanvas")[0];
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
    full_w = canvas.width;
    full_h = canvas.height;

    // Create the array of escape values
    escape_array = new Array(full_w * full_h);

    // Grab the context
    context = canvas.getContext("2d");

    half_w = full_w * 0.5;
    half_h = full_h * 0.5;
    one_over_min_half = 1 / (scale * Math.min(half_w, half_h));

    old_palette = CreatePalette();
    new_palette = CreatePalette();
    palette_counter = 0;

    NewMandelbrot();
}
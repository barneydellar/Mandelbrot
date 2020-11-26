var offset_x = -0.5;
var offset_y = 0;
var scale = 1;

var half_h;
var half_w;
var full_h;
var full_w;
var one_over_min_half;
var context;


var main_palette;
var main_palette_size = 20000;

var palette_counter = 0;
var small_palette;
var small_palette_size = 800;


var escape_array;

var interval_token = -1;

//-------------------------------------------------------------------------------------

function MandelbrotToColour(mand) {
    return palette[mand];
}

//-------------------------------------------------------------------------------------

function BrightColourValue() {
    return getRndBias(50, 255, 255, 1);
}

//-------------------------------------------------------------------------------------

function DimColourValue() {
    return getRndBias(0, 100, 0, 1);
}

//-------------------------------------------------------------------------------------

function RandomColourImp() {

    var colorIndex= Math.floor(Math.random() * 7);
    const Colours = {red:0, green:1, blue:2, cyan:3, magenta:4, yellow:5, dark:6};

    var r_func;
    if (colorIndex === Colours.red || colorIndex === Colours.cyan || colorIndex === Colours.magenta) {
        r_func = BrightColourValue;
    } else {
        r_func = DimColourValue;
    }

    var g_func;
    if (colorIndex === Colours.green || colorIndex === Colours.cyan || colorIndex === Colours.yellow) {
        g_func = BrightColourValue;
    } else {
        g_func = DimColourValue;
    }

    var b_func;
    if (colorIndex === Colours.blue || colorIndex === Colours.magenta || colorIndex === Colours.yellow) {
        b_func = BrightColourValue;
    } else {
        b_func = DimColourValue;
    }

    return [r_func(), g_func(), b_func()];
}

//-------------------------------------------------------------------------------------

function RandomColour(other) {

    while (true) {
        new_color = RandomColourImp();
        distance = Math.pow(other[0] - new_color[0], 2) + Math.pow(other[1] - new_color[1], 2) + Math.pow(other[2] - new_color[2], 2);
        if (distance > 1000) {
            break;
        }
    }

    return new_color;
}

//-------------------------------------------------------------------------------------

function getRndBias(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min,
        mix = Math.random() * influence;
    return Math.round(rnd * (1 - mix) + bias * mix);
}

//-------------------------------------------------------------------------------------

function CreatePalette(size) {

    var palette = new Array(size);

    start_colour = RandomColour([0, 0, 0]);
    end_colour = RandomColour(start_colour);

    initial_colour = start_colour;

    divisor = getRndBias(2, 100, 3, 1);

    loop_size = Math.ceil(size / divisor);

    for (i = 0; i < size; i += loop_size) {

        for (j = 0; j < loop_size; j++) {

            if (i + j >= size) {
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

        if (i + j + loop_size >= size) {
            end_colour = initial_colour;
        } else {
            end_colour = RandomColour(end_colour);
        }
    }
    return palette;
}

//-------------------------------------------------------------------------------------

function GetColour(palette, palette_length, mandelbrot) {

    if (mandelbrot < palette_length - 1) {
        return palette[mandelbrot];
    }

    return palette[palette_length - 1];
}

//-------------------------------------------------------------------------------------

function UpdateMainPalette() {

    for (i = main_palette_size-1; i > 1; i--) {
        main_palette[i] = [
            main_palette[i - 1][0],
            main_palette[i - 1][1],
            main_palette[i - 1][2]
        ];
    }

    main_palette[1] = small_palette[palette_counter];
    palette_counter++;

    if (palette_counter >= small_palette_size) {
        palette_counter = 0;
    }
}

function CopySmallPaletteIntoLargeOne() {

    for (i = 1; i < main_palette_size; i++) {
        main_palette[i] = [
            small_palette[i % small_palette_size][0],
            small_palette[i % small_palette_size][1],
            small_palette[i % small_palette_size][2]
        ];
    }
}

//-------------------------------------------------------------------------------------

var zoom_factor = 1;

function DrawCanvas() {

    var canvasData = context.getImageData(0, 0, full_w, full_h);
    UpdateMainPalette();

    var colour;
    var canvas_index;

    var fraction = 1 / zoom_factor;

    var full_w_fraction = Math.ceil(full_w * fraction);

    var canvas_index = 0;
    var escape_index = 0;
    var j_full_w_fraction = 0;

    for (j = 0; j < full_h; j++) {
        escape_index = Math.ceil(j_full_w_fraction) * full_w_fraction;

        for (i = 0; i < full_w; i++) {

            colour = GetColour(main_palette, main_palette_size, escape_array[Math.ceil(escape_index)]);

            canvasData.data[canvas_index + 0] = colour[0];
            canvasData.data[canvas_index + 1] = colour[1];
            canvasData.data[canvas_index + 2] = colour[2];
            canvasData.data[canvas_index + 3] = 255;

            canvas_index += 4;
            escape_index += fraction;
        }
        j_full_w_fraction += fraction;
    }

    context.putImageData(canvasData, 0, 0);
}

//-------------------------------------------------------------------------------------

function ViewToComplex(x, y) {

    // Map (0->w) to (-1, 1);
    var x_complex = offset_x + ((x - half_w) * one_over_min_half);
    var y_complex = offset_y + ((y - half_h) * one_over_min_half);

    return ([x_complex, y_complex]);
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

function SetUpWithoutChangingThePalette() {

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

    NewMandelbrot();
}

function SetUp() {
    small_palette = CreatePalette(small_palette_size);
    main_palette = new Array(main_palette_size);
    CopySmallPaletteIntoLargeOne();
    main_palette[0] = [0, 0, 0];

    SetUpWithoutChangingThePalette();

    palette_counter = 0;
}

var limit = 10000;


function NewMandelbrot() {

    request_in_progress = true;
    document.body.style.cursor = 'wait';
    StopColourLoop();
    NewMandelbrotImp(4);
}
function NewMandelbrotImp(factor) {

    zoom_factor = factor;
    fraction = 1 / zoom_factor;

    GenerateEscapeValues(Math.ceil(full_w * fraction), Math.ceil(full_h * fraction));
    DrawCanvas();

    if (factor == 1) {
        StartColourLoop();
        request_in_progress = false;
        document.body.style.cursor = 'default';
        return;
    }

    setTimeout(function () {
        factor = Math.round(factor / 2);
        NewMandelbrotImp(factor);
    }, 1);
}

function GenerateEscapeValues(generate_width, generate_height) {

    local_half_w = generate_width * 0.5;
    local_half_h = generate_height * 0.5;

    local_one_over_min_half = 1 / (scale * Math.min(local_half_w, local_half_h));

    function LocalViewToComplex(x, y) {

        // Map (0->w) to (-1, 1);
        var x_complex = offset_x + ((x - local_half_w) * local_one_over_min_half);
        var y_complex = offset_y + ((y - local_half_h) * local_one_over_min_half);

        return ([x_complex, y_complex]);
    }

    var origin_complex = LocalViewToComplex(0, 0);
    var x_complex = LocalViewToComplex(1, 0);
    var y_complex = LocalViewToComplex(0, 1);

    var step_x_real = x_complex[0] - origin_complex[0];
    var step_x_imag = x_complex[1] - origin_complex[1];
    var step_y_real = y_complex[0] - origin_complex[0];
    var step_y_imag = y_complex[1] - origin_complex[1];

    var complex_x_iter_real;
    var complex_y_iter_real = origin_complex[0];
    var complex_y_iter_imag = origin_complex[1];

    var i, j;

    var j_step;
    for (j = 0; j < generate_height; j++) {

        complex_x_iter_real = complex_y_iter_real;
        complex_x_iter_imag = complex_y_iter_imag;

        j_step = j * generate_width;
        for (i = 0; i < generate_width; i++) {

            escape_array[i + j_step] = ComplexToMandelbrot(complex_x_iter_real, complex_x_iter_imag);;

            complex_x_iter_real += step_x_real;
            complex_x_iter_imag += step_x_imag;
        }
        complex_y_iter_real += step_y_real;
        complex_y_iter_imag += step_y_imag;
    }
}

function ComplexToMandelbrot(c_real, c_imag) {

    var z_real = 0.0;
    var z_imag = 0.0;
    var w = 0.0;

    var derivr = 1;
    var derivi = 0;

    for (var l = 1; l < limit; l++) {

        var r = z_real - z_imag + c_real;
        var i = w - z_real - z_imag + c_imag;

        if (derivr * derivr + derivi * derivi < 1e-9) {
            return 0;
        }

        var new_derivr = 2 * (derivr * r - derivi * i);
        derivi = 2 * (derivr * i + derivi * r);
        derivr = new_derivr;

        z_real = r * r;
        z_imag = i * i;

        var rplusi = (r + i);
        w = rplusi * rplusi;

        var mag = z_real + z_imag;

        if (mag > 4) {
            return l;
        }
    }
    return 0;
}

#include "stdafx.h"
#include "Mandelbrot.h"

Mandelbrot::Mandelbrot(const int canvas_width, const int canvas_height, const double scale, const double x, const double y, const int palette_size, const int limit) :
    canvas_width(canvas_width),
    canvas_height(canvas_height),
    scale(scale),
    offset_x(x),
    offset_y(y),
    palette_size(palette_size),
    limit(limit),
    half_w(canvas_width * 0.5),
    half_h(canvas_height * 0.5),
    one_over_min_half(1 / (scale * std::min(half_w, half_h)))
{
}


double Mandelbrot::ComplexToMandelbrot(const complex c) const {

    const double c_real = c.real();
    const double c_imag = c.imag();

    double real = 0;
    double imag = 0;

    double new_real_square = 0;
    double new_imag_square = 0;

    for (auto i = 1; i < limit; i++) {

        double new_real = c_real + new_real_square - new_imag_square;
        double new_imag = c_imag + (2 * real * imag);

        new_real_square = pow(new_real, 2);
        new_imag_square = pow(new_imag, 2);

        if (new_real_square + new_imag_square > 4) {
            return i;
        }
        real = new_real;
        imag = new_imag;
    }
    return 0;
}

Mandelbrot::complex Mandelbrot::ViewToComplex(const int x, const int y) const {
    const double x_complex = offset_x + ((x - half_w) * one_over_min_half);
    const double y_complex = offset_y + ((y - half_h) * one_over_min_half);
    return { x_complex, y_complex };
}


web::json::value Mandelbrot::JSON() const {

    const auto origin_complex = ViewToComplex(0, 0);
    const auto x_complex = ViewToComplex(1, 0);
    const auto y_complex = ViewToComplex(0, 1);

    const auto step_x = x_complex - origin_complex;
    const auto step_y = y_complex - origin_complex;

    std::vector<std::vector<int>> canvas;
    canvas.resize(canvas_height);
    for (auto& line : canvas) {
        line.resize(canvas_width);
    }

    std::vector<int> lines(canvas_height);
    std::iota(lines.begin(), lines.end(), 0);

    std::for_each(
        std::execution::par,
        lines.cbegin(),
        lines.cend(),
        [step_x, origin_complex, step_y, this, &canvas](int l)
    {
        const auto complex_y_iter = origin_complex + (step_y * complex(l, 0));

        auto complex_x_iter = complex_y_iter;

        for (int i = 0; i < canvas_width; ++i) {

            const double mand = ComplexToMandelbrot(complex_x_iter);

            int palette_index = 0;

            if (mand != 0) {
                palette_index = static_cast<int>(std::round((mand / limit) * palette_size));
                palette_index = static_cast<int>(std::max<int>(std::min<int>(palette_size - 1, palette_index), 1));
            }
            canvas[l][i] = palette_index;
            complex_x_iter += step_x;
        }
    }
    );

    auto escape_array = web::json::value::array(canvas_width * canvas_height);
    int i = 0;
    for (const auto l : canvas) {
        for (const auto v : l) {
            escape_array[i++] = v;
        }
    }

    return escape_array;
}


#include "stdafx.h"
#include "Mandelbrot.h"

Mandelbrot::Mandelbrot(const int canvas_width, const int canvas_height, const double scale, const double x, const double y) :
    canvas_width(canvas_width),
    canvas_height(canvas_height),
    scale(scale),
    offset_x(x),
    offset_y(y),
    half_w(canvas_width * 0.5),
    half_h(canvas_height * 0.5),
    one_over_min_half(1 / (scale * std::min(half_w, half_h)))
{
}


int Mandelbrot::ComplexToMandelbrot(const complex c) const {

    complex z = 0;
    complex new_square = 0;
    complex derivative = 1;
    const auto two = complex{ 2, 0 };
    for (auto i = 1; i < limit; i++) {
        complex new_ = { c.real() + new_square.real() - new_square.imag(), c.imag() + (2 * z.real() * z.imag()) };
        new_square = { pow(new_.real(), 2), pow(new_.imag(), 2) };

        const auto mag = new_square.real() + new_square.imag();

        if (mag < 1e-12) {
            return 0;
        }

        if (mag > 400) {
            return i;
        }
        derivative = derivative * two * z;
        z = new_;
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
        [step_x, origin_complex, step_y, this, &canvas](const int l)
    {
        const auto complex_y_iter = origin_complex + (step_y * complex(l, 0));

        auto complex_x_iter = complex_y_iter;

        for (int i = 0; i < canvas_width; ++i) {
            canvas[l][i] = ComplexToMandelbrot(complex_x_iter);
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


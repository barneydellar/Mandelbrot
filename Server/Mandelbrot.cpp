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


int Mandelbrot::ComplexToMandelbrot(const complex& c) const {

    double x0 = c.real();
    double y0 = c.imag();

    double x2 = 0.0;
    double y2 = 0.0;
    double w = 0.0;

    double derivx = 1;
    double derivy = 0;

    for (auto i = 1; i < limit; i++) {

        const auto x = x2 - y2 + x0;
        const auto y = w - x2 - y2 + y0;

        if (std::pow(derivx, 2) + std::pow(derivy, 2) < 1e-9) {
            return 0;
        }

        const double new_derivx = 2 * (derivx * x - derivy * y);
        derivy = 2 * (derivx * y + derivy * x);
        derivx = new_derivx;

        x2 = std::pow(x, 2);
        y2 = std::pow(y, 2);

        w = std::pow((x + y), 2);

        const auto mag = x2 + y2;

        if (mag < 1e-12) {
            return 0;
        }
        if (mag > 4) {
            return i;
        }
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
    for (const auto& l : canvas) {
        for (const auto v : l) {
            escape_array[i++] = v;
        }
    }

    return std::move(escape_array);
}


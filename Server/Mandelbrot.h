#pragma once
#include <complex>

class Mandelbrot
{
public:

    Mandelbrot(int, int, double, double, double);

    [[nodiscard]] web::json::value JSON() const;

    const int canvas_width;
    const int canvas_height;
    const double scale;
    const double offset_x;
    const double offset_y;

    const double half_w;
    const double half_h;
    const double one_over_min_half{};
    const int limit = 10000;

private:

    using complex = std::complex<double>;

    [[nodiscard]] int ComplexToMandelbrot(const complex& c) const;
    [[nodiscard]] complex ViewToComplex(int x, int y) const;

};


#pragma once
#include <complex>

class Mandelbrot
{
public:

    Mandelbrot(int, int, double, double, double, int, int);

    [[nodiscard]] web::json::value JSON() const;

    const int canvas_width;
    const int canvas_height;
    const double scale;
    const double offset_x;
    const double offset_y;
    const int palette_size;
    const int limit;

    const double half_w;
    const double half_h;
    const double one_over_min_half{};


private:

    using complex = std::complex<double>;

    double ComplexToMandelbrot(const complex c) const;
    complex ViewToComplex(int x, int y) const;

};


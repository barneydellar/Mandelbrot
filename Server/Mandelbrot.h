#pragma once
#include <complex>

class Mandelbrot
{
public:

    void Resize(int, int);

    [[nodiscard]] const web::json::value& JSON(double, double, double);

    int canvas_width;
    int canvas_height;
    double scale;
    double offset_x;
    double offset_y;

    double half_w;
    double half_h;
    double one_over_min_half{};
    const int limit = 10000;

private:

    std::vector<std::vector<int>> canvas;
    std::vector<int> lines;
    web::json::value escape_array;

    using complex = std::complex<double>;

    [[nodiscard]] int ComplexToMandelbrot(const complex& c) const;
    [[nodiscard]] complex ViewToComplex(int x, int y) const;
};


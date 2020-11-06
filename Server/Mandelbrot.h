#pragma once

class Mandelbrot
{
public:

    void Resize(int, int);

    [[nodiscard]] const web::json::value& Json(long double, long double, long double);

    int m_canvas_width{};
    int m_canvas_height{};
    long double m_scale{};
    long double m_offset_x{};
    long double m_offset_y{};

    long double m_half_w{};
    long double m_half_h{};
    long double m_one_over_min_half{};
    const int m_limit = 100000;

private:

    std::vector<std::vector<int>> m_canvas{};
    std::vector<int> m_lines{};
    web::json::value m_escape_array{};

    using complex = std::complex<long double>;

    [[nodiscard]] int ComplexToMandelbrot(const complex& c) const;
    [[nodiscard]] complex ViewToComplex(int x, int y) const;
};


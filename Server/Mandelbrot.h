#pragma once

class Mandelbrot
{
public:

    void Resize(int, int);

    [[nodiscard]] const web::json::value& Json(double, double, double);

    int m_canvas_width{};
    int m_canvas_height{};
    double m_scale{};
    double m_offset_x{};
    double m_offset_y{};

    double m_half_w{};
    double m_half_h{};
    double m_one_over_min_half{};
    const int m_limit = 10000;

private:

    std::vector<std::vector<int>> m_canvas{};
    std::vector<int> m_lines{};
    web::json::value m_escape_array{};

    using complex = std::complex<double>;

    [[nodiscard]] int ComplexToMandelbrot(const complex& c) const;
    [[nodiscard]] complex ViewToComplex(int x, int y) const;
};


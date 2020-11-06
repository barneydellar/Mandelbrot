#include "stdafx.h"
#include "Mandelbrot.h"


void Mandelbrot::Resize(const int w, const int h) {

    if (m_canvas_width == w && m_canvas_height == h) {
        return;
    }

    m_canvas_width = w;
    m_canvas_height = h;
    m_half_w = m_canvas_width * 0.5L;
    m_half_h = m_canvas_height * 0.5L;

    m_canvas.resize(m_canvas_height);
    for (auto& line : m_canvas) {
        line.resize(m_canvas_width);
    }

    m_lines.resize(m_canvas_height);
    std::iota(m_lines.begin(), m_lines.end(), 0);

    m_escape_array = web::json::value::array(m_canvas_width * m_canvas_height);
}


int Mandelbrot::ComplexToMandelbrot(const complex& c) const {

    const auto cr = c.real();
    const auto ci = c.imag();

    auto zr = 0.L;
    auto zi = 0.L;
    auto w = 0.L;

    auto derived_r = 1.L;
    auto derived_i = 0.L;

    for (auto l = 1; l < m_limit; l++) {

        const auto r = zr - zi + cr;
        const auto i = w - zr - zi + ci;

        if (std::pow(derived_r, 2) + std::pow(derived_i, 2) < 1e-12L) {
            return 0;
        }

        const auto new_derived_r = 2 * (derived_r * r - derived_i * i);
        derived_i = 2 * (derived_r * i + derived_i * r);
        derived_r = new_derived_r;

        zr = std::pow(r, 2);
        zi = std::pow(i, 2);

        const auto r_plus_i = r + i;
        w = std::pow(r_plus_i, 2);

        const auto mag = zr + zi;

        if (mag > 4) {
            return l;
        }
    }
    return 0;
}

Mandelbrot::complex Mandelbrot::ViewToComplex(const int x, const int y) const {
    const auto x_complex = m_offset_x + (x - m_half_w) * m_one_over_min_half;
    const auto y_complex = m_offset_y + (y - m_half_h) * m_one_over_min_half;
    return { x_complex, y_complex };
}

const web::json::value& Mandelbrot::Json(const long double s, const long double x, const long double y) {

    m_scale = s;
    m_offset_x = x;
    m_offset_y = y;
    m_one_over_min_half = 1 / (m_scale * std::min(m_half_w, m_half_h));

    const auto origin_complex = ViewToComplex(0, 0);
    const auto x_complex = ViewToComplex(1, 0);
    const auto y_complex = ViewToComplex(0, 1);

    const auto step_x = x_complex - origin_complex;
    const auto step_y = y_complex - origin_complex;

    std::for_each(
        std::execution::par_unseq,
        m_lines.cbegin(),
        m_lines.cend(),
        [step_x, origin_complex, step_y, this](const int l)
    {
        const auto complex_y_iter = origin_complex + step_y * complex(l, 0);

        auto complex_x_iter = complex_y_iter;

        for (auto i = 0; i < m_canvas_width; ++i) {
            m_canvas[l][i] = ComplexToMandelbrot(complex_x_iter);
            complex_x_iter += step_x;
        }
    }
    );

    auto i = 0;
    for (const auto& l : m_canvas) {
        for (const auto v : l) {
            m_escape_array[i++] = v;
        }
    }

    return m_escape_array;
}


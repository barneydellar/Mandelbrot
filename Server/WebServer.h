#pragma once
#include "Mandelbrot.h"

class WebServer final
{
public:
    explicit WebServer(int port);

    void HandleGet(web::http::http_request request);
    void HandlePost(web::http::http_request request);

    void HandleError(pplx::task<void>& t) const;
    pplx::task<void> Open();
    pplx::task<void> Close();

private:

    Mandelbrot m_mandelbrot;

    void ReplyForMissingJson(web::http::http_request, std::string);
    int GetInt(web::http::http_request, web::json::value, std::wstring);
    long double GetDouble(web::http::http_request, web::json::value, std::wstring);

    void ReturnFile(
        web::http::http_request const& request,
        utility::string_t file,
        utility::string_t content_type
    );

    web::http::experimental::listener::http_listener m_listener{};

    std::shared_ptr<spdlog::logger> m_logger{};
};


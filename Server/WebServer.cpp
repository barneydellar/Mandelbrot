#include "stdafx.h"
#include "WebServer.h"
#include "Mandelbrot.h"

using namespace web;
using namespace http;
using namespace experimental::listener;
using namespace concurrency::streams;

namespace {

    std::string WStringToString(std::wstring wide_string) {
        std::setlocale(LC_ALL, "");
        const std::locale locale("");
        typedef std::codecvt<wchar_t, char, std::mbstate_t> converter_type;
        const converter_type& converter = std::use_facet<converter_type>(locale);
        std::vector<char> to(wide_string.length() * converter.max_length());
        std::mbstate_t state;
        const wchar_t* from_next;
        char* to_next;
        const converter_type::result result = converter.out(state, wide_string.data(), wide_string.data() + wide_string.length(), from_next, &to[0], &to[0] + to.size(), to_next);
        if (result == converter_type::ok || result == converter_type::noconv) {
            const std::string s(&to[0], to_next);
            return s;
        }
        throw std::exception("Unable to convert a wide string to a string");
    }
}

WebServer::WebServer(const int port)
    : m_listener(L"http://*:" + std::to_wstring(port))
{
    m_logger = spdlog::get("MandelbrotLog");

    m_listener.support(methods::GET, std::bind(&WebServer::HandleGet, this, std::placeholders::_1));
    m_listener.support(methods::POST, std::bind(&WebServer::HandlePost, this, std::placeholders::_1));
}


void WebServer::HandleError(pplx::task<void>& t) const
{
    try
    {
        t.get();
    }
    catch (std::exception& e)
    {
        m_logger->error("Exception caught in the web server: {0}.", e.what());
    }
    catch (...)
    {
        m_logger->error("Unknown Exception caught in the web server.");
    }
}

pplx::task<void> WebServer::Open()
{
    return m_listener.open();
}

pplx::task<void> WebServer::Close()
{
    return m_listener.close().then([this](pplx::task<void> t) { HandleError(t); });
}

void WebServer::HandleGet(http_request request)
{
    if (request.absolute_uri().path() == L"/") {
        return ReturnFile(request, U("Mandelbrot.html"), U("text/html"));
    }

    if (request.absolute_uri().path() == L"/Logs") {
        m_logger->flush();
        return ReturnFile(request, U("../serverlog.txt"), U("text/plain"));
    }

    const auto path_str = utility::conversions::to_utf8string(request.absolute_uri().path());
    const auto path_obj = std::filesystem::path(path_str);

    if (path_obj.extension() == L".js") {
        return ReturnFile(request, request.absolute_uri().path(), U("application/javascript"));
    }
    if (path_obj.extension() == L".css") {
        return ReturnFile(request, request.absolute_uri().path(), U("text/css"));
    }
    if (path_obj.extension() == L".png" || path_obj.extension() == L".jpg") {
        return ReturnFile(request, request.absolute_uri().path(), U("application/octet-stream"));
    }

    request.reply(status_codes::NotFound, U("Path not found"))
    .then([this](pplx::task<void> t) {HandleError(t);});
}


void WebServer::ReplyForMissingJson(const http_request request, const std::string s) {
    m_logger->error(s);
    request.reply(status_codes::BadRequest, s)
        .then([this](pplx::task<void> t) {HandleError(t);});
}

int WebServer::GetInt(const http_request request, json::value request_json, utility::string_t s) {
    const auto int_exists = request_json[s].is_integer();
    if (!int_exists) {
        ReplyForMissingJson(request, WStringToString(s) + " not supplied");
        throw std::invalid_argument("Missing parameter");
    }
    return request_json[s].as_integer();
}

double WebServer::GetDouble(const http_request request, json::value request_json, utility::string_t s) {
    const auto double_exists = request_json[s].is_double();
    if (!double_exists) {
        const auto int_exists = request_json[s].is_integer();
        if (!int_exists) {
            ReplyForMissingJson(request, WStringToString(s) + " not supplied");
            throw std::invalid_argument("Missing parameter");
        }
        return request_json[s].as_integer();
    }
    return request_json[s].as_double();
}

void WebServer::HandlePost(http_request request)
{
    try {
        request.extract_json()
        .then([this, request](json::value request_json) {
            try
            {
                if (request_json.is_null()) {
                    ReplyForMissingJson(request, "No JSON was supplied");
                    return;
                }

                const auto canvas_width = GetInt(request, request_json, L"canvas_width");
                const auto canvas_height = GetInt(request, request_json, L"canvas_height");
                const auto scale = GetDouble(request, request_json, L"scale");
                const auto x = GetDouble(request, request_json, L"x");
                const auto y = GetDouble(request, request_json, L"y");
                const auto palette_size = GetInt(request, request_json, L"palette_size");
                const auto limit = GetInt(request, request_json, L"limit");

                if (request.absolute_uri().path() == L"/Mandelbrot") {
                    m_logger->info("(" + std::to_string(x) + ", " + std::to_string(y) + ") : " + std::to_string(scale));
                    const Mandelbrot m(canvas_width, canvas_height, scale, x, y, palette_size, limit);
                    const auto js = m.JSON();
                    m_logger->info("Done");
                    request.reply(status_codes::OK, js);
                    return;
                }

                m_logger->error("Bad path in POST call.");
                request.reply(status_codes::NotFound, U("Path not found"))
                    .then([this](pplx::task<void> t) {HandleError(t);});
            }
            catch(std::invalid_argument&) {

            }
            catch (const std::exception &e) {
                request.reply(status_codes::InternalError, U("Internal Error"));
                m_logger->error("HandlePost failed: {0}", e.what());
            }
        });
    } catch (const std::exception &e)
    {
        request.reply(status_codes::InternalError, U("Internal Error"));
        m_logger->error("HandlePost failed: {0}", e.what());
    }
}

void WebServer::ReturnFile(
    http_request const& request,
    utility::string_t file,
    const utility::string_t content_type
) {
    file = L"web\\" + file;

    fstream::open_istream(file, std::ios::in).then([=](const istream is)
    {
        request.reply(status_codes::OK, is, content_type).then([this](pplx::task<void> t) { HandleError(t); });
    }).then([=](pplx::task<void> t)
    {
        try
        {
            t.get();
        }
        catch (std::exception& e) {
            m_logger->error("Failed to return a file: {0}", e.what());
            request.reply(status_codes::InternalError).then([this](pplx::task<void> t) { HandleError(t); });
        }
        catch (...)
        {
            m_logger->error("Failed to return a file. Unknown reason.");
            request.reply(status_codes::InternalError).then([this](pplx::task<void> t) { HandleError(t); });
        }
    });
}

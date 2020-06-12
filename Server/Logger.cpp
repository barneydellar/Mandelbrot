#include "stdafx.h"
#include "Logger.h"

namespace Logger
{
    std::shared_ptr<spdlog::logger> SetupLogger()
    {
        auto logger = spdlog::get("MandelbrotLog");
        if (!logger) {
            const auto stdout_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt >();
            const auto rotating_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>("serverlog.txt", 1024 * 1024 , 3);
            std::vector<spdlog::sink_ptr> sinks{ rotating_sink, stdout_sink };
            logger = std::make_shared<spdlog::logger>(
                "MandelbrotLog",
                std::begin(sinks),
                std::end(sinks)
            );
            register_logger(logger);
        }

        return logger;
    }

    std::shared_ptr<spdlog::logger> SetupNullLogger()
    {
        auto logger = spdlog::get("MandelbrotLog");
        if (!logger) {
            const auto null_sink = std::make_shared<spdlog::sinks::null_sink_mt >();
            std::vector<spdlog::sink_ptr> sinks{ null_sink };
            logger = std::make_shared<spdlog::logger>(
                "MandelbrotLog",
                std::begin(sinks),
                std::end(sinks)
                );
            register_logger(logger);
        }

        return logger;
    }
}

#pragma once

namespace Logger
{
    std::shared_ptr<spdlog::logger> SetupLogger();
    std::shared_ptr<spdlog::logger> SetupNullLogger();
}
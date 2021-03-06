#include "stdafx.h"

#include "WebServer.h"
#include "Logger.h"

namespace{
    void WaitForever()
    {
        std::promise<void>().get_future().wait();
    }
}
int main(const int argc, char **argv)
{
    spdlog::init_thread_pool(8192, 1);

    auto logger = Logger::SetupLogger();
    const auto logger_test = spdlog::get("MandelbrotLog");
    if (!logger_test) {
        register_logger(logger);
    }

    logger->info("");
    logger->info("Server starting up...");
    logger->flush();

    auto port = 1280;
    if (argc >= 2)
    {
        std::istringstream iss(argv[1]);
        int val;

        if (iss >> val) {
            port = val;
            logger->info("Port {0} supplied.", port);
        }
        else {
            logger->error("Unable to read the port command line argument. Using {0} instead.", port);
        }
    }
    else {
        logger->info("No port command line argument. Using {0} instead.", port);
    }

    while (true) {
        try {
            WebServer server(port);
            try {
                if (server.Open().wait() == Concurrency::canceled)
                {
                    logger->error("The sever opening was cancelled");
                    return 0;
                }
            }
            catch (std::exception& e) {
                logger->error("The sever failed to start: {0}.", e.what());
                logger->error("Are you running as admin?");
                return 0;
            }
            logger->info("Listening for requests on port {0}", port);
            logger->info("Data is loaded. The server is running.");

            WaitForever();
        }
        catch (std::exception& e) {
            logger->error("The sever crashed: {0}", e.what());
            logger->error("Restarting...");
        }
    }
}

#ifndef INSIGHTS_LOGGING_H
#define INSIGHTS_LOGGING_H

#include <string>
#include <iostream>
#include <fstream>
#include <memory>
#include "insights/json/json.hpp"

namespace insights
{
    namespace logging
    {
        const char *SD_CARD_PATH = "/usd/"; // Path to the SD card
        char *LOG_FILE_NAME = "data.json"; // Default log file name
        
        void setLogFileName(char *filename) {
            LOG_FILE_NAME = filename;
        }
        const char *getLogFileName() {
            return LOG_FILE_NAME;
        }

        void writeToSDCard(const char *data);
        void readFromSDCard(char *buffer, size_t buffer_size);
        void logJSON(const nlohmann::json &json_data);
        void readJSONFromSDCard(char *buffer, size_t buffer_size);
        
    } // namespace logging
} // namespace insights

#endif // INSIGHTS_LOGGING_H
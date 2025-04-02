#include "insights/logging/logging.h"
#include <string.h>  // For string functions

namespace insights
{
    namespace logging
    {
        // Define the static member here - this ensures only one definition exists
        Logger* Logger::instance = nullptr;

        void Logger::writeToSDCard(const char *data)
        {
            // Create buffer for path to avoid modifying string literals
            char path[256];
            snprintf(path, sizeof(path), "%s%s", sdCardPath.c_str(), logFileName.c_str());
            
            FILE *usd_file_write = fopen(path, "w");
            if (usd_file_write != nullptr) {
                fputs(data, usd_file_write);
                fclose(usd_file_write);
            }
        }

        void Logger::readFromSDCard(char *buffer, size_t buffer_size)
        {
            // Create buffer for path
            char path[256];
            snprintf(path, sizeof(path), "%s%s", sdCardPath.c_str(), logFileName.c_str());
            
            FILE *usd_file_read = fopen(path, "r");
            if (usd_file_read == nullptr) {
                // Handle error - file couldn't be opened
                if (buffer_size > 0) {
                    buffer[0] = '\0'; // Empty string if file can't be opened
                }
                return;
            }
            
            // Read file content into buffer
            size_t bytes_read = fread(buffer, 1, buffer_size - 1, usd_file_read);
            
            // Ensure null termination
            if (buffer_size > 0) {
                buffer[bytes_read < buffer_size ? bytes_read : buffer_size - 1] = '\0';
            }
            
            fclose(usd_file_read);
        }

        void Logger::readJSONFromSDCard(char *buffer, size_t buffer_size)
        {
            // Read file content into buffer
            readFromSDCard(buffer, buffer_size);
            
            // Parse JSON data from buffer
            try {
                nlohmann::json json_data = nlohmann::json::parse(buffer);
                
                // Format JSON and write back into the buffer (optional)
                std::string formatted = json_data.dump(4); // Pretty print with 4 spaces
                
                // Copy formatted JSON back to buffer if it fits
                if (formatted.length() < buffer_size) {
                    strcpy(buffer, formatted.c_str());
                }
            } catch (const nlohmann::json::parse_error &e) {
                // Handle JSON parsing error
                if (buffer_size > strlen(buffer) + 20) {
                    char error_msg[256];
                    snprintf(error_msg, sizeof(error_msg), "[JSON Error: %s]", e.what());
                    strcat(buffer, error_msg);
                }
            }
        }
        
        void Logger::startTimeSeriesLogging() {
            if (timeSeriesLoggingActive) {
                return; // Already running
            }
            
            timeSeriesLoggingActive = true;
            
            // Create PROS task for time series logging
            timeSeriesTask = new pros::Task(timeSeriesTaskFn, this, "TimeSeries");
            
            log(LogLevel::INFO, "Time series logging started");
        }
        
        void Logger::stopTimeSeriesLogging() {
            if (!timeSeriesLoggingActive) {
                return; // Not running
            }
            
            timeSeriesLoggingActive = false;
            
            // Clean up task
            if (timeSeriesTask != nullptr) {
                timeSeriesTask->remove();
                delete timeSeriesTask;
                timeSeriesTask = nullptr;
            }
            
            log(LogLevel::INFO, "Time series logging stopped");
        }
        
        void Logger::checkAndLogTrackedValues() {
            trackedValuesMutex.take();
            
            bool needsUpdate = false;
            auto now = std::chrono::steady_clock::now();
            nlohmann::json timeSeriesData;
            
            // First try to read existing data
            char buffer[10240]; // Adjust size as needed
            
            // Create buffer for path
            char path[256];
            snprintf(path, sizeof(path), "%s%s", sdCardPath.c_str(), timeSeriesFileName.c_str());
            
            FILE *file_read = fopen(path, "r");
            if (file_read != nullptr) {
                size_t bytes_read = fread(buffer, 1, sizeof(buffer) - 1, file_read);
                buffer[bytes_read] = '\0';
                fclose(file_read);
                
                try {
                    timeSeriesData = nlohmann::json::parse(buffer);
                } catch (...) {
                    // If parsing fails, start with empty object
                    timeSeriesData = nlohmann::json::object();
                }
            } else {
                // File doesn't exist yet, start with empty JSON
                timeSeriesData = nlohmann::json::object();
            }
            
            // Check each tracked value
            for (auto& pair : trackedValues) {
                auto& value = pair.second;
                
                if (now - value.lastLogged >= value.interval) {
                    // Time to log this value
                    std::string currentValue = value.valueGetter();
                    std::string timestamp = getTimestamp();
                    
                    // Create the entry for this value if it doesn't exist
                    if (!timeSeriesData.contains(value.name)) {
                        timeSeriesData[value.name] = nlohmann::json::object();
                        timeSeriesData[value.name]["description"] = value.description;
                        timeSeriesData[value.name]["values"] = nlohmann::json::array();
                    }
                    
                    // Add the new data point
                    nlohmann::json dataPoint;
                    dataPoint["timestamp"] = timestamp;
                    dataPoint["value"] = currentValue;
                    
                    timeSeriesData[value.name]["values"].push_back(dataPoint);
                    value.lastLogged = now;
                    needsUpdate = true;
                }
            }
            
            trackedValuesMutex.give();
            
            // Write back to file if any values were updated
            if (needsUpdate) {
                writeTimeSeriesDataToSD(timeSeriesData);
            }
        }
        
        void Logger::writeTimeSeriesDataToSD(const nlohmann::json& data) {
            // Create buffer for path
            char path[256];
            snprintf(path, sizeof(path), "%s%s", sdCardPath.c_str(), timeSeriesFileName.c_str());
            
            std::string jsonStr = data.dump(2); // Pretty print with 2 spaces
            
            FILE *file_write = fopen(path, "w");
            if (file_write != nullptr) {
                fputs(jsonStr.c_str(), file_write);
                fclose(file_write);
            } else {
                log(LogLevel::ERROR, "Failed to write time series data to SD card");
            }
        }

        void Logger::untrackValue(const std::string& name) {
            trackedValuesMutex.take();
            bool erased = trackedValues.erase(name) > 0;
            trackedValuesMutex.give();
            
            if (erased) {
                log(LogLevel::INFO, "Stopped tracking value: " + name);
            }
        }

        void Logger::setLogFileName(const std::string& filename) {
            logFileName = filename;
        }

        std::string Logger::getLogFileName() const {
            return logFileName;
        }

        void Logger::setTimeSeriesFileName(const std::string& filename) {
            timeSeriesFileName = filename;
        }

        std::string Logger::getTimeSeriesFileName() const {
            return timeSeriesFileName;
        }

        void Logger::setSDCardPath(const std::string& path) {
            sdCardPath = path;
        }

        std::string Logger::getSDCardPath() const {
            return sdCardPath;
        }

        void Logger::setMinLogLevel(LogLevel level) {
            minLevel = level;
        }

        void Logger::enableConsoleOutput(bool enable) {
            logToConsole = enable;
        }

        void Logger::enableFileOutput(bool enable) {
            logToFile = enable;
        }

        std::string Logger::getTimestamp() const {
            auto now = std::chrono::system_clock::now();
            auto time = std::chrono::system_clock::to_time_t(now);
            std::stringstream ss;
            ss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
            return ss.str();
        }

        std::string Logger::logLevelToString(LogLevel level) const {
            switch (level) {
                case LogLevel::DEBUG:   return "DEBUG";
                case LogLevel::INFO:    return "INFO";
                case LogLevel::WARNING: return "WARNING";
                case LogLevel::ERROR:   return "ERROR";
                default:                return "UNKNOWN";
            }
        }

        void Logger::log(LogLevel level, const std::string& message, const char* file, int line) {
            if (level < minLevel) return;

            std::stringstream logStream;
            logStream << "[" << getTimestamp() << "] [" << logLevelToString(level) << "] ";
            
            if (file != nullptr) {
                logStream << "[" << file << ":" << line << "] ";
            }
            
            logStream << message;
            std::string logMessage = logStream.str();

            if (logToConsole) {
                std::cout << logMessage << std::endl;
            }

            if (logToFile) {
                writeToSDCard(logMessage.c_str());
            }
        }

        void Logger::logJSON(const nlohmann::json& json_data) {
            if (logToFile) {
                std::string data = json_data.dump();
                writeToSDCard(data.c_str());
            }
        }
    } // namespace logging
} // namespace insights
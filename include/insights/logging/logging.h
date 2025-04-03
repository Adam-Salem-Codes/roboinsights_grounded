#ifndef INSIGHTS_LOGGING_H
#define INSIGHTS_LOGGING_H

#include <string>
#include <iostream>
#include <fstream>
#include <memory>
#include <chrono>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <map>
#include <functional>
#include "insights/json/json.hpp"
#include "pros/rtos.hpp" // Use PROS RTOS functionality instead of std::thread

namespace insights
{
    namespace logging
    {
        enum class LogLevel
        {
            DEBUG,
            INFO,
            WARNING,
            ERROR
        };

        // Forward declaration for macros
        class Logger;

// Convenience macros for logging
#define LOG_DEBUG(message) insights::logging::Logger::getInstance().log(insights::logging::LogLevel::DEBUG, message, __FILE__, __LINE__)
#define LOG_INFO(message) insights::logging::Logger::getInstance().log(insights::logging::LogLevel::INFO, message, __FILE__, __LINE__)
#define LOG_WARNING(message) insights::logging::Logger::getInstance().log(insights::logging::LogLevel::WARNING, message, __FILE__, __LINE__)
#define LOG_ERROR(message) insights::logging::Logger::getInstance().log(insights::logging::LogLevel::ERROR, message, __FILE__, __LINE__)

        // Structure to hold information about tracked values
        struct TrackedValue
        {
            std::string name;
            std::string description;
            std::function<std::string()> valueGetter;
            std::chrono::milliseconds interval;
            std::chrono::steady_clock::time_point lastLogged;
        };

        class Logger
        {
        private:
            // Only declare the static member here, define it in the cpp file
            static Logger *instance;
            std::string sdCardPath = "/usd/";
            std::string logFileName = "data.json";
            std::string timeSeriesFileName = "timeseries.json";
            LogLevel minLevel = LogLevel::INFO;
            bool logToConsole = true;
            bool logToFile = false;

            // Time series logging
            std::map<std::string, TrackedValue> trackedValues;
            pros::Mutex trackedValuesMutex;
            bool timeSeriesLoggingActive = false;
            pros::Task *timeSeriesTask = nullptr;

            // Private constructor for singleton pattern
            Logger() {}

            // Destructor to clean up resources
            ~Logger()
            {
                stopTimeSeriesLogging();
            }

            // Static function for PROS Task
            static void timeSeriesTaskFn(void *param)
            {
                Logger *logger = static_cast<Logger *>(param);
                while (logger->timeSeriesLoggingActive)
                {
                    logger->checkAndLogTrackedValues();
                    pros::delay(100); // 100ms delay
                }
            }

        public:
            static Logger &getInstance()
            {
                if (instance == nullptr)
                {
                    instance = new Logger();
                }
                return *instance;
            }

            // Rest of class definition remains the same...

            // Time series tracking methods
            template <typename T>
            void trackValue(const std::string &name,
                            std::function<T()> valueProvider,
                            const std::string &description = "",
                            std::chrono::milliseconds interval = std::chrono::minutes(1))
            {
                trackedValuesMutex.take();

                TrackedValue value;
                value.name = name;
                value.description = description;
                value.interval = interval;
                value.lastLogged = std::chrono::steady_clock::now();

                // Convert any type to string representation
                value.valueGetter = [valueProvider]() -> std::string
                {
                    T val = valueProvider();
                    std::ostringstream oss;
                    oss << val;
                    return oss.str();
                };

                trackedValues[name] = value;

                trackedValuesMutex.give();

                log(LogLevel::INFO, "Started tracking value: " + name);
            }

            void untrackValue(const std::string &name);
            void setLogFileName(const std::string &filename);
            std::string getLogFileName() const;
            void setTimeSeriesFileName(const std::string &filename);
            std::string getTimeSeriesFileName() const;
            void setSDCardPath(const std::string &path);
            std::string getSDCardPath() const;
            void setMinLogLevel(LogLevel level);
            void enableConsoleOutput(bool enable);
            void enableFileOutput(bool enable);
            std::string getTimestamp() const;
            std::string logLevelToString(LogLevel level) const;
            void log(LogLevel level, const std::string &message, const char *file = nullptr, int line = -1);
            void logJSON(const nlohmann::json &json_data);
            void startTimeSeriesLogging();
            void stopTimeSeriesLogging();
            void checkAndLogTrackedValues();
            void writeTimeSeriesDataToSD(const nlohmann::json &data);
            void writeToSDCard(const char *data);
            void readFromSDCard(char *buffer, size_t buffer_size);
            void readJSONFromSDCard(char *buffer, size_t buffer_size);
            // Add these declarations to the public section of the Logger class:

            void clearFile(const std::string &filename);
            void clearLogFile();
            void clearTimeSeriesFile();
        };

// REMOVE THIS LINE - It causes the multiple definition error
// Logger* Logger::instance = nullptr;

// Convenience macros for time series tracking (simplified API)
#define TRACK_INT(name, getter, interval_ms) insights::logging::Logger::getInstance().trackValue<int>(name, getter, "", std::chrono::milliseconds(interval_ms))
#define TRACK_FLOAT(name, getter, interval_ms) insights::logging::Logger::getInstance().trackValue<float>(name, getter, "", std::chrono::milliseconds(interval_ms))
#define TRACK_DOUBLE(name, getter, interval_ms) insights::logging::Logger::getInstance().trackValue<double>(name, getter, "", std::chrono::milliseconds(interval_ms))
#define TRACK_BOOL(name, getter, interval_ms) insights::logging::Logger::getInstance().trackValue<bool>(name, getter, "", std::chrono::milliseconds(interval_ms))
#define TRACK_STRING(name, getter, interval_ms) insights::logging::Logger::getInstance().trackValue<std::string>(name, getter, "", std::chrono::milliseconds(interval_ms))

        // For backwards compatibility
        inline void logMessage(LogLevel level, const std::string &message)
        {
            Logger::getInstance().log(level, message);
        }
    } // namespace logging
} // namespace insights

#endif // INSIGHTS_LOGGING_H
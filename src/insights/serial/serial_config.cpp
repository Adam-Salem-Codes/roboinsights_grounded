#include "insights/serial/serial_config.h"
#include "insights/logging/logging.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <string>
#include <algorithm>
#include <cctype>
#include <cstdlib>
#include "main.h"

namespace insights
{
    namespace serial
    {

        // Helper function to trim whitespace from a string
        std::string trim(const std::string &str)
        {
            auto start = std::find_if_not(str.begin(), str.end(), [](int c)
                                          { return std::isspace(c); });
            auto end = std::find_if_not(str.rbegin(), str.rend(), [](int c)
                                        { return std::isspace(c); })
                           .base();
            return (start < end) ? std::string(start, end) : std::string();
        }

        // Singleton instance getter
        SerialConfig &SerialConfig::getInstance()
        {
            static SerialConfig instance;
            return instance;
        }

        // Constructor
        SerialConfig::SerialConfig() : m_initialized(false)
        {
        }

        // Destructor
        SerialConfig::~SerialConfig()
        {
        }

        bool SerialConfig::init()
        {
            // Register default command handlers
            registerCommandHandler("ping", [this](const std::string &params)
                                   { return this->handlePingCommand(params); });

            registerCommandHandler("get_config", [this](const std::string &params)
                                   { return this->handleGetConfigCommand(params); });

            registerCommandHandler("set_config", [this](const std::string &params)
                                   { return this->handleSetConfigCommand(params); });

            m_initialized = true;

            // Send initialization message
            std::cout << "soutSerial communication initialized successfully" << std::endl;

            return true;
        }

        bool SerialConfig::isSerialInitialized() const
        {
            return m_initialized;
        }

        bool SerialConfig::checkForCommands()
        {
            if (!m_initialized)
            {
                return false;
            }

            // Use a safer approach to check for input
            // This version doesn't use in_avail() which can cause crashes
            std::string command;
            bool hasCommand = false;

            // Set cin to non-blocking mode if possible
            // Check if there's data in a safe way - just try to read one character
            if (std::cin.peek() != EOF)
            {
                // Data is available, read the command line
                std::getline(std::cin, command);
                hasCommand = true;
                std::cout << "Read command: '" << command << "'" << std::endl;
            }

            // Skip if no command or empty command
            if (!hasCommand || command.empty())
            {
                return false;
            }

            // Process the command
            std::string trimmedCommand = trim(command);
            LOG_INFO("Received command: " + trimmedCommand);
            std::cout << "Processing command: '" << trimmedCommand << "'" << std::endl;

            try
            {
                // Process the command
                std::string response = processCommand(trimmedCommand);
                std::cout << "Response: '" << response << "'" << std::endl;

                // Send the response back
                sendData(response);

                // Immediately flush the output
                std::cout.flush();

                return true;
            }
            catch (const std::exception &e)
            {
                // Log any exceptions
                std::cerr << "Error processing command: " << e.what() << std::endl;
                LOG_ERROR("Error processing command: " + std::string(e.what()));

                // Send back an error response
                sendData("ERROR: " + std::string(e.what()));
                return true; // Still count this as processed
            }
            catch (...)
            {
                std::cerr << "Unknown error processing command" << std::endl;
                LOG_ERROR("Unknown error processing command");

                // Send back a generic error response
                sendData("ERROR: Unknown error processing command");
                return true; // Still count this as processed
            }
        }

        void SerialConfig::registerCommandHandler(const std::string &command,
                                                  std::function<std::string(const std::string &)> handler)
        {
            m_commandMutex.take();
            m_commandHandlers[command] = handler;
            m_commandMutex.give();
        }

        void SerialConfig::sendData(const std::string &data)
        {
            if (!m_initialized)
            {
                return;
            }

            // Prefix with "sout" to indicate this is an output message
            // This matches the TypeScript expectations
            std::cout << "sout" << data << std::endl;
            std::cout.flush();
        }

        std::string SerialConfig::processCommand(const std::string &command)
        {
            std::string trimmedCommand = trim(command);

            // Split into command name and parameters
            std::string cmdName;
            std::string params;

            size_t spacePos = trimmedCommand.find(' ');
            if (spacePos != std::string::npos)
            {
                cmdName = trimmedCommand.substr(0, spacePos);
                params = trimmedCommand.substr(spacePos + 1);
            }
            else
            {
                cmdName = trimmedCommand;
                params = "";
            }

            // Find and execute the command handler
            std::string result;
            m_commandMutex.take();
            auto handlerIt = m_commandHandlers.find(cmdName);
            if (handlerIt != m_commandHandlers.end())
            {
                try
                {
                    result = handlerIt->second(params);
                }
                catch (const std::exception &e)
                {
                    m_commandMutex.give();
                    result = "ERROR: Exception while processing command: " + std::string(e.what());
                    return result;
                }
                catch (...)
                {
                    m_commandMutex.give();
                    result = "ERROR: Unknown exception while processing command";
                    return result;
                }
            }
            else
            {
                // Command not found
                result = "ERROR: Unknown command: " + cmdName;
            }
            m_commandMutex.give();

            return result;
        }

        std::string SerialConfig::handlePingCommand(const std::string &params)
        {
            // Add debug output to the LCD
            try
            {
                pros::lcd::print(0, "PING RECEIVED");
            }
            catch (...)
            {
                // LCD might not be initialized, fall back to console output
                std::cout << "PING RECEIVED (LCD not available)" << std::endl;
            }

            return "PONG";
        }

        std::string SerialConfig::handleGetConfigCommand(const std::string &params)
        {
            // Get the requested configuration option
            std::string option = trim(params);

            auto &logger = logging::Logger::getInstance();

            if (option == "log_level")
            {
                // We need to use the correct method to get the log level
                // Since there's no getter, we'll use a default value
                return "log_level=" + logger.logLevelToString(logging::LogLevel::INFO);
            }
            else if (option == "file_output")
            {
                // Assuming enableFileOutput sets a flag that can be checked
                return "file_output=true"; // Replace with actual check if available
            }
            else if (option == "time_series_logging")
            {
                // Assuming timeSeriesLoggingActive is accessible
                return "time_series_logging=true"; // Replace with actual check if available
            }
            else if (option == "log_filename")
            {
                return "log_filename=" + logger.getLogFileName();
            }
            else if (option == "time_series_filename")
            {
                return "time_series_filename=" + logger.getTimeSeriesFileName();
            }
            else if (option == "all")
            {
                // Return all configuration settings
                std::ostringstream oss;
                oss << "{";
                // Use a default log level since we can't get the current one
                oss << "\"log_level\":\"" << logger.logLevelToString(logging::LogLevel::INFO) << "\",";
                oss << "\"file_output\":true,";         // Replace with actual check if available
                oss << "\"time_series_logging\":true,"; // Replace with actual check if available
                oss << "\"log_filename\":\"" << logger.getLogFileName() << "\",";
                oss << "\"time_series_filename\":\"" << logger.getTimeSeriesFileName() << "\"";
                oss << "}";
                return oss.str();
            }

            return "ERROR: Unknown configuration option: " + option;
        }

        std::string SerialConfig::handleSetConfigCommand(const std::string &params)
        {
            // Parse option=value format
            size_t equalsPos = params.find('=');
            if (equalsPos == std::string::npos)
            {
                return "ERROR: Invalid format. Expected option=value";
            }

            std::string option = trim(params.substr(0, equalsPos));
            std::string value = trim(params.substr(equalsPos + 1));

            auto &logger = logging::Logger::getInstance();

            if (option == "log_level")
            {
                if (value == "DEBUG" || value == "0")
                {
                    logger.setMinLogLevel(logging::LogLevel::DEBUG);
                    return "OK: LOG_LEVEL_SET to DEBUG";
                }
                else if (value == "INFO" || value == "1")
                {
                    logger.setMinLogLevel(logging::LogLevel::INFO);
                    return "OK: LOG_LEVEL_SET to INFO";
                }
                else if (value == "WARNING" || value == "2")
                {
                    logger.setMinLogLevel(logging::LogLevel::WARNING);
                    return "OK: LOG_LEVEL_SET to WARNING";
                }
                else if (value == "ERROR" || value == "3")
                {
                    logger.setMinLogLevel(logging::LogLevel::ERROR);
                    return "OK: LOG_LEVEL_SET to ERROR";
                }
                else
                {
                    return "ERROR: Invalid log level value";
                }
            }
            else if (option == "file_output")
            {
                if (value == "true" || value == "1")
                {
                    logger.enableFileOutput(true);
                    return "OK: FILE_OUTPUT_ENABLED";
                }
                else if (value == "false" || value == "0")
                {
                    logger.enableFileOutput(false);
                    return "OK: FILE_OUTPUT_DISABLED";
                }
                else
                {
                    return "ERROR: Invalid value for file_output (expected true/false or 1/0)";
                }
            }
            else if (option == "time_series_logging")
            {
                if (value == "true" || value == "1")
                {
                    logger.startTimeSeriesLogging();
                    return "OK: TIME_SERIES_STARTED";
                }
                else if (value == "false" || value == "0")
                {
                    logger.stopTimeSeriesLogging();
                    return "OK: TIME_SERIES_STOPPED";
                }
                else
                {
                    return "ERROR: Invalid value for time_series_logging (expected true/false or 1/0)";
                }
            }
            else if (option == "log_filename")
            {
                logger.setLogFileName(value);
                return "OK: LOG_FILENAME_SET to " + value;
            }
            else if (option == "time_series_filename")
            {
                logger.setTimeSeriesFileName(value);
                return "OK: TIMESERIES_FILENAME_SET to " + value;
            }
            else if (option == "clear_log_file")
            {
                if (value == "true" || value == "1")
                {
                    logger.clearLogFile();
                    return "OK: LOG_FILE_CLEARED";
                }
                else
                {
                    return "ERROR: Invalid value for clear_log_file (expected true or 1)";
                }
            }
            else if (option == "clear_time_series_file")
            {
                if (value == "true" || value == "1")
                {
                    logger.clearTimeSeriesFile();
                    return "OK: TIMESERIES_FILE_CLEARED";
                }
                else
                {
                    return "ERROR: Invalid value for clear_time_series_file (expected true or 1)";
                }
            }
            else if (option == "sd_card_path")
            {
                logger.setSDCardPath(value);
                return "OK: SD card path set to " + value;
            }

            return "ERROR: Unknown configuration option: " + option;
        }

    } // namespace serial
} // namespace insights

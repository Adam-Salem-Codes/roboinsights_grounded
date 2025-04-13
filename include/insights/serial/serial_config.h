#ifndef INSIGHTS_SERIAL_CONFIG_H
#define INSIGHTS_SERIAL_CONFIG_H

#include <string>
#include <functional>
#include <map>
#include <atomic>
#include "pros/rtos.hpp"  // For pros::Mutex

namespace insights {
namespace serial {

/**
 * @brief Class for handling serial configuration commands from the computer
 * 
 * This class implements serial communication with the computer using std::cin and std::cout
 * rather than PROS serial API, making it suitable for USB communication.
 */
class SerialConfig {
public:
    /**
     * @brief Get the singleton instance of SerialConfig
     * 
     * @return SerialConfig& Reference to the singleton instance
     */
    static SerialConfig& getInstance();

    /**
     * @brief Initialize the serial communication
     * 
     * @return true if initialization was successful, false otherwise
     */
    bool init();

    /**
     * @brief Check if serial communication is initialized
     * 
     * @return true if initialized, false otherwise
     */
    bool isSerialInitialized() const;

    /**
     * @brief Check for incoming commands and process them
     * 
     * @return true if a command was processed, false otherwise
     */
    bool checkForCommands();

    /**
     * @brief Register a command handler for a specific command
     * 
     * @param command The command string to handle
     * @param handler The handler function to call
     */
    void registerCommandHandler(const std::string& command, 
                              std::function<std::string(const std::string&)> handler);

    /**
     * @brief Send data to the computer
     * 
     * @param data The string data to send
     */
    void sendData(const std::string& data);

private:
    SerialConfig();
    ~SerialConfig();
    
    // Prevent copying
    SerialConfig(const SerialConfig&) = delete;
    SerialConfig& operator=(const SerialConfig&) = delete;

    /**
     * @brief Process a received command
     * 
     * @param command The command string to process
     * @return The response string
     */
    std::string processCommand(const std::string& command);

    /**
     * @brief Handle ping command
     * 
     * @param params Command parameters
     * @return Response string
     */
    std::string handlePingCommand(const std::string& params);

    /**
     * @brief Handle get_config command
     * 
     * @param params Command parameters
     * @return Response string
     */
    std::string handleGetConfigCommand(const std::string& params);

    /**
     * @brief Handle set_config command
     * 
     * @param params Command parameters
     * @return Response string
     */
    std::string handleSetConfigCommand(const std::string& params);

    std::atomic<bool> m_initialized;
    std::map<std::string, std::function<std::string(const std::string&)>> m_commandHandlers;
    pros::Mutex m_commandMutex;
};

} // namespace serial
} // namespace insights

#endif // INSIGHTS_SERIAL_CONFIG_H 
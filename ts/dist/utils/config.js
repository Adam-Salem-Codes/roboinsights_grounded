"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigCommandSender = exports.LogLevel = exports.ConfigCommandType = exports.configManager = exports.ConfigManager = exports.defaultConfig = void 0;
/**
 * Default configuration values
 */
exports.defaultConfig = {
    serial: {
        baudRate: 115200,
        autoConnect: false,
        retryConnection: true,
        retryAttempts: 3,
        retryDelay: 1000,
    },
    ui: {
        showBanner: true,
        bannerText: "RoboInsights",
        theme: {
            primary: "cyan",
            secondary: "green",
            accent: "yellow",
            text: "white",
            background: "black",
        },
    },
    logging: {
        enableConsole: true,
        enableFile: false,
        filePath: "./logs/roboinsights.log",
        level: "info",
    },
};
/**
 * Configuration manager for the application
 */
class ConfigManager {
    /**
     * Create a new ConfigManager
     * @param userConfig Optional user-provided configuration to merge with defaults
     */
    constructor(userConfig = {}) {
        // Deep merge of default config with user config
        this.config = this.mergeConfigs(exports.defaultConfig, userConfig);
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Update the configuration
     * @param newConfig New configuration to merge with current
     */
    updateConfig(newConfig) {
        this.config = this.mergeConfigs(this.config, newConfig);
    }
    /**
     * Deep merge of two configuration objects
     * @param target The base configuration
     * @param source The configuration to merge on top
     * @returns Merged configuration
     */
    mergeConfigs(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach((key) => {
                const sourceValue = source[key];
                const targetKey = key;
                if (isObject(sourceValue)) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: sourceValue });
                    }
                    else {
                        // Use type assertion to handle generic constraints
                        output[targetKey] = this.mergeConfigs(target[targetKey], sourceValue);
                    }
                }
                else {
                    Object.assign(output, { [key]: sourceValue });
                }
            });
        }
        return output;
    }
}
exports.ConfigManager = ConfigManager;
/**
 * Check if a value is an object
 * @param item Value to check
 * @returns True if the value is an object
 */
function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}
// Create a singleton instance for app-wide use
exports.configManager = new ConfigManager();
/**
 * Types of configuration commands that can be sent to the VEX Brain
 */
var ConfigCommandType;
(function (ConfigCommandType) {
    ConfigCommandType["SET_LOG_LEVEL"] = "SET_LOG_LEVEL";
    ConfigCommandType["ENABLE_CONSOLE_OUTPUT"] = "ENABLE_CONSOLE_OUTPUT";
    ConfigCommandType["ENABLE_FILE_OUTPUT"] = "ENABLE_FILE_OUTPUT";
    ConfigCommandType["SET_LOG_FILENAME"] = "SET_LOG_FILENAME";
    ConfigCommandType["SET_TIMESERIES_FILENAME"] = "SET_TIMESERIES_FILENAME";
    ConfigCommandType["START_TIMESERIES_LOGGING"] = "START_TIMESERIES_LOGGING";
    ConfigCommandType["STOP_TIMESERIES_LOGGING"] = "STOP_TIMESERIES_LOGGING";
    ConfigCommandType["CLEAR_LOG_FILE"] = "CLEAR_LOG_FILE";
    ConfigCommandType["CLEAR_TIMESERIES_FILE"] = "CLEAR_TIMESERIES_FILE";
    ConfigCommandType["PING"] = "PING";
})(ConfigCommandType || (exports.ConfigCommandType = ConfigCommandType = {}));
/**
 * Log level types that match the C++ implementation
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Class for sending configuration commands to the Insights library running on the VEX Brain
 */
class ConfigCommandSender {
    /**
     * Creates a new ConfigCommandSender using an existing serial connection
     * @param serialConnection An existing BrainSerialConnection object
     */
    constructor(serialConnection) {
        this.connected = false;
        this.serialConnection = serialConnection;
        this.connected = serialConnection.isConnected;
        // Set up event listener for connection status changes
        serialConnection.on("close", () => {
            this.connected = false;
            console.log("Connection to VEX Brain closed, configuration commands disabled");
        });
    }
    /**
     * Checks if connected to the VEX Brain
     * @returns true if connected, false otherwise
     */
    isConnected() {
        return this.connected && this.serialConnection.isConnected;
    }
    /**
     * Sends a configuration command to the VEX Brain
     * @param commandType The type of command to send
     * @param params Additional parameters for the command
     * @returns Promise resolving when command is sent
     */
    async sendCommand(commandType, params = {}) {
        if (!this.isConnected()) {
            throw new Error("Not connected to VEX Brain");
        }
        try {
            console.log(`Sending command: ${commandType} with params:`, params);
            // Map old command types to our new simpler format
            switch (commandType) {
                case ConfigCommandType.PING:
                    await this.serialConnection.sendCommand("ping");
                    break;
                case ConfigCommandType.SET_LOG_LEVEL:
                    await this.serialConnection.sendCommand(`set_config log_level=${params.level}`);
                    break;
                case ConfigCommandType.ENABLE_FILE_OUTPUT:
                    await this.serialConnection.sendCommand(`set_config file_output=${params.enabled ? 'true' : 'false'}`);
                    break;
                case ConfigCommandType.SET_LOG_FILENAME:
                    await this.serialConnection.sendCommand(`set_config log_filename=${params.filename}`);
                    break;
                case ConfigCommandType.SET_TIMESERIES_FILENAME:
                    await this.serialConnection.sendCommand(`set_config time_series_filename=${params.filename}`);
                    break;
                case ConfigCommandType.START_TIMESERIES_LOGGING:
                    await this.serialConnection.sendCommand(`set_config time_series_logging=true`);
                    break;
                case ConfigCommandType.STOP_TIMESERIES_LOGGING:
                    await this.serialConnection.sendCommand(`set_config time_series_logging=false`);
                    break;
                case ConfigCommandType.CLEAR_LOG_FILE:
                    await this.serialConnection.sendCommand(`set_config clear_log_file=true`);
                    break;
                case ConfigCommandType.CLEAR_TIMESERIES_FILE:
                    await this.serialConnection.sendCommand(`set_config clear_time_series_file=true`);
                    break;
                case ConfigCommandType.ENABLE_CONSOLE_OUTPUT:
                    console.log("Console output setting is handled directly by the VEX Brain");
                    break;
                default:
                    throw new Error(`Unsupported command type: ${commandType}`);
            }
            console.log(`Command ${commandType} completed successfully`);
        }
        catch (error) {
            console.error(`Error sending command ${commandType}:`, error);
            throw error;
        }
    }
    /**
     * Sets the minimum log level
     * @param level The minimum log level to set
     * @returns Promise resolving when command is sent
     */
    async setLogLevel(level) {
        return this.sendCommand(ConfigCommandType.SET_LOG_LEVEL, { level });
    }
    /**
     * Enables or disables console output
     * @param enabled Whether console output should be enabled
     * @returns Promise resolving when command is sent
     */
    async enableConsoleOutput(enabled) {
        return this.sendCommand(ConfigCommandType.ENABLE_CONSOLE_OUTPUT, {
            enabled,
        });
    }
    /**
     * Enables or disables file output
     * @param enabled Whether file output should be enabled
     * @returns Promise resolving when command is sent
     */
    async enableFileOutput(enabled) {
        return this.sendCommand(ConfigCommandType.ENABLE_FILE_OUTPUT, { enabled });
    }
    /**
     * Sets the log filename
     * @param filename The filename to use for logging
     * @returns Promise resolving when command is sent
     */
    async setLogFileName(filename) {
        return this.sendCommand(ConfigCommandType.SET_LOG_FILENAME, { filename });
    }
    /**
     * Sets the time series log filename
     * @param filename The filename to use for time series logging
     * @returns Promise resolving when command is sent
     */
    async setTimeSeriesFileName(filename) {
        return this.sendCommand(ConfigCommandType.SET_TIMESERIES_FILENAME, {
            filename,
        });
    }
    /**
     * Starts time series logging
     * @returns Promise resolving when command is sent
     */
    async startTimeSeriesLogging() {
        return this.sendCommand(ConfigCommandType.START_TIMESERIES_LOGGING);
    }
    /**
     * Stops time series logging
     * @returns Promise resolving when command is sent
     */
    async stopTimeSeriesLogging() {
        return this.sendCommand(ConfigCommandType.STOP_TIMESERIES_LOGGING);
    }
    async clearLogFile() {
        return this.sendCommand(ConfigCommandType.CLEAR_LOG_FILE);
    }
    async clearTimeSeriesFile() {
        return this.sendCommand(ConfigCommandType.CLEAR_TIMESERIES_FILE);
    }
    async ping() {
        return this.sendCommand(ConfigCommandType.PING);
    }
    /**
     * Gets configuration settings from the VEX Brain
     * @param option The configuration option to get, or 'all' for all settings
     * @returns Promise resolving with the configuration value
     */
    async getConfigValue(option = 'all') {
        if (!this.isConnected()) {
            throw new Error("Not connected to VEX Brain");
        }
        const response = await this.serialConnection.sendCommand(`get_config ${option}`);
        return response;
    }
    /**
     * Downloads the current JSON data from the robot
     * @returns Promise resolving with the JSON data
     */
    async downloadJsonData() {
        if (!this.isConnected()) {
            throw new Error("Not connected to VEX Brain");
        }
        // This triggers the robot to send its JSON data
        await this.serialConnection.sendCommand(`get_config all`);
        return new Promise((resolve, reject) => {
            // Listen for JSON data in the next few responses
            let jsonData = "";
            let timeout;
            const dataHandler = (data) => {
                // Check if this is JSON data
                if (data.includes("{") && data.includes("}")) {
                    jsonData = data;
                    // If we have JSON data, resolve the promise
                    if (jsonData) {
                        this.serialConnection.removeListener("data", dataHandler);
                        clearTimeout(timeout);
                        resolve(jsonData);
                    }
                }
            };
            // Set a timeout for receiving the JSON data
            timeout = setTimeout(() => {
                this.serialConnection.removeListener("data", dataHandler);
                if (jsonData) {
                    resolve(jsonData); // Resolve with whatever we got
                }
                else {
                    reject(new Error("Timeout waiting for JSON data"));
                }
            }, 5000);
            // Listen for data from the robot
            this.serialConnection.on("data", dataHandler);
        });
    }
}
exports.ConfigCommandSender = ConfigCommandSender;

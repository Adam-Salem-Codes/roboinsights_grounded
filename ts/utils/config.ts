import { BrainSerialConnection } from "./serial";

/**
 * Configuration options for the RoboInsights application
 */
export interface AppConfig {
  /** Serial port settings */
  serial: {
    /** Default baud rate for VEX Brain communication */
    baudRate: number;
    /** Auto-connect to the first available port if true */
    autoConnect: boolean;
    /** Retry connection if it fails */
    retryConnection: boolean;
    /** Number of connection retry attempts */
    retryAttempts: number;
    /** Delay between retry attempts in milliseconds */
    retryDelay: number;
  };
  /** User interface settings */
  ui: {
    /** Show the application banner on startup */
    showBanner: boolean;
    /** The text to display in the banner */
    bannerText: string;
    /** Theme colors */
    theme: {
      /** Primary color (used for titles, banners) */
      primary: string;
      /** Secondary color (used for selections, highlights) */
      secondary: string;
      /** Accent color (used for cursors, buttons) */
      accent: string;
      /** Text color */
      text: string;
      /** Background color for boxed elements */
      background: string;
    };
  };
  /** Logging settings */
  logging: {
    /** Enable logging to console */
    enableConsole: boolean;
    /** Enable logging to file */
    enableFile: boolean;
    /** Log file path */
    filePath: string;
    /** Log level (debug, info, warn, error) */
    level: "debug" | "info" | "warn" | "error";
  };
}

/**
 * Default configuration values
 */
export const defaultConfig: AppConfig = {
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
export class ConfigManager {
  private config: AppConfig;

  /**
   * Create a new ConfigManager
   * @param userConfig Optional user-provided configuration to merge with defaults
   */
  constructor(userConfig: Partial<AppConfig> = {}) {
    // Deep merge of default config with user config
    this.config = this.mergeConfigs(defaultConfig, userConfig);
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Update the configuration
   * @param newConfig New configuration to merge with current
   */
  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = this.mergeConfigs(this.config, newConfig);
  }

  /**
   * Deep merge of two configuration objects
   * @param target The base configuration
   * @param source The configuration to merge on top
   * @returns Merged configuration
   */
  private mergeConfigs<T extends Record<string, any>>(
    target: T,
    source: Partial<T>
  ): T {
    const output = { ...target } as T;

    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key as keyof typeof source];
        const targetKey = key as keyof typeof target;

        if (isObject(sourceValue)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: sourceValue });
          } else {
            // Use type assertion to handle generic constraints
            output[targetKey] = this.mergeConfigs(
              target[targetKey] as Record<string, any>,
              sourceValue as Record<string, any>
            ) as any;
          }
        } else {
          Object.assign(output, { [key]: sourceValue });
        }
      });
    }

    return output;
  }
}

/**
 * Check if a value is an object
 * @param item Value to check
 * @returns True if the value is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item);
}

// Create a singleton instance for app-wide use
export const configManager = new ConfigManager();

/**
 * Types of configuration commands that can be sent to the VEX Brain
 */
export enum ConfigCommandType {
  SET_LOG_LEVEL = "SET_LOG_LEVEL",
  ENABLE_CONSOLE_OUTPUT = "ENABLE_CONSOLE_OUTPUT",
  ENABLE_FILE_OUTPUT = "ENABLE_FILE_OUTPUT",
  SET_LOG_FILENAME = "SET_LOG_FILENAME",
  SET_TIMESERIES_FILENAME = "SET_TIMESERIES_FILENAME",
  START_TIMESERIES_LOGGING = "START_TIMESERIES_LOGGING",
  STOP_TIMESERIES_LOGGING = "STOP_TIMESERIES_LOGGING",
  CLEAR_LOG_FILE = "CLEAR_LOG_FILE",
  CLEAR_TIMESERIES_FILE = "CLEAR_TIMESERIES_FILE",
  PING = "PING",
}

/**
 * Log level types that match the C++ implementation
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

/**
 * Class for sending configuration commands to the Insights library running on the VEX Brain
 */
export class ConfigCommandSender {
  private serialConnection: BrainSerialConnection;
  private connected: boolean = false;

  /**
   * Creates a new ConfigCommandSender using an existing serial connection
   * @param serialConnection An existing BrainSerialConnection object
   */
  constructor(serialConnection: BrainSerialConnection) {
    this.serialConnection = serialConnection;
    this.connected = serialConnection.isConnected;

    // Set up event listener for connection status changes
    serialConnection.on("close", () => {
      this.connected = false;
      console.log(
        "Connection to VEX Brain closed, configuration commands disabled"
      );
    });
  }

  /**
   * Checks if connected to the VEX Brain
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected && this.serialConnection.isConnected;
  }

  /**
   * Sends a configuration command to the VEX Brain
   * @param commandType The type of command to send
   * @param params Additional parameters for the command
   * @returns Promise resolving when command is sent
   */
  async sendCommand(
    commandType: ConfigCommandType,
    params: any = {}
  ): Promise<void> {
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
    } catch (error) {
      console.error(`Error sending command ${commandType}:`, error);
      throw error;
    }
  }

  /**
   * Sets the minimum log level
   * @param level The minimum log level to set
   * @returns Promise resolving when command is sent
   */
  async setLogLevel(level: LogLevel): Promise<void> {
    return this.sendCommand(ConfigCommandType.SET_LOG_LEVEL, { level });
  }

  /**
   * Enables or disables console output
   * @param enabled Whether console output should be enabled
   * @returns Promise resolving when command is sent
   */
  async enableConsoleOutput(enabled: boolean): Promise<void> {
    return this.sendCommand(ConfigCommandType.ENABLE_CONSOLE_OUTPUT, {
      enabled,
    });
  }

  /**
   * Enables or disables file output
   * @param enabled Whether file output should be enabled
   * @returns Promise resolving when command is sent
   */
  async enableFileOutput(enabled: boolean): Promise<void> {
    return this.sendCommand(ConfigCommandType.ENABLE_FILE_OUTPUT, { enabled });
  }

  /**
   * Sets the log filename
   * @param filename The filename to use for logging
   * @returns Promise resolving when command is sent
   */
  async setLogFileName(filename: string): Promise<void> {
    return this.sendCommand(ConfigCommandType.SET_LOG_FILENAME, { filename });
  }

  /**
   * Sets the time series log filename
   * @param filename The filename to use for time series logging
   * @returns Promise resolving when command is sent
   */
  async setTimeSeriesFileName(filename: string): Promise<void> {
    return this.sendCommand(ConfigCommandType.SET_TIMESERIES_FILENAME, {
      filename,
    });
  }

  /**
   * Starts time series logging
   * @returns Promise resolving when command is sent
   */
  async startTimeSeriesLogging(): Promise<void> {
    return this.sendCommand(ConfigCommandType.START_TIMESERIES_LOGGING);
  }

  /**
   * Stops time series logging
   * @returns Promise resolving when command is sent
   */
  async stopTimeSeriesLogging(): Promise<void> {
    return this.sendCommand(ConfigCommandType.STOP_TIMESERIES_LOGGING);
  }

  async clearLogFile(): Promise<void> {
    return this.sendCommand(ConfigCommandType.CLEAR_LOG_FILE);
  }

  async clearTimeSeriesFile(): Promise<void> {
    return this.sendCommand(ConfigCommandType.CLEAR_TIMESERIES_FILE);
  }

  async ping(): Promise<void> {
    return this.sendCommand(ConfigCommandType.PING);
  }

  /**
   * Gets configuration settings from the VEX Brain
   * @param option The configuration option to get, or 'all' for all settings
   * @returns Promise resolving with the configuration value
   */
  async getConfigValue(option: string = 'all'): Promise<string> {
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
  async downloadJsonData(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }
    
    // This triggers the robot to send its JSON data
    await this.serialConnection.sendCommand(`get_config all`);
    
    return new Promise((resolve, reject) => {
      // Listen for JSON data in the next few responses
      let jsonData = "";
      let timeout: NodeJS.Timeout;
      
      const dataHandler = (data: string) => {
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
        } else {
          reject(new Error("Timeout waiting for JSON data"));
        }
      }, 5000);
      
      // Listen for data from the robot
      this.serialConnection.on("data", dataHandler);
    });
  }
}

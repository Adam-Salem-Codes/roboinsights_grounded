import { SerialPort } from "serialport";
import chalk from "chalk";
import * as path from "path";
import * as fs from "fs";

// Add a mock mode for running without hardware
let MOCK_MODE = false;

// Mock implementation of SerialPort for when hardware is unavailable
class MockSerialPort {
  private path: string;
  private baudRate: number;
  private isOpen: boolean = false;
  private eventHandlers: Record<string, Array<Function>> = {
    data: [],
    error: [],
    close: [],
  };

  constructor(options: any) {
    this.path = options.path;
    this.baudRate = options.baudRate || 9600;
    console.log(
      `[MOCK] Creating serial port ${this.path} at ${this.baudRate} baud`
    );
  }

  open(callback: (error?: Error) => void): void {
    setTimeout(() => {
      this.isOpen = true;
      console.log(`[MOCK] Opened port ${this.path}`);
      callback();

      // Simulate receiving data every few seconds
      this.simulateData();
    }, 500);
  }

  write(data: string, callback: (error?: Error) => void): void {
    console.log(`[MOCK] Writing to port: ${data.trim()}`);
    callback();
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  close(): void {
    this.isOpen = false;
    console.log(`[MOCK] Closed port ${this.path}`);
    this.eventHandlers.close.forEach((handler) => handler());
  }

  private simulateData(): void {
    if (!this.isOpen) return;

    const messages = [
      "soutSensor reading: 42",
      "soutMotor temperature: 35C",
      "soutBattery status: 75%",
      "soutSystem status: OK",
    ];

    setTimeout(() => {
      if (!this.isOpen) return;

      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      this.eventHandlers.data.forEach((handler) =>
        handler(Buffer.from(randomMessage))
      );

      // Schedule next message
      this.simulateData();
    }, 3000 + Math.random() * 5000); // Random interval between 3-8 seconds
  }
}

// Check if we can access the real SerialPort module or need to use the mock
try {
  // Try to list ports to see if the real module works
  SerialPort.list();
} catch (error) {
  console.log(
    chalk.yellow(
      "Native serialport module not available, switching to simulation mode"
    )
  );
  console.log(
    chalk.cyan("In simulation mode, no real hardware connections will be made")
  );
  MOCK_MODE = true;
}

// Helper function for resolving binary paths when packaged with pkg
function getSerialportBinaryPath(): string {
  // Check if running from a packaged executable using __dirname check
  const isPackaged = !__dirname.includes("node_modules");

  if (isPackaged) {
    // Running from a packaged executable
    return path.join(
      path.dirname(process.execPath),
      "serialport",
      "build",
      "Release"
    );
  }
  // Running normally from node
  return "";
}

// Set the binary path for serialport if running from packaged executable
const isPackaged = !__dirname.includes("node_modules");
if (isPackaged) {
  // Tell serialport where to find its binary
  process.env.SERIALPORT_BINARY_PATH = getSerialportBinaryPath();
}

/**
 * Lists all available serial ports.
 * @returns Promise resolving to an array of port objects with formatted names for display
 */
export async function listSerialPorts(): Promise<
  {
    displayName: string;
    path: string;
    manufacturer: string | undefined;
  }[]
> {
  try {
    if (MOCK_MODE) {
      // Return mock ports in simulation mode
      return [
        {
          displayName: "COM3 - VEX V5 Brain (Simulated)",
          path: "COM3",
          manufacturer: "VEX Robotics",
        },
        {
          displayName: "COM4 - USB Serial Device (Simulated)",
          path: "COM4",
          manufacturer: "FTDI",
        },
      ];
    }

    const ports = await SerialPort.list();
    return ports.map((port) => ({
      displayName: `${port.path} - ${port.manufacturer || "Unknown"}`,
      path: port.path,
      manufacturer: port.manufacturer,
    }));
  } catch (error) {
    console.error("Error listing serial ports:", error);
    return [];
  }
}

/**
 * Cleans up the received data from the VEX Brain by removing unwanted patterns.
 * @param data The raw data received from the Brain.
 * @returns The cleaned-up data.
 */
export function cleanOutput(data: string): string {
  // Handle common issues with JSON data from VEX Brain
  let cleaned = data;

  // Remove all occurrences of "[some-character]sout" from the data
  cleaned = cleaned.replace(/[^\w\s]*sout/g, "");

  // Remove non-printable characters and control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // Remove unexpected symbols often found in serial data
  cleaned = cleaned.replace(/[♂♀]/g, "");

  // Remove line numbers that appear at beginning of lines (e.g., "{9")
  cleaned = cleaned.replace(/\{\s*\d+\s*/g, "{");
  cleaned = cleaned.replace(/\[\s*\d+\s*/g, "[");

  // Fix spacing around JSON syntax elements
  cleaned = cleaned.replace(/\s+}/g, " }").replace(/}\s+/g, "} ");
  cleaned = cleaned.replace(/\s+{/g, " {").replace(/{\s+/g, "{ ");
  cleaned = cleaned.replace(/\s+]/g, " ]").replace(/]\s+/g, "] ");
  cleaned = cleaned.replace(/\s+\[/g, " [").replace(/\[\s+/g, "[ ");

  // Fix VEX Brain specific patterns - remove "Read from SD card:" prefix
  if (cleaned.includes("Read from SD card:")) {
    const startIdx = cleaned.indexOf("{");
    if (startIdx !== -1) {
      cleaned = cleaned.substring(startIdx);
    }
  }

  return cleaned.trim();
}

/**
 * Detects if a string contains valid JSON
 * @param str String to check for JSON content
 * @returns The extracted JSON string or null if not found
 */
export function extractJSON(str: string): string | null {
  try {
    // First attempt: look for complete JSON objects
    const jsonPattern = /\{[\s\S]*\}/g;
    const matches = str.match(jsonPattern);

    if (matches && matches.length > 0) {
      // Try to parse each match to find valid JSON
      for (const match of matches) {
        try {
          // Attempt to clean and parse
          const cleaned = cleanOutput(match);
          JSON.parse(cleaned);
          return cleaned; // If parsing succeeded, return this match
        } catch (e) {
          // This match wasn't valid JSON, continue to the next
          continue;
        }
      }
    }

    // Second attempt: Try to extract from specific VEX Brain format
    // Looking for patterns like "Read from SD card: {...}"
    const sdCardPattern = /Read from SD card:\s*(\{[\s\S]*\})/;
    const sdCardMatch = str.match(sdCardPattern);

    if (sdCardMatch && sdCardMatch[1]) {
      const jsonCandidate = cleanOutput(sdCardMatch[1]);
      try {
        JSON.parse(jsonCandidate);
        return jsonCandidate;
      } catch (e) {
        // Not valid JSON
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Attempts to parse a string as JSON and returns a validated, formatted JSON string
 * @param jsonString String potentially containing JSON
 * @returns Formatted JSON string if valid, null otherwise
 */
export function formatJSON(jsonString: string): string | null {
  try {
    // Parse and re-stringify to ensure proper formatting
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    return null;
  }
}

/**
 * Saves JSON data to a file
 * @param jsonData The JSON data to save
 * @param fileName Optional filename (defaults to timestamp-based name)
 * @returns Promise resolving to the path where file was saved
 */
export async function saveJSONToFile(
  jsonData: string,
  fileName?: string
): Promise<string> {
  try {
    // Create a folder for downloaded data if it doesn't exist
    const dataDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate filename if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultName = `vex_data_${timestamp}.json`;
    const fullFileName = fileName || defaultName;

    // Ensure .json extension
    const finalFileName = fullFileName.endsWith(".json")
      ? fullFileName
      : `${fullFileName}.json`;

    const filePath = path.join(dataDir, finalFileName);

    // Write file
    fs.writeFileSync(filePath, jsonData, "utf8");
    return filePath;
  } catch (error) {
    console.error("Error saving JSON file:", error);
    throw error;
  }
}

/**
 * Serial communication interface for VEX Brain
 */
export class BrainSerialConnection {
  private port: any = null; // Using 'any' to support both real and mock ports
  private _isConnected: boolean = false;
  private _listeners: { [event: string]: Function[] } = {
    data: [],
    error: [],
    close: [],
  };
  private commandPromises: Map<
    string,
    { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
  > = new Map();

  /**
   * Check if the connection is currently active
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Connect to the VEX V5 Brain on the given port.
   * @param portPath The path to the port (e.g., 'COM6').
   * @returns Promise resolving when connection is established
   */
  async connect(portPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to VEX Brain on port: ${portPath}`);

        // Create a serial port instance (real or mock)
        if (MOCK_MODE) {
          this.port = new MockSerialPort({
            path: portPath,
            baudRate: 115200,
          });
        } else {
          this.port = new SerialPort({
            path: portPath,
            baudRate: 115200, // Baud rate for VEX V5 communication
            autoOpen: false, // Do not open immediately
          });
        }

        // Open the port
        this.port.open((err?: Error) => {
          if (err) {
            console.error("Error opening port:", err.message);
            reject(err);
            return;
          }
          this._isConnected = true;
          console.log(`Successfully connected to VEX Brain on ${portPath}`);
          resolve();
        });

        // Listen for data from the Brain
        this.port.on("data", (data: Buffer | string) => {
          const rawData = data.toString();
          
          // Log all received data for debugging
          console.log("Raw data received:", rawData);
          
          // The C++ implementation prefixes all output with "sout"
          // Check if this is a message from our C++ code
          if (rawData.includes("sout")) {
            // Remove the sout prefix and cleanup data
            const prefixRemoved = rawData.replace(/sout/g, "");
            const cleanedData = cleanOutput(prefixRemoved);
            
            // Log the cleaned data for debugging
            console.log("Cleaned data from VEX Brain:", cleanedData);
            
            // Check for specific ping responses - the C++ code sends back just "PONG"
            // and we prefix it with "sout", so we might get "soutPONG"
            if (rawData.includes("soutPONG")) {
              console.log("Detected direct PONG response");
              // Handle any pending ping commands
              const promise = this.commandPromises.get("ping");
              if (promise) {
                console.log("Resolving ping command directly");
                clearTimeout(promise.timeout);
                promise.resolve("PONG");
                this.commandPromises.delete("ping");
              }
            }
            
            // Check if this is a response to a command
            this.handleCommandResponse(cleanedData);
            
            // Notify all registered data listeners
            this._listeners.data.forEach((listener) => listener(cleanedData));
          } else {
            // For regular data that doesn't have our prefix
            const cleanedData = cleanOutput(rawData);
            console.log("Regular data received:", cleanedData);
            this._listeners.data.forEach((listener) => listener(cleanedData));
          }
        });

        // Handle port errors
        this.port.on("error", (err: Error) => {
          console.error("Serial port error:", err.message);
          this._listeners.error.forEach((listener) => listener(err));
        });

        // Close the port gracefully
        this.port.on("close", () => {
          console.log("Serial port closed.");
          this._isConnected = false;
          this._listeners.close.forEach((listener) => listener());
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle responses to commands
   * @param data The received data
   */
  private handleCommandResponse(data: string): void {
    console.log("Checking for command response in:", data);

    // Check for error responses
    if (data.includes("ERROR:")) {
      console.log("Found ERROR response");
      // Find all pending promises and reject them with the error
      this.commandPromises.forEach((promise, commandType) => {
        console.log(`Rejecting command ${commandType} with error`);
        clearTimeout(promise.timeout);
        promise.reject(new Error(data));
        this.commandPromises.delete(commandType);
      });
      return;
    }

    // Handle ping response - look for exact PONG response or one that contains PONG
    if (data === "PONG" || data.includes("PONG")) {
      console.log("Found PONG response");
      const promise = this.commandPromises.get("ping");
      if (promise) {
        console.log("Resolving ping command");
        clearTimeout(promise.timeout);
        promise.resolve(data);
        this.commandPromises.delete("ping");
        return;
      }
    }

    // Handle get_config responses
    if (data.includes("log_level=") || 
        data.includes("file_output=") || 
        data.includes("time_series_logging=") || 
        data.includes("log_filename=") || 
        data.includes("{") /* JSON response */) {
      console.log("Found get_config response");
      const promise = this.commandPromises.get("get_config");
      if (promise) {
        console.log("Resolving get_config command");
        clearTimeout(promise.timeout);
        promise.resolve(data);
        this.commandPromises.delete("get_config");
        return;
      }
    }

    // Handle set_config responses by checking for specific response patterns
    const setConfigPatterns = [
      { pattern: "LOG_LEVEL_SET", commandType: "set_config_log_level" },
      { pattern: "FILE_OUTPUT_ENABLED", commandType: "set_config_file_output" },
      { pattern: "FILE_OUTPUT_DISABLED", commandType: "set_config_file_output" },
      { pattern: "TIME_SERIES_STARTED", commandType: "set_config_time_series_logging" },
      { pattern: "TIME_SERIES_STOPPED", commandType: "set_config_time_series_logging" },
      { pattern: "LOG_FILENAME_SET", commandType: "set_config_log_filename" },
      { pattern: "TIMESERIES_FILENAME_SET", commandType: "set_config_time_series_filename" },
      { pattern: "LOG_FILE_CLEARED", commandType: "set_config_clear_log_file" },
      { pattern: "TIMESERIES_FILE_CLEARED", commandType: "set_config_clear_time_series_file" }
    ];

    // Check each specific pattern
    for (const { pattern, commandType } of setConfigPatterns) {
      if (data.includes(pattern)) {
        console.log(`Found pattern ${pattern} for command ${commandType}`);
        const promise = this.commandPromises.get(commandType);
        if (promise) {
          console.log(`Resolving ${commandType} command`);
          clearTimeout(promise.timeout);
          promise.resolve(data);
          this.commandPromises.delete(commandType);
          return;
        }
      }
    }

    // General "OK:" response for any set_config command
    if (data.includes("OK:")) {
      console.log("Found general OK response");
      // Check all set_config commands
      for (const [commandType, promise] of this.commandPromises.entries()) {
        if (commandType.startsWith("set_config")) {
          console.log(`Resolving general set_config command: ${commandType}`);
          clearTimeout(promise.timeout);
          promise.resolve(data);
          this.commandPromises.delete(commandType);
          return;
        }
      }
    }

    // If we get here and there are still pending commands, check if this is a response
    // to any of them based on keyword matching
    if (this.commandPromises.size > 0) {
      console.log(`Still have ${this.commandPromises.size} pending commands, trying keyword matching`);
      for (const [commandType, promise] of this.commandPromises.entries()) {
        // Check if the response contains the command type keyword
        // Convert to lowercase for case-insensitive matching
        const lowercaseData = data.toLowerCase();
        const lowercaseCommandType = commandType.toLowerCase();
        
        if (lowercaseData.includes(lowercaseCommandType) || 
            // Special case for set_config commands to match their subsections
            (commandType.startsWith("set_config_") && 
             lowercaseData.includes(commandType.substring(11).toLowerCase()))) {
          console.log(`Found keyword match for ${commandType}`);
          clearTimeout(promise.timeout);
          promise.resolve(data);
          this.commandPromises.delete(commandType);
          return;
        }
      }
      
      // If we still have pending commands and can't match them, just resolve the first one
      // This is a fallback to prevent timeouts when responses don't match expected patterns
      if (this.commandPromises.size > 0) {
        console.log("No specific match found, resolving oldest pending command as fallback");
        // Get the first entry from the Map using Array.from to convert entries to an array
        const entries = Array.from(this.commandPromises.entries());
        if (entries.length > 0) {
          const [commandType, promise] = entries[0];
          clearTimeout(promise.timeout);
          promise.resolve(data);
          this.commandPromises.delete(commandType);
        }
      }
    }
  }

  /**
   * Send a command to the VEX Brain and wait for a response
   * @param command The command to send
   * @returns Promise resolving with the response or rejecting with an error
   */
  async sendCommand(command: string): Promise<string> {
    if (!this.port || !this._isConnected) {
      throw new Error("Not connected to VEX Brain");
    }

    return new Promise((resolve, reject) => {
      // Extract command name for tracking purposes
      let commandType = "unknown";
      
      try {
        console.log(`Sending command to VEX Brain: ${command}`);
        
        // Handle different command formats
        if (command.includes("ping")) {
          commandType = "ping";
          console.log("Detected ping command, setting commandType to 'ping'");
        } else if (command.includes("get_config")) {
          commandType = "get_config";
        } else if (command.includes("set_config")) {
          commandType = "set_config";
          // Try to extract the option being set for better tracking
          const optionMatch = command.match(/set_config\s+([a-z_]+)=/i);
          if (optionMatch && optionMatch[1]) {
            commandType = `set_config_${optionMatch[1]}`;
          }
        } else {
          // Try to parse JSON commands
          try {
            const parsed = JSON.parse(command);
            if (parsed.command) {
              commandType = parsed.command;
            }
          } catch (e) {
            // If not JSON, use as is
            commandType = command.split(" ")[0];
          }
        }

        console.log(`Command type identified as: ${commandType}`);

        // Set a timeout for command response - increased to 10 seconds for reliability
        const timeoutHandle = setTimeout(() => {
          this.commandPromises.delete(commandType);
          console.error(`Command timed out: ${command}`);
          reject(new Error(`Command timed out: ${command}`));
        }, 10000); // 10 second timeout

        // Store the promise handlers
        this.commandPromises.set(commandType, {
          resolve: (data: string) => {
            console.log(`Received response for ${commandType}: ${data}`);
            clearTimeout(timeoutHandle);
            resolve(data);
          },
          reject: (err: Error) => {
            console.error(`Error for ${commandType}: ${err.message}`);
            clearTimeout(timeoutHandle);
            reject(err);
          },
          timeout: timeoutHandle,
        });

        // Write the command to the serial port with a newline
        const commandWithNewline = command.endsWith('\n') ? command : command + '\n';
        this.port.write(commandWithNewline, (err?: Error) => {
          if (err) {
            console.error(`Error sending command: ${err.message}`);
            clearTimeout(timeoutHandle);
            this.commandPromises.delete(commandType);
            reject(err);
          } else {
            console.log(`Command sent successfully: ${command}`);
          }
        });
      } catch (error) {
        console.error(`Exception in sendCommand: ${error}`);
        this.commandPromises.delete(commandType);
        reject(error);
      }
    });
  }

  /**
   * Register an event listener for connection events
   * @param event The event to listen for ('data', 'error', 'close')
   * @param callback The callback function to call when the event occurs
   */
  on(event: "data" | "error" | "close", callback: Function): void {
    if (this._listeners[event]) {
      this._listeners[event].push(callback);
    }
  }

  /**
   * Remove an event listener for connection events
   * @param event The event to remove the listener from ('data', 'error', 'close')
   * @param callback The callback function to remove
   */
  removeListener(event: "data" | "error" | "close", callback: Function): void {
    if (this._listeners[event]) {
      const index = this._listeners[event].indexOf(callback);
      if (index !== -1) {
        this._listeners[event].splice(index, 1);
      }
    }
  }

  /**
   * Disconnect from the VEX Brain
   */
  disconnect(): void {
    if (this.port && this._isConnected) {
      this.port.close();
      this.port = null;
      this._isConnected = false;
    }
  }
}

import { BrainSerialConnection } from './serial';

/**
 * Class for reading configuration values from the VEX Brain
 */
export class ConfigReader {
  private serialConnection: BrainSerialConnection;

  constructor(serialConnection: BrainSerialConnection) {
    this.serialConnection = serialConnection;
  }

  /**
   * Check if connected to VEX Brain
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.serialConnection.isConnected;
  }

  /**
   * Send a ping command to the VEX Brain to test connectivity
   * @param retries Number of times to retry on failure (default: 1)
   * @returns Promise resolving to true if ping was successful
   */
  async ping(retries: number = 1): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retries) {
      try {
        console.log(`Ping attempt ${attempt + 1}/${retries + 1}`);
        const response = await this.serialConnection.sendCommand("ping");
        console.log("Ping response:", response);
        
        // Check if response contains PONG (case insensitive)
        if (response && response.toUpperCase().includes("PONG")) {
          console.log("Ping successful");
          return true;
        } else {
          console.warn(`Unexpected ping response: ${response}`);
          // Continue to retry if response is not PONG
          lastError = new Error(`Unexpected ping response: ${response}`);
        }
      } catch (error) {
        console.error(`Error pinging VEX Brain (attempt ${attempt + 1}/${retries + 1}):`, error);
        lastError = error as Error;
      }
      
      // Increment attempt counter
      attempt++;
      
      // Wait before retrying
      if (attempt <= retries) {
        console.log(`Waiting before ping retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we get here, all attempts failed
    if (lastError) {
      throw lastError;
    }
    
    return false;
  }

  /**
   * Get the current log level from the VEX Brain
   * @returns Promise resolving to the current log level
   */
  async getLogLevel(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    try {
      const response = await this.serialConnection.sendCommand("get_config log_level");
      console.log("Log level response:", response);
      return response;
    } catch (error) {
      console.error("Error getting log level:", error);
      throw error;
    }
  }

  /**
   * Get the current log filename from the VEX Brain
   * @returns Promise resolving to the current log filename
   */
  async getLogFilename(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    try {
      const response = await this.serialConnection.sendCommand("get_config log_filename");
      console.log("Log filename response:", response);
      return response;
    } catch (error) {
      console.error("Error getting log filename:", error);
      throw error;
    }
  }

  /**
   * Get the current timeseries filename from the VEX Brain
   * @returns Promise resolving to the current timeseries filename
   */
  async getTimeseriesFilename(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    try {
      const response = await this.serialConnection.sendCommand("get_config time_series_filename");
      console.log("Timeseries filename response:", response);
      return response;
    } catch (error) {
      console.error("Error getting timeseries filename:", error);
      throw error;
    }
  }

  /**
   * Get whether file output is enabled on the VEX Brain
   * @returns Promise resolving to whether file output is enabled
   */
  async isFileOutputEnabled(): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    try {
      const response = await this.serialConnection.sendCommand("get_config file_output");
      console.log("File output response:", response);
      return response.toLowerCase() === "true";
    } catch (error) {
      console.error("Error getting file output status:", error);
      throw error;
    }
  }

  /**
   * Get whether timeseries logging is currently active on the VEX Brain
   * @returns Promise resolving to whether timeseries logging is active
   */
  async isTimeseriesLoggingActive(): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error("Not connected to VEX Brain");
    }

    try {
      const response = await this.serialConnection.sendCommand("get_config time_series_logging");
      console.log("Timeseries logging response:", response);
      return response.toLowerCase() === "true";
    } catch (error) {
      console.error("Error getting timeseries logging status:", error);
      throw error;
    }
  }
} 
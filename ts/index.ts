// Add these lines at the top of the file, before any other imports
// This ensures proper handling of process.stdin when packaged with pkg
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

import chalk from "chalk";
import {
  listSerialPorts,
  BrainSerialConnection,
  extractJSON,
  formatJSON,
  saveJSONToFile,
  cleanOutput,
} from "./utils/serial";
import { cliSelect, displayBrandedMessage } from "./utils/cli";
import { configManager } from "./utils/config";
import * as readline from "readline";
import * as figlet from "figlet";
import * as path from "path";
import * as fs from "fs";
import boxen from "boxen";

// Define a custom interface that extends boxen's Options
interface ExtendedBoxenOptions extends boxen.Options {
  width?: number;
}

// Global flag to track if we're currently showing a popup
let isShowingPopup = false;

// Helper function to resolve paths when packaged with pkg
function resolveAssetPath(relativePath: string): string {
  // When packaged with pkg, __dirname refers to the location inside the snapshot
  const isPackaged = !__dirname.includes("node_modules");

  if (isPackaged) {
    // For packaged app, use process.execPath (executable location)
    return path.join(path.dirname(process.execPath), relativePath);
  } else {
    // For development, use regular path resolution
    return path.join(__dirname, relativePath);
  }
}

/**
 * Prints the RoboInsights ASCII art logo at startup
 */
function printRoboInsightsLogo(): void {
  console.clear();
  console.log("\n"); // Add some spacing at the top

  // Multiline string for the complete logo with VEX Brain Connection text
  const logoText = `
██████╗  ██████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗██╗ ██████╗ ██╗  ██╗████████╗███████╗
██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗██║████╗  ██║██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝██╔════╝
██████╔╝██║   ██║██████╔╝██║   ██║██║██╔██╗ ██║███████╗██║██║  ███╗███████║   ██║   ███████╗
██╔══██╗██║   ██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║██║██║   ██║██╔══██║   ██║   ╚════██║
██║  ██║╚██████╔╝██████╔╝╚██████╔╝██║██║ ╚████║███████║██║╚██████╔╝██║  ██║   ██║   ███████║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
                       VEX Brain Connection Utility
`;

  // Split by lines and apply gradient colors
  const lines = logoText.split("\n");
  const colors = ["red", "yellow", "green", "cyan", "blue", "magenta"];

  lines.forEach((line, i) => {
    if (!line.trim()) return; // Skip empty lines

    const colorIndex = i % colors.length;
    const colorName = colors[colorIndex];
    // @ts-ignore - Dynamic access to chalk colors
    console.log(chalk[colorName](line));
  });

  console.log("\n"); // Add spacing after the logo
  console.log(chalk.bold.cyan("=".repeat(80)));
  console.log(chalk.bold.gray("  Version 1.0.0"));
  console.log(chalk.bold.cyan("=".repeat(80)));
  console.log("\n"); // Add more spacing at the bottom
}

/**
 * Terminal UI manager that maintains data view at top and menu at bottom
 */
class TerminalUI {
  private dataBuffer: string[] = [];
  private jsonBuffer: string = "";
  private hasValidJSON: boolean = false;
  private jsonNotificationShown: boolean = false;
  private maxDataLines: number = 20; // Maximum number of data lines to show
  private menuVisible: boolean = false;
  private activeMenu: string = "";
  private terminalHeight: number;
  private readonly headerHeight: number = 3; // Fixed height for header
  private readonly footerHeight: number = 2; // Fixed height for footer

  constructor() {
    // Get terminal dimensions
    this.terminalHeight = process.stdout.rows || 24;

    // Listen for terminal resize events
    process.stdout.on("resize", () => {
      this.terminalHeight = process.stdout.rows || 24;
      if (this.menuVisible) {
        this.render();
      }
    });
  }

  /**
   * Add a line of data to the buffer
   * @param data The data line to add
   */
  addData(data: string): void {
    // Format the data for better readability
    let formattedData = this.formatDataLine(data);

    // Add formatted data to buffer
    this.dataBuffer.push(formattedData);

    // Check if data contains JSON
    this.checkForJSON(data);

    // Keep buffer at max size
    while (this.dataBuffer.length > 500) {
      this.dataBuffer.shift();
    }

    // Re-render if menu is visible
    if (this.menuVisible) {
      this.render();
    } else {
      // Just print the line if no menu is active
      console.log(formattedData);
    }
  }

  /**
   * Format a data line for better readability
   * @param data The raw data line
   * @returns Formatted data line
   */
  private formatDataLine(data: string): string {
    // Extract "Data from VEX Brain: " prefix
    const brainDataPrefix = "Data from VEX Brain: ";
    if (data.startsWith(brainDataPrefix)) {
      const content = data.substring(brainDataPrefix.length);

      // Format log lines with timestamps
      const logPattern = /\[([\d-]+ [\d:]+)\] \[([A-Z]+)\] (.*)/;
      const logMatch = content.match(logPattern);

      if (logMatch) {
        const [, timestamp, level, message] = logMatch;

        // Color-code based on log level
        let levelColor;
        switch (level) {
          case "INFO":
            levelColor = chalk.blue;
            break;
          case "WARN":
            levelColor = chalk.yellow;
            break;
          case "ERROR":
            levelColor = chalk.red;
            break;
          default:
            levelColor = chalk.white;
        }

        return `${chalk.green(brainDataPrefix)}${chalk.gray(
          timestamp
        )} ${levelColor(level)} ${chalk.white(message)}`;
      }

      // Check for "Read from SD card:" JSON data
      if (content.startsWith("Read from SD card:")) {
        return (
          chalk.green(brainDataPrefix) +
          chalk.yellow("JSON data received from SD card")
        );
      }

      // Default formatting for other messages
      return chalk.green(brainDataPrefix) + chalk.white(content);
    }

    // Non-Brain messages
    return data;
  }

  /**
   * Check if a data line contains JSON and process it
   * @param data The data line to check
   */
  private checkForJSON(data: string): void {
    // Look for specific patterns that indicate JSON data
    if (data.includes("Read from SD card:") || data.includes("motor_voltage")) {
      this.showDirectJsonPrompt(data);
    }
  }

  /**
   * Directly show a JSON data prompt when we detect JSON in a message
   */
  async showDirectJsonPrompt(data: string): Promise<void> {
    // Skip if already showing a popup
    if (isShowingPopup) return;

    try {
      // Set the global flag
      isShowingPopup = true;

      // Try to extract JSON from the data
      let jsonData = "";

      // First, check for the "Read from SD card:" pattern
      if (data.includes("Read from SD card:")) {
        const startIdx = data.indexOf("{");
        const endIdx = data.lastIndexOf("}");

        if (startIdx >= 0 && endIdx > startIdx) {
          jsonData = data.substring(startIdx, endIdx + 1);
        }
      } else if (data.includes("motor_voltage")) {
        // Look for any JSON objects in the data
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          jsonData = jsonMatch[0];
        }
      }

      if (jsonData) {
        try {
          // Remove line numbers from JSON like "{9" -> "{"
          const cleanedJSON = cleanOutput(jsonData);

          // Validate that it's actual JSON by parsing it
          const parsed = JSON.parse(cleanedJSON);

          // If we got here, we have valid JSON
          const formattedJSON = JSON.stringify(parsed, null, 2);
          this.jsonBuffer = formattedJSON;
          this.hasValidJSON = true;

          // Save the current state of the terminal
          console.clear();

          // Display a clear notification
          console.log("\n\n");
          const jsonBoxOptions: ExtendedBoxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
            title: "JSON Data Detected!",
            titleAlignment: "center",
            width: 60,
          };
          console.log(
            boxen(
              chalk.bold.white("JSON Data Detected!") +
                "\n\n" +
                chalk.cyan(
                  "Valid JSON data has been detected from the VEX Brain."
                ) +
                "\n\n" +
                chalk.yellow("Would you like to download this data now?"),
              jsonBoxOptions
            )
          );

          // Show options as a simple menu
          const options = ["Download Now", "View Sample", "Download Later"];
          const selection = await cliSelect(options, {
            prompt: "Choose an action:",
            showBanner: false,
            clearScreen: false,
          });

          // Handle selection
          switch (selection) {
            case "Download Now":
              await this.handleJsonDownload();
              break;
            case "View Sample":
              await this.showJsonSample();
              break;
            case "Download Later":
              this.dataBuffer.push(
                chalk.green(
                  "✓ JSON data saved for later. Press 'J' to download when ready."
                )
              );
              break;
          }

          // Re-render the main UI
          this.render();
        } catch (error) {
          // Log error message for debugging
          console.error("JSON parsing error:", error);
          this.dataBuffer.push(
            chalk.yellow(
              `⚠ JSON parsing error: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
          this.render();
        }
      }
    } finally {
      // Reset the flag regardless of outcome
      isShowingPopup = false;
    }
  }

  /**
   * Show a popup notification when JSON is detected with option to download
   */
  private async showJsonNotification(): Promise<void> {
    // Save current menu state
    const wasMenuVisible = this.menuVisible;
    const previousMenu = this.activeMenu;

    // Show popup notification with mini-menu
    this.menuVisible = true;
    this.activeMenu = "JSON Detected";
    this.render();

    // Create floating box for notification
    const popupContent = boxen(
      chalk.bold.white("Valid JSON data detected from VEX Brain!") +
        "\n\n" +
        chalk.cyan("Would you like to download this data?"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        float: "center",
        title: "JSON Data Available",
        titleAlignment: "center",
      }
    );

    // Print popup in the middle of the screen
    console.log(popupContent);

    // Show options for user
    const options = ["Download Now", "Download Later", "View Sample"];
    const selection = await cliSelect(options, {
      title: "JSON Data Options",
      prompt: "Choose an action for the detected JSON data:",
      showBanner: false,
      theme: {
        title: chalk.bold.green,
        cursor: chalk.bold.yellow,
        selected: chalk.bold.white,
        unselected: chalk.gray,
        prompt: chalk.cyan,
      },
    });

    // Handle selection
    switch (selection) {
      case "Download Now":
        await this.handleJsonDownload();
        break;
      case "View Sample":
        this.showJsonSample();
        break;
      case "Download Later":
        // Add an indicator in the data buffer that JSON is available
        this.dataBuffer.push(
          chalk.green(
            "✓ JSON data available for download. Press 'J' to download."
          )
        );
        break;
    }

    // Restore previous menu state
    this.menuVisible = wasMenuVisible;
    this.activeMenu = previousMenu;
    this.render();
  }

  /**
   * Show a sample of the detected JSON data
   */
  private showJsonSample(): void {
    if (!this.hasValidJSON) return;

    // Parse JSON to create a sample preview
    try {
      const json = JSON.parse(this.jsonBuffer);
      const keys = Object.keys(json);

      let sampleInfo = "JSON Structure Preview:\n";
      if (keys.length > 0) {
        keys.forEach((key) => {
          const value = json[key];
          if (typeof value === "object" && value !== null) {
            // For nested objects/arrays, show basic info
            const type = Array.isArray(value) ? "Array" : "Object";
            const size = Array.isArray(value)
              ? value.length
              : Object.keys(value).length;
            sampleInfo += `  - ${key}: ${type} with ${size} entries\n`;
          } else {
            // For simple values, show the actual value
            const displayValue =
              typeof value === "string" ? `"${value}"` : value;
            sampleInfo += `  - ${key}: ${displayValue}\n`;
          }
        });
      }

      // Display sample in a box
      const boxedSample = boxen(chalk.cyan(sampleInfo), {
        padding: 1,
        borderStyle: "round",
        borderColor: "blue",
        title: "JSON Preview",
        titleAlignment: "center",
      });

      console.clear();
      console.log(boxedSample);
      console.log(
        chalk.yellow("\nPress any key to return to the main view...")
      );

      // Wait for a keypress
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.emitKeypressEvents(process.stdin);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      process.stdin.once("keypress", () => {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        this.render();
      });
    } catch (error) {
      this.dataBuffer.push(chalk.red("Error parsing JSON for preview."));
    }
  }

  /**
   * Handle downloading the JSON data
   */
  private async handleJsonDownload(): Promise<void> {
    try {
      // Ask user for filename
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      console.log(
        chalk.cyan("Enter filename (leave blank for auto-generated name):")
      );
      const fileName = await new Promise<string>((resolve) => {
        rl.question("> ", (answer: string) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      // Save the file
      const savedPath = await saveJSONToFile(
        this.jsonBuffer,
        fileName || undefined
      );

      // Show success message
      const successMsg = boxen(
        chalk.bold.green(`JSON data successfully saved to:`) +
          "\n\n" +
          chalk.white(savedPath),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
          title: "Download Complete",
          titleAlignment: "center",
        }
      );

      console.clear();
      console.log(successMsg);

      // Add to data buffer
      this.dataBuffer.push(chalk.green(`JSON data saved to: ${savedPath}`));

      // Wait for keypress to continue
      console.log(chalk.yellow("\nPress any key to continue..."));

      const keyPressPromise = new Promise<void>((resolve) => {
        const keypress = () => {
          process.stdin.removeListener("keypress", keypress);
          resolve();
        };
        process.stdin.on("keypress", keypress);
      });

      await keyPressPromise;
    } catch (error: any) {
      const errorMsg = boxen(
        chalk.bold.red(`Error saving JSON data:`) +
          "\n\n" +
          chalk.white(error.message || "Unknown error"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "red",
          title: "Download Failed",
          titleAlignment: "center",
        }
      );

      console.clear();
      console.log(errorMsg);
      this.dataBuffer.push(
        chalk.red(`Error saving JSON: ${error.message || "Unknown error"}`)
      );

      // Wait for keypress to continue
      console.log(chalk.yellow("\nPress any key to continue..."));
      await new Promise((resolve) => process.stdin.once("keypress", resolve));
    }
  }

  /**
   * Get the latest JSON data if available
   */
  getJSON(): string | null {
    return this.hasValidJSON ? this.jsonBuffer : null;
  }

  /**
   * Check if valid JSON is available
   */
  hasJSON(): boolean {
    return this.hasValidJSON;
  }

  /**
   * Clear the data buffer and JSON
   */
  clearData(): void {
    this.dataBuffer = [];
    this.jsonBuffer = "";
    this.hasValidJSON = false;
    this.jsonNotificationShown = false;
    if (this.menuVisible) {
      this.render();
    }
  }

  /**
   * Handle keypress events for global shortcuts
   * @param key The pressed key data
   */
  handleKeypress(key: any): void {
    // Check for JSON download shortcut
    if (key && key.name === "j" && this.hasValidJSON) {
      this.handleJsonDownload();
    }
  }

  /**
   * Show a menu at the bottom of the terminal
   * @param menuContent The menu content to display
   * @param menuTitle The title of the menu
   */
  showMenu(menuContent: string, menuTitle: string): void {
    this.menuVisible = true;
    this.activeMenu = menuTitle;
    this.render();
  }

  /**
   * Hide the currently displayed menu
   */
  hideMenu(): void {
    this.menuVisible = false;
    console.clear();

    // Print the most recent data
    const visibleLines = this.getVisibleDataLines();
    visibleLines.forEach((line) => console.log(line));
  }

  /**
   * Get data lines that should be visible based on terminal height
   */
  private getVisibleDataLines(): string[] {
    let maxLines = this.terminalHeight;

    if (this.menuVisible) {
      // Subtract space needed for menu and headers/footers
      const menuHeight = 10; // Approximate height for menu box
      maxLines =
        this.terminalHeight -
        menuHeight -
        this.headerHeight -
        this.footerHeight;
    }

    // Ensure we show at least some lines
    maxLines = Math.max(maxLines, 5);

    // Get the most recent lines up to maxLines
    return this.dataBuffer.slice(-maxLines);
  }

  /**
   * Render the terminal UI with data and menu
   */
  render(): void {
    // Clear the terminal
    console.clear();

    // Get visible data lines
    const visibleLines = this.getVisibleDataLines();

    // Print header
    console.log(
      chalk.cyan(
        `=== RoboInsights Data View ${
          this.activeMenu ? `(${this.activeMenu})` : ""
        } ===`
      )
    );
    console.log(
      chalk.cyan(`=== Last updated: ${new Date().toLocaleTimeString()} ===`)
    );
    console.log(chalk.cyan("=".repeat(80)));

    // Print data
    visibleLines.forEach((line) => console.log(line));

    // Fill remaining space with empty lines if menu is visible
    if (this.menuVisible) {
      const fillerLines =
        this.terminalHeight -
        visibleLines.length -
        this.headerHeight -
        this.footerHeight -
        10;
      for (let i = 0; i < fillerLines; i++) {
        console.log();
      }

      // Print footer before menu
      console.log(chalk.cyan("=".repeat(80)));
      console.log(
        chalk.cyan(`=== Use arrow keys to navigate, Enter to select ===`)
      );
    }
  }
}

/**
 * Main application class for RoboInsights
 */
class RoboInsightsApp {
  private brainConnection: BrainSerialConnection;
  private config = configManager.getConfig();
  private ui = new TerminalUI();

  constructor() {
    this.brainConnection = new BrainSerialConnection();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for the brain connection
   */
  private setupEventListeners(): void {
    this.brainConnection.on("data", (data: string) => {
      // Add data to UI
      this.ui.addData(chalk.green(`Data from VEX Brain: ${data}`));
    });

    this.brainConnection.on("error", (err: Error) => {
      this.ui.addData(
        chalk.red(`Error with VEX Brain connection: ${err.message}`)
      );
    });

    this.brainConnection.on("close", () => {
      this.ui.addData(chalk.yellow("VEX Brain connection closed."));
    });
  }

  /**
   * Shows a confirmation popup with response from the VEX Brain
   * @param response The response message
   * @param success Whether the command was successful
   */
  private async showCommandResponsePopup(
    response: string,
    success: boolean = true
  ): Promise<void> {
    console.clear();

    // Format title and colors based on success/failure
    const title = success ? "Command Successful" : "Command Failed";
    const borderColor = success ? "green" : "red";
    const bgColor = success ? "#004000" : "#400000";

    // Create content text
    const statusText = success
      ? chalk.bold.green("✓ Command processed successfully by VEX Brain")
      : chalk.bold.red("✗ Command execution failed");

    const responseText = chalk.white(`Response: ${response}`);

    // Show the popup using boxen
    const boxOptions: ExtendedBoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: borderColor,
      backgroundColor: bgColor,
      title: title,
      titleAlignment: "center",
      width: 60,
    };
    console.log(
      boxen(
        `${statusText}\n\n${responseText}\n\n${chalk.yellow(
          "Press any key to continue..."
        )}`,
        boxOptions
      )
    );

    // Wait for a keypress to continue
    return new Promise<void>((resolve) => {
      const cleanup = () => {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.stdin.removeListener("data", onKeypress);
        resolve();
      };

      const onKeypress = () => {
        cleanup();
      };

      process.stdin.on("data", onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
    });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      printRoboInsightsLogo();

      if (this.config.ui.showBanner) {
        displayBrandedMessage(
          `Welcome to RoboInsights - VEX Brain Connection Utility`,
          this.config.ui.bannerText,
          {
            borderColor: this.config.ui.theme.primary,
            backgroundColor: this.config.ui.theme.background,
          }
        );
      }

      // Try to connect to a port
      await this.connectToPort();

      // Wait for user input
      await this.startCommandLoop();
    } catch (error) {
      console.error(chalk.red("Application error:"), error);
    }
  }

  /**
   * Connect to a VEX Brain port
   */
  private async connectToPort(): Promise<void> {
    try {
      const ports = await listSerialPorts();

      if (ports.length === 0) {
        displayBrandedMessage(
          "No serial ports detected. Please ensure your VEX Brain is connected.",
          "Connection Error",
          { borderColor: "red" }
        );
        process.exit(1);
      }

      // If auto-connect is enabled and there's at least one port
      if (this.config.serial.autoConnect && ports.length > 0) {
        await this.connectWithRetry(ports[0].path);
        return;
      }

      // Prepare options for port selection
      const portOptions = ports.map((port) => port.displayName);
      portOptions.push("Enter port manually");

      // Let user select a port
      const selectedOption = await cliSelect(portOptions, {
        title: "VEX Brain Connection",
        prompt: "Select the port connected to your VEX Brain:",
        showBanner: false,
        theme: {
          title: this.getChalkColor("primary"),
          cursor: this.getChalkColor("accent"),
          selected: this.getChalkColor("secondary"),
          unselected: this.getChalkColor("text", false),
          prompt: this.getChalkColor("primary"),
        },
      });

      let portPath: string;

      if (selectedOption === "Enter port manually") {
        // Create a simple readline interface for manual entry
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        portPath = await new Promise<string>((resolve) => {
          rl.question(
            chalk.cyan("Enter the port name (e.g., COM6): "),
            (answer: string) => {
              rl.close();
              resolve(answer.trim());
            }
          );
        });
      } else {
        // Find the port object that matches the selected option
        const selectedPort = ports.find(
          (port) => port.displayName === selectedOption
        );
        if (!selectedPort) {
          throw new Error("Selected port not found");
        }
        portPath = selectedPort.path;
      }

      if (!portPath) {
        displayBrandedMessage(
          "No port selected. Exiting.",
          "Connection Error",
          { borderColor: "red" }
        );
        process.exit(1);
      }

      await this.connectWithRetry(portPath);
    } catch (error) {
      console.error(chalk.red("Error connecting to port:"), error);
      throw error;
    }
  }

  /**
   * Helper method to get chalk color functions based on theme color names
   * @param colorName Name of the color in the theme configuration
   * @param bold Whether to make the text bold (default: true)
   */
  private getChalkColor(
    colorName: string,
    bold: boolean = true
  ): chalk.ChalkFunction {
    // Get the color name from config
    const color =
      this.config.ui.theme[colorName as keyof typeof this.config.ui.theme] ||
      "white";

    // Map of color names to chalk color functions
    const colorMap: Record<string, chalk.ChalkFunction> = {
      black: bold ? chalk.bold.black : chalk.black,
      red: bold ? chalk.bold.red : chalk.red,
      green: bold ? chalk.bold.green : chalk.green,
      yellow: bold ? chalk.bold.yellow : chalk.yellow,
      blue: bold ? chalk.bold.blue : chalk.blue,
      magenta: bold ? chalk.bold.magenta : chalk.magenta,
      cyan: bold ? chalk.bold.cyan : chalk.cyan,
      white: bold ? chalk.bold.white : chalk.white,
      gray: bold ? chalk.bold.gray : chalk.gray,
      grey: bold ? chalk.bold.grey : chalk.grey,
    };

    // Return the chalk function or default to white
    return colorMap[color] || (bold ? chalk.bold.white : chalk.white);
  }

  /**
   * Connect to a port with retry capability
   * @param portPath The path to the port
   */
  private async connectWithRetry(portPath: string): Promise<void> {
    const { retryConnection, retryAttempts, retryDelay } = this.config.serial;

    let attempts = 0;
    let connected = false;

    while (!connected && attempts <= retryAttempts) {
      try {
        attempts++;
        await this.brainConnection.connect(portPath);
        connected = true;

        displayBrandedMessage(
          `Successfully connected to VEX Brain on ${portPath}`,
          "Connection Successful",
          { borderColor: "green" }
        );
      } catch (err: any) {
        const errorMessage = err?.message || "Unknown error";

        if (attempts >= retryAttempts || !retryConnection) {
          displayBrandedMessage(
            `Failed to connect after ${attempts} attempts: ${errorMessage}`,
            "Connection Failed",
            { borderColor: "red" }
          );
          throw err;
        }

        console.log(
          chalk.yellow(
            `Connection attempt ${attempts} failed, retrying in ${
              retryDelay / 1000
            } seconds...`
          )
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Start a command loop for user interaction
   */
  private async startCommandLoop(): Promise<void> {
    const commands = [
      "Configure VEX Brain settings",
      "View connection info",
      "Reconnect",
      "Disconnect",
      "Clear data view",
      "Exit",
    ];

    let running = true;

    // Set up global keypress handler for JSON download
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // Add keypress listener for global shortcuts (like 'J' for JSON download)
    process.stdin.on("keypress", (_, key) => {
      if (key) {
        // Handle ctrl+c to exit
        if (key.name === "c" && key.ctrl) {
          process.exit(0);
        }

        // Pass other keypresses to UI handler
        this.ui.handleKeypress(key);
      }
    });

    while (running) {
      // Show menu at the bottom
      this.ui.showMenu("Command Menu", "Main Menu");

      const selection = await cliSelect(commands, {
        title: "RoboInsights Command Menu",
        prompt: "Select an action:",
        showBanner: false,
      });

      switch (selection) {
        case "Configure VEX Brain settings":
          await this.showConfigurationMenu();
          break;
        case "View connection info":
          this.displayConnectionInfo();
          break;
        case "Reconnect":
          await this.reconnect();
          break;
        case "Disconnect":
          this.disconnect();
          break;
        case "Clear data view":
          this.ui.clearData();
          this.ui.addData(chalk.cyan("Data view cleared."));
          break;
        case "Exit":
          running = false;
          this.disconnect();
          this.ui.hideMenu();
          displayBrandedMessage("Exiting RoboInsights. Goodbye!", "Exit");
          break;
      }
    }
  }

  /**
   * Show a menu of configuration options for the VEX Brain
   */
  private async showConfigurationMenu(): Promise<void> {
    if (!this.brainConnection.isConnected) {
      displayBrandedMessage("Not connected to a VEX Brain.", "Error", {
        borderColor: "red",
      });
      return;
    }

    const configOptions = [
      "Set Log Level",
      "Enable/Disable Console Output",
      "Enable/Disable File Output",
      "Set Log Filename",
      "Clear Log File",
      "Time Series Logging Control",
      "Send PING Command",
      "Back to Main Menu",
    ];

    this.ui.showMenu("Configuration Menu", "Configure VEX Brain");

    const selection = await cliSelect(configOptions, {
      title: "VEX Brain Configuration",
      prompt: "Select a configuration option:",
      showBanner: false,
    });

    // Handle the selected option
    switch (selection) {
      case "Set Log Level":
        await this.configureLogLevel();
        break;
      case "Enable/Disable Console Output":
        await this.configureConsoleOutput();
        break;
      case "Enable/Disable File Output":
        await this.configureFileOutput();
        break;
      case "Set Log Filename":
        await this.configureLogFilename();
        break;
      case "Clear Log File":
        await this.clearLogFile();
        break;
      case "Time Series Logging Control":
        await this.configureTimeSeriesLogging();
        break;
      case "Send PING Command":
        await this.sendPingCommand();
        break;
      case "Back to Main Menu":
        // Just return to go back to main menu
        return;
    }
  }

  /**
   * Configure the logging level
   */
  private async configureLogLevel(): Promise<void> {
    const logLevels = ["DEBUG", "INFO", "WARNING", "ERROR", "Cancel"];

    const selection = await cliSelect(logLevels, {
      title: "Set Log Level",
      prompt: "Select the minimum log level:",
      showBanner: false,
    });

    if (selection !== "Cancel") {
      try {
        const response = await this.brainConnection.sendCommand(
          `SET_LOG_LEVEL:${selection}`
        );
        await this.showCommandResponsePopup(response, true);
        this.ui.addData(chalk.green(`Log level set to: ${selection}`));
      } catch (err: any) {
        await this.showCommandResponsePopup(err.message, false);
        this.ui.addData(
          chalk.red(
            `Error setting log level: ${err.message || "Unknown error"}`
          )
        );
      }
    }
  }

  /**
   * Configure console output
   */
  private async configureConsoleOutput(): Promise<void> {
    const options = [
      "Enable Console Output",
      "Disable Console Output",
      "Cancel",
    ];

    const selection = await cliSelect(options, {
      title: "Console Output Configuration",
      prompt: "Select an option:",
      showBanner: false,
    });

    try {
      let response = "";
      switch (selection) {
        case "Enable Console Output":
          response = await this.brainConnection.sendCommand(
            "ENABLE_CONSOLE_OUTPUT"
          );
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("Console output enabled"));
          break;
        case "Disable Console Output":
          response = await this.brainConnection.sendCommand(
            "DISABLE_CONSOLE_OUTPUT"
          );
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("Console output disabled"));
          break;
      }
    } catch (err: any) {
      await this.showCommandResponsePopup(err.message, false);
      this.ui.addData(
        chalk.red(
          `Error configuring console output: ${err.message || "Unknown error"}`
        )
      );
    }
  }

  /**
   * Configure file output
   */
  private async configureFileOutput(): Promise<void> {
    const options = ["Enable File Output", "Disable File Output", "Cancel"];

    const selection = await cliSelect(options, {
      title: "File Output Configuration",
      prompt: "Select an option:",
      showBanner: false,
    });

    try {
      let response = "";
      switch (selection) {
        case "Enable File Output":
          response = await this.brainConnection.sendCommand(
            "ENABLE_FILE_OUTPUT"
          );
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("File output enabled"));
          break;
        case "Disable File Output":
          response = await this.brainConnection.sendCommand(
            "DISABLE_FILE_OUTPUT"
          );
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("File output disabled"));
          break;
      }
    } catch (err: any) {
      await this.showCommandResponsePopup(err.message, false);
      this.ui.addData(
        chalk.red(
          `Error configuring file output: ${err.message || "Unknown error"}`
        )
      );
    }
  }

  /**
   * Configure log filename
   */
  private async configureLogFilename(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.clear();
    console.log(chalk.cyan("=== Set Log Filename ===\n"));

    const filename = await new Promise<string>((resolve) => {
      rl.question(chalk.cyan("Enter log filename: "), (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (filename) {
      try {
        const response = await this.brainConnection.sendCommand(
          `SET_LOG_FILENAME:${filename}`
        );
        await this.showCommandResponsePopup(response, true);
        this.ui.addData(chalk.green(`Log filename set to: ${filename}`));
      } catch (err: any) {
        await this.showCommandResponsePopup(err.message, false);
        this.ui.addData(
          chalk.red(
            `Error setting log filename: ${err.message || "Unknown error"}`
          )
        );
      }
    }
  }

  /**
   * Clear the log file
   */
  private async clearLogFile(): Promise<void> {
    try {
      const response = await this.brainConnection.sendCommand("CLEAR_LOG_FILE");
      await this.showCommandResponsePopup(response, true);
      this.ui.addData(chalk.green("Log file cleared"));
    } catch (err: any) {
      await this.showCommandResponsePopup(err.message, false);
      this.ui.addData(
        chalk.red(`Error clearing log file: ${err.message || "Unknown error"}`)
      );
    }
  }

  /**
   * Configure time series logging
   */
  private async configureTimeSeriesLogging(): Promise<void> {
    const options = [
      "Start Time Series Logging",
      "Stop Time Series Logging",
      "Cancel",
    ];

    const selection = await cliSelect(options, {
      title: "Time Series Logging Configuration",
      prompt: "Select an option:",
      showBanner: false,
    });

    try {
      let response = "";
      switch (selection) {
        case "Start Time Series Logging":
          response = await this.brainConnection.sendCommand(
            "START_TIME_SERIES"
          );
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("Time series logging started"));
          break;
        case "Stop Time Series Logging":
          response = await this.brainConnection.sendCommand("STOP_TIME_SERIES");
          await this.showCommandResponsePopup(response, true);
          this.ui.addData(chalk.green("Time series logging stopped"));
          break;
      }
    } catch (err: any) {
      await this.showCommandResponsePopup(err.message, false);
      this.ui.addData(
        chalk.red(
          `Error configuring time series logging: ${
            err.message || "Unknown error"
          }`
        )
      );
    }
  }

  /**
   * Send a PING command to check connectivity
   */
  private async sendPingCommand(): Promise<void> {
    try {
      const response = await this.brainConnection.sendCommand("PING");
      await this.showCommandResponsePopup(response, true);
      this.ui.addData(
        chalk.green("PING command sent successfully, received PONG response")
      );
    } catch (err: any) {
      await this.showCommandResponsePopup(err.message, false);
      this.ui.addData(
        chalk.red(
          `Error sending PING command: ${err.message || "Unknown error"}`
        )
      );
    }
  }

  /**
   * Download JSON data from the VEX Brain
   */
  private async downloadJSON(): Promise<void> {
    if (!this.ui.hasJSON()) {
      displayBrandedMessage(
        "No valid JSON data available to download.",
        "Download JSON",
        { borderColor: "yellow" }
      );
      return;
    }

    const jsonData = this.ui.getJSON();
    if (!jsonData) {
      displayBrandedMessage("Error retrieving JSON data.", "Download JSON", {
        borderColor: "red",
      });
      return;
    }

    try {
      // Ask user for filename
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const fileName = await new Promise<string>((resolve) => {
        rl.question(
          chalk.cyan("Enter filename (leave blank for auto-generated name): "),
          (answer: string) => {
            rl.close();
            resolve(answer.trim());
          }
        );
      });

      // Save the file
      const savedPath = await saveJSONToFile(jsonData, fileName || undefined);

      displayBrandedMessage(
        `JSON data successfully saved to:\n${savedPath}`,
        "Download Complete",
        { borderColor: "green" }
      );

      this.ui.addData(chalk.green(`JSON data saved to: ${savedPath}`));
    } catch (error: any) {
      displayBrandedMessage(
        `Error saving JSON data: ${error.message}`,
        "Download Failed",
        { borderColor: "red" }
      );
    }
  }

  /**
   * Send a command to the Brain
   */
  private async sendCommand(): Promise<void> {
    if (!this.brainConnection.isConnected) {
      displayBrandedMessage("Not connected to a VEX Brain.", "Error", {
        borderColor: "red",
      });
      return;
    }

    // Create a readline interface for command input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const command = await new Promise<string>((resolve) => {
      rl.question(chalk.cyan("Enter command to send: "), (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (command) {
      try {
        await this.brainConnection.sendCommand(command);
        console.log(chalk.green(`Command sent: ${command}`));
      } catch (err: any) {
        const errorMessage = err?.message || "Unknown error";
        console.error(chalk.red("Error sending command:"), errorMessage);
      }
    }
  }

  /**
   * Display connection information
   */
  private displayConnectionInfo(): void {
    const info = this.brainConnection.isConnected
      ? "Connected to VEX Brain"
      : "Not connected to any device";

    displayBrandedMessage(info, "Connection Status", {
      borderColor: this.brainConnection.isConnected ? "green" : "yellow",
    });
  }

  /**
   * Reconnect to the Brain
   */
  private async reconnect(): Promise<void> {
    // Disconnect first if already connected
    if (this.brainConnection.isConnected) {
      this.brainConnection.disconnect();
    }

    await this.connectToPort();
  }

  /**
   * Disconnect from the Brain
   */
  private disconnect(): void {
    if (this.brainConnection.isConnected) {
      this.brainConnection.disconnect();
      displayBrandedMessage("Disconnected from VEX Brain", "Disconnected");
    } else {
      console.log(chalk.yellow("Not currently connected."));
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new RoboInsightsApp();
  app.start().catch((err) => {
    console.error(chalk.red("Fatal error:"), err);
    process.exit(1);
  });
}

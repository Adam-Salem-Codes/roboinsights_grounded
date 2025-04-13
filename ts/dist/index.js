"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Add these lines at the top of the file, before any other imports
// This ensures proper handling of process.stdin when packaged with pkg
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
}
const chalk_1 = __importDefault(require("chalk"));
const serial_1 = require("./utils/serial");
const cli_1 = require("./utils/cli");
const config_1 = require("./utils/config");
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const boxen_1 = __importDefault(require("boxen"));
// Global flag to track if we're currently showing a popup
let isShowingPopup = false;
// Helper function to resolve paths when packaged with pkg
function resolveAssetPath(relativePath) {
    // When packaged with pkg, __dirname refers to the location inside the snapshot
    const isPackaged = !__dirname.includes("node_modules");
    if (isPackaged) {
        // For packaged app, use process.execPath (executable location)
        return path.join(path.dirname(process.execPath), relativePath);
    }
    else {
        // For development, use regular path resolution
        return path.join(__dirname, relativePath);
    }
}
/**
 * Prints the RoboInsights ASCII art logo at startup
 */
function printRoboInsightsLogo() {
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
        if (!line.trim())
            return; // Skip empty lines
        const colorIndex = i % colors.length;
        const colorName = colors[colorIndex];
        // @ts-ignore - Dynamic access to chalk colors
        console.log(chalk_1.default[colorName](line));
    });
    console.log("\n"); // Add spacing after the logo
    console.log(chalk_1.default.bold.cyan("=".repeat(80)));
    console.log(chalk_1.default.bold.gray("  Version 1.0.0"));
    console.log(chalk_1.default.bold.cyan("=".repeat(80)));
    console.log("\n"); // Add more spacing at the bottom
}
/**
 * Terminal UI manager that maintains data view at top and menu at bottom
 */
class TerminalUI {
    constructor() {
        this.dataBuffer = [];
        this.jsonBuffer = "";
        this.hasValidJSON = false;
        this.jsonNotificationShown = false;
        this.maxDataLines = 20; // Maximum number of data lines to show
        this.menuVisible = false;
        this.activeMenu = "";
        this.headerHeight = 3; // Fixed height for header
        this.footerHeight = 2; // Fixed height for footer
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
    addData(data) {
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
        }
        else {
            // Just print the line if no menu is active
            console.log(formattedData);
        }
    }
    /**
     * Format a data line for better readability
     * @param data The raw data line
     * @returns Formatted data line
     */
    formatDataLine(data) {
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
                        levelColor = chalk_1.default.blue;
                        break;
                    case "WARN":
                        levelColor = chalk_1.default.yellow;
                        break;
                    case "ERROR":
                        levelColor = chalk_1.default.red;
                        break;
                    default:
                        levelColor = chalk_1.default.white;
                }
                return `${chalk_1.default.green(brainDataPrefix)}${chalk_1.default.gray(timestamp)} ${levelColor(level)} ${chalk_1.default.white(message)}`;
            }
            // Check for "Read from SD card:" JSON data
            if (content.startsWith("Read from SD card:")) {
                return (chalk_1.default.green(brainDataPrefix) +
                    chalk_1.default.yellow("JSON data received from SD card"));
            }
            // Default formatting for other messages
            return chalk_1.default.green(brainDataPrefix) + chalk_1.default.white(content);
        }
        // Non-Brain messages
        return data;
    }
    /**
     * Check if a data line contains JSON and process it
     * @param data The data line to check
     */
    checkForJSON(data) {
        // Look for specific patterns that indicate JSON data
        if (data.includes("Read from SD card:") || data.includes("motor_voltage")) {
            this.showDirectJsonPrompt(data);
        }
    }
    /**
     * Directly show a JSON data prompt when we detect JSON in a message
     */
    async showDirectJsonPrompt(data) {
        // Skip if already showing a popup
        if (isShowingPopup)
            return;
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
            }
            else if (data.includes("motor_voltage")) {
                // Look for any JSON objects in the data
                const jsonMatch = data.match(/\{[\s\S]*\}/);
                if (jsonMatch && jsonMatch[0]) {
                    jsonData = jsonMatch[0];
                }
            }
            if (jsonData) {
                try {
                    // Remove line numbers from JSON like "{9" -> "{"
                    const cleanedJSON = (0, serial_1.cleanOutput)(jsonData);
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
                    const jsonBoxOptions = {
                        padding: 1,
                        margin: 1,
                        borderStyle: "round",
                        borderColor: "green",
                        title: "JSON Data Detected!",
                        titleAlignment: "center",
                        width: 60,
                    };
                    console.log((0, boxen_1.default)(chalk_1.default.bold.white("JSON Data Detected!") +
                        "\n\n" +
                        chalk_1.default.cyan("Valid JSON data has been detected from the VEX Brain.") +
                        "\n\n" +
                        chalk_1.default.yellow("Would you like to download this data now?"), jsonBoxOptions));
                    // Show options as a simple menu
                    const options = ["Download Now", "View Sample", "Download Later"];
                    const selection = await (0, cli_1.cliSelect)(options, {
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
                            this.dataBuffer.push(chalk_1.default.green("✓ JSON data saved for later. Press 'J' to download when ready."));
                            break;
                    }
                    // Re-render the main UI
                    this.render();
                }
                catch (error) {
                    // Log error message for debugging
                    console.error("JSON parsing error:", error);
                    this.dataBuffer.push(chalk_1.default.yellow(`⚠ JSON parsing error: ${error instanceof Error ? error.message : String(error)}`));
                    this.render();
                }
            }
        }
        finally {
            // Reset the flag regardless of outcome
            isShowingPopup = false;
        }
    }
    /**
     * Show a popup notification when JSON is detected with option to download
     */
    async showJsonNotification() {
        // Save current menu state
        const wasMenuVisible = this.menuVisible;
        const previousMenu = this.activeMenu;
        // Show popup notification with mini-menu
        this.menuVisible = true;
        this.activeMenu = "JSON Detected";
        this.render();
        // Create floating box for notification
        const popupContent = (0, boxen_1.default)(chalk_1.default.bold.white("Valid JSON data detected from VEX Brain!") +
            "\n\n" +
            chalk_1.default.cyan("Would you like to download this data?"), {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
            float: "center",
            title: "JSON Data Available",
            titleAlignment: "center",
        });
        // Print popup in the middle of the screen
        console.log(popupContent);
        // Show options for user
        const options = ["Download Now", "Download Later", "View Sample"];
        const selection = await (0, cli_1.cliSelect)(options, {
            title: "JSON Data Options",
            prompt: "Choose an action for the detected JSON data:",
            showBanner: false,
            theme: {
                title: chalk_1.default.bold.green,
                cursor: chalk_1.default.bold.yellow,
                selected: chalk_1.default.bold.white,
                unselected: chalk_1.default.gray,
                prompt: chalk_1.default.cyan,
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
                this.dataBuffer.push(chalk_1.default.green("✓ JSON data available for download. Press 'J' to download."));
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
    showJsonSample() {
        if (!this.hasValidJSON)
            return;
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
                    }
                    else {
                        // For simple values, show the actual value
                        const displayValue = typeof value === "string" ? `"${value}"` : value;
                        sampleInfo += `  - ${key}: ${displayValue}\n`;
                    }
                });
            }
            // Display sample in a box
            const boxedSample = (0, boxen_1.default)(chalk_1.default.cyan(sampleInfo), {
                padding: 1,
                borderStyle: "round",
                borderColor: "blue",
                title: "JSON Preview",
                titleAlignment: "center",
            });
            console.clear();
            console.log(boxedSample);
            console.log(chalk_1.default.yellow("\nPress any key to return to the main view..."));
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
        }
        catch (error) {
            this.dataBuffer.push(chalk_1.default.red("Error parsing JSON for preview."));
        }
    }
    /**
     * Handle downloading the JSON data
     */
    async handleJsonDownload() {
        try {
            // Ask user for filename
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            console.log(chalk_1.default.cyan("Enter filename (leave blank for auto-generated name):"));
            const fileName = await new Promise((resolve) => {
                rl.question("> ", (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
            });
            // Save the file
            const savedPath = await (0, serial_1.saveJSONToFile)(this.jsonBuffer, fileName || undefined);
            // Show success message
            const successMsg = (0, boxen_1.default)(chalk_1.default.bold.green(`JSON data successfully saved to:`) +
                "\n\n" +
                chalk_1.default.white(savedPath), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "green",
                title: "Download Complete",
                titleAlignment: "center",
            });
            console.clear();
            console.log(successMsg);
            // Add to data buffer
            this.dataBuffer.push(chalk_1.default.green(`JSON data saved to: ${savedPath}`));
            // Wait for keypress to continue
            console.log(chalk_1.default.yellow("\nPress any key to continue..."));
            const keyPressPromise = new Promise((resolve) => {
                const keypress = () => {
                    process.stdin.removeListener("keypress", keypress);
                    resolve();
                };
                process.stdin.on("keypress", keypress);
            });
            await keyPressPromise;
        }
        catch (error) {
            const errorMsg = (0, boxen_1.default)(chalk_1.default.bold.red(`Error saving JSON data:`) +
                "\n\n" +
                chalk_1.default.white(error.message || "Unknown error"), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "red",
                title: "Download Failed",
                titleAlignment: "center",
            });
            console.clear();
            console.log(errorMsg);
            this.dataBuffer.push(chalk_1.default.red(`Error saving JSON: ${error.message || "Unknown error"}`));
            // Wait for keypress to continue
            console.log(chalk_1.default.yellow("\nPress any key to continue..."));
            await new Promise((resolve) => process.stdin.once("keypress", resolve));
        }
    }
    /**
     * Get the latest JSON data if available
     */
    getJSON() {
        return this.hasValidJSON ? this.jsonBuffer : null;
    }
    /**
     * Check if valid JSON is available
     */
    hasJSON() {
        return this.hasValidJSON;
    }
    /**
     * Clear the data buffer and JSON
     */
    clearData() {
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
    handleKeypress(key) {
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
    showMenu(menuContent, menuTitle) {
        this.menuVisible = true;
        this.activeMenu = menuTitle;
        this.render();
    }
    /**
     * Hide the currently displayed menu
     */
    hideMenu() {
        this.menuVisible = false;
        console.clear();
        // Print the most recent data
        const visibleLines = this.getVisibleDataLines();
        visibleLines.forEach((line) => console.log(line));
    }
    /**
     * Get data lines that should be visible based on terminal height
     */
    getVisibleDataLines() {
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
    render() {
        // Clear the terminal
        console.clear();
        // Get visible data lines
        const visibleLines = this.getVisibleDataLines();
        // Print header
        console.log(chalk_1.default.cyan(`=== RoboInsights Data View ${this.activeMenu ? `(${this.activeMenu})` : ""} ===`));
        console.log(chalk_1.default.cyan(`=== Last updated: ${new Date().toLocaleTimeString()} ===`));
        console.log(chalk_1.default.cyan("=".repeat(80)));
        // Print data
        visibleLines.forEach((line) => console.log(line));
        // Fill remaining space with empty lines if menu is visible
        if (this.menuVisible) {
            const fillerLines = this.terminalHeight -
                visibleLines.length -
                this.headerHeight -
                this.footerHeight -
                10;
            for (let i = 0; i < fillerLines; i++) {
                console.log();
            }
            // Print footer before menu
            console.log(chalk_1.default.cyan("=".repeat(80)));
            console.log(chalk_1.default.cyan(`=== Use arrow keys to navigate, Enter to select ===`));
        }
    }
}
/**
 * Main application class for RoboInsights
 */
class RoboInsightsApp {
    constructor() {
        this.config = config_1.configManager.getConfig();
        this.ui = new TerminalUI();
        this.brainConnection = new serial_1.BrainSerialConnection();
        // Set up event listeners
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for the brain connection
     */
    setupEventListeners() {
        this.brainConnection.on("data", (data) => {
            // Add data to UI
            this.ui.addData(chalk_1.default.green(`Data from VEX Brain: ${data}`));
        });
        this.brainConnection.on("error", (err) => {
            this.ui.addData(chalk_1.default.red(`Error with VEX Brain connection: ${err.message}`));
        });
        this.brainConnection.on("close", () => {
            this.ui.addData(chalk_1.default.yellow("VEX Brain connection closed."));
        });
    }
    /**
     * Shows a confirmation popup with response from the VEX Brain
     * @param response The response message
     * @param success Whether the command was successful
     */
    async showCommandResponsePopup(response, success = true) {
        console.clear();
        // Format title and colors based on success/failure
        const title = success ? "Command Successful" : "Command Failed";
        const borderColor = success ? "green" : "red";
        const bgColor = success ? "#004000" : "#400000";
        // Create content text
        const statusText = success
            ? chalk_1.default.bold.green("✓ Command processed successfully by VEX Brain")
            : chalk_1.default.bold.red("✗ Command execution failed");
        const responseText = chalk_1.default.white(`Response: ${response}`);
        // Show the popup using boxen
        const boxOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: borderColor,
            backgroundColor: bgColor,
            title: title,
            titleAlignment: "center",
            width: 60,
        };
        console.log((0, boxen_1.default)(`${statusText}\n\n${responseText}\n\n${chalk_1.default.yellow("Press any key to continue...")}`, boxOptions));
        // Wait for a keypress to continue
        return new Promise((resolve) => {
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
    async start() {
        try {
            printRoboInsightsLogo();
            if (this.config.ui.showBanner) {
                (0, cli_1.displayBrandedMessage)(`Welcome to RoboInsights - VEX Brain Connection Utility`, this.config.ui.bannerText, {
                    borderColor: this.config.ui.theme.primary,
                    backgroundColor: this.config.ui.theme.background,
                });
            }
            // Try to connect to a port
            await this.connectToPort();
            // Wait for user input
            await this.startCommandLoop();
        }
        catch (error) {
            console.error(chalk_1.default.red("Application error:"), error);
        }
    }
    /**
     * Connect to a VEX Brain port
     */
    async connectToPort() {
        try {
            const ports = await (0, serial_1.listSerialPorts)();
            if (ports.length === 0) {
                (0, cli_1.displayBrandedMessage)("No serial ports detected. Please ensure your VEX Brain is connected.", "Connection Error", { borderColor: "red" });
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
            const selectedOption = await (0, cli_1.cliSelect)(portOptions, {
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
            let portPath;
            if (selectedOption === "Enter port manually") {
                // Create a simple readline interface for manual entry
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                portPath = await new Promise((resolve) => {
                    rl.question(chalk_1.default.cyan("Enter the port name (e.g., COM6): "), (answer) => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
            }
            else {
                // Find the port object that matches the selected option
                const selectedPort = ports.find((port) => port.displayName === selectedOption);
                if (!selectedPort) {
                    throw new Error("Selected port not found");
                }
                portPath = selectedPort.path;
            }
            if (!portPath) {
                (0, cli_1.displayBrandedMessage)("No port selected. Exiting.", "Connection Error", { borderColor: "red" });
                process.exit(1);
            }
            await this.connectWithRetry(portPath);
        }
        catch (error) {
            console.error(chalk_1.default.red("Error connecting to port:"), error);
            throw error;
        }
    }
    /**
     * Helper method to get chalk color functions based on theme color names
     * @param colorName Name of the color in the theme configuration
     * @param bold Whether to make the text bold (default: true)
     */
    getChalkColor(colorName, bold = true) {
        // Get the color name from config
        const color = this.config.ui.theme[colorName] ||
            "white";
        // Map of color names to chalk color functions
        const colorMap = {
            black: bold ? chalk_1.default.bold.black : chalk_1.default.black,
            red: bold ? chalk_1.default.bold.red : chalk_1.default.red,
            green: bold ? chalk_1.default.bold.green : chalk_1.default.green,
            yellow: bold ? chalk_1.default.bold.yellow : chalk_1.default.yellow,
            blue: bold ? chalk_1.default.bold.blue : chalk_1.default.blue,
            magenta: bold ? chalk_1.default.bold.magenta : chalk_1.default.magenta,
            cyan: bold ? chalk_1.default.bold.cyan : chalk_1.default.cyan,
            white: bold ? chalk_1.default.bold.white : chalk_1.default.white,
            gray: bold ? chalk_1.default.bold.gray : chalk_1.default.gray,
            grey: bold ? chalk_1.default.bold.grey : chalk_1.default.grey,
        };
        // Return the chalk function or default to white
        return colorMap[color] || (bold ? chalk_1.default.bold.white : chalk_1.default.white);
    }
    /**
     * Connect to a port with retry capability
     * @param portPath The path to the port
     */
    async connectWithRetry(portPath) {
        const { retryConnection, retryAttempts, retryDelay } = this.config.serial;
        let attempts = 0;
        let connected = false;
        while (!connected && attempts <= retryAttempts) {
            try {
                attempts++;
                await this.brainConnection.connect(portPath);
                connected = true;
                (0, cli_1.displayBrandedMessage)(`Successfully connected to VEX Brain on ${portPath}`, "Connection Successful", { borderColor: "green" });
            }
            catch (err) {
                const errorMessage = (err === null || err === void 0 ? void 0 : err.message) || "Unknown error";
                if (attempts >= retryAttempts || !retryConnection) {
                    (0, cli_1.displayBrandedMessage)(`Failed to connect after ${attempts} attempts: ${errorMessage}`, "Connection Failed", { borderColor: "red" });
                    throw err;
                }
                console.log(chalk_1.default.yellow(`Connection attempt ${attempts} failed, retrying in ${retryDelay / 1000} seconds...`));
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }
    /**
     * Start a command loop for user interaction
     */
    async startCommandLoop() {
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
            const selection = await (0, cli_1.cliSelect)(commands, {
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
                    this.ui.addData(chalk_1.default.cyan("Data view cleared."));
                    break;
                case "Exit":
                    running = false;
                    this.disconnect();
                    this.ui.hideMenu();
                    (0, cli_1.displayBrandedMessage)("Exiting RoboInsights. Goodbye!", "Exit");
                    break;
            }
        }
    }
    /**
     * Show a menu of configuration options for the VEX Brain
     */
    async showConfigurationMenu() {
        if (!this.brainConnection.isConnected) {
            (0, cli_1.displayBrandedMessage)("Not connected to a VEX Brain.", "Error", {
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
        const selection = await (0, cli_1.cliSelect)(configOptions, {
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
    async configureLogLevel() {
        const logLevels = ["DEBUG", "INFO", "WARNING", "ERROR", "Cancel"];
        const selection = await (0, cli_1.cliSelect)(logLevels, {
            title: "Set Log Level",
            prompt: "Select the minimum log level:",
            showBanner: false,
        });
        if (selection !== "Cancel") {
            try {
                const response = await this.brainConnection.sendCommand(`SET_LOG_LEVEL:${selection}`);
                await this.showCommandResponsePopup(response, true);
                this.ui.addData(chalk_1.default.green(`Log level set to: ${selection}`));
            }
            catch (err) {
                await this.showCommandResponsePopup(err.message, false);
                this.ui.addData(chalk_1.default.red(`Error setting log level: ${err.message || "Unknown error"}`));
            }
        }
    }
    /**
     * Configure console output
     */
    async configureConsoleOutput() {
        const options = [
            "Enable Console Output",
            "Disable Console Output",
            "Cancel",
        ];
        const selection = await (0, cli_1.cliSelect)(options, {
            title: "Console Output Configuration",
            prompt: "Select an option:",
            showBanner: false,
        });
        try {
            let response = "";
            switch (selection) {
                case "Enable Console Output":
                    response = await this.brainConnection.sendCommand("ENABLE_CONSOLE_OUTPUT");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("Console output enabled"));
                    break;
                case "Disable Console Output":
                    response = await this.brainConnection.sendCommand("DISABLE_CONSOLE_OUTPUT");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("Console output disabled"));
                    break;
            }
        }
        catch (err) {
            await this.showCommandResponsePopup(err.message, false);
            this.ui.addData(chalk_1.default.red(`Error configuring console output: ${err.message || "Unknown error"}`));
        }
    }
    /**
     * Configure file output
     */
    async configureFileOutput() {
        const options = ["Enable File Output", "Disable File Output", "Cancel"];
        const selection = await (0, cli_1.cliSelect)(options, {
            title: "File Output Configuration",
            prompt: "Select an option:",
            showBanner: false,
        });
        try {
            let response = "";
            switch (selection) {
                case "Enable File Output":
                    response = await this.brainConnection.sendCommand("ENABLE_FILE_OUTPUT");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("File output enabled"));
                    break;
                case "Disable File Output":
                    response = await this.brainConnection.sendCommand("DISABLE_FILE_OUTPUT");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("File output disabled"));
                    break;
            }
        }
        catch (err) {
            await this.showCommandResponsePopup(err.message, false);
            this.ui.addData(chalk_1.default.red(`Error configuring file output: ${err.message || "Unknown error"}`));
        }
    }
    /**
     * Configure log filename
     */
    async configureLogFilename() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        console.clear();
        console.log(chalk_1.default.cyan("=== Set Log Filename ===\n"));
        const filename = await new Promise((resolve) => {
            rl.question(chalk_1.default.cyan("Enter log filename: "), (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
        if (filename) {
            try {
                const response = await this.brainConnection.sendCommand(`SET_LOG_FILENAME:${filename}`);
                await this.showCommandResponsePopup(response, true);
                this.ui.addData(chalk_1.default.green(`Log filename set to: ${filename}`));
            }
            catch (err) {
                await this.showCommandResponsePopup(err.message, false);
                this.ui.addData(chalk_1.default.red(`Error setting log filename: ${err.message || "Unknown error"}`));
            }
        }
    }
    /**
     * Clear the log file
     */
    async clearLogFile() {
        try {
            const response = await this.brainConnection.sendCommand("CLEAR_LOG_FILE");
            await this.showCommandResponsePopup(response, true);
            this.ui.addData(chalk_1.default.green("Log file cleared"));
        }
        catch (err) {
            await this.showCommandResponsePopup(err.message, false);
            this.ui.addData(chalk_1.default.red(`Error clearing log file: ${err.message || "Unknown error"}`));
        }
    }
    /**
     * Configure time series logging
     */
    async configureTimeSeriesLogging() {
        const options = [
            "Start Time Series Logging",
            "Stop Time Series Logging",
            "Cancel",
        ];
        const selection = await (0, cli_1.cliSelect)(options, {
            title: "Time Series Logging Configuration",
            prompt: "Select an option:",
            showBanner: false,
        });
        try {
            let response = "";
            switch (selection) {
                case "Start Time Series Logging":
                    response = await this.brainConnection.sendCommand("START_TIME_SERIES");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("Time series logging started"));
                    break;
                case "Stop Time Series Logging":
                    response = await this.brainConnection.sendCommand("STOP_TIME_SERIES");
                    await this.showCommandResponsePopup(response, true);
                    this.ui.addData(chalk_1.default.green("Time series logging stopped"));
                    break;
            }
        }
        catch (err) {
            await this.showCommandResponsePopup(err.message, false);
            this.ui.addData(chalk_1.default.red(`Error configuring time series logging: ${err.message || "Unknown error"}`));
        }
    }
    /**
     * Send a PING command to check connectivity
     */
    async sendPingCommand() {
        try {
            const response = await this.brainConnection.sendCommand("PING");
            await this.showCommandResponsePopup(response, true);
            this.ui.addData(chalk_1.default.green("PING command sent successfully, received PONG response"));
        }
        catch (err) {
            await this.showCommandResponsePopup(err.message, false);
            this.ui.addData(chalk_1.default.red(`Error sending PING command: ${err.message || "Unknown error"}`));
        }
    }
    /**
     * Download JSON data from the VEX Brain
     */
    async downloadJSON() {
        if (!this.ui.hasJSON()) {
            (0, cli_1.displayBrandedMessage)("No valid JSON data available to download.", "Download JSON", { borderColor: "yellow" });
            return;
        }
        const jsonData = this.ui.getJSON();
        if (!jsonData) {
            (0, cli_1.displayBrandedMessage)("Error retrieving JSON data.", "Download JSON", {
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
            const fileName = await new Promise((resolve) => {
                rl.question(chalk_1.default.cyan("Enter filename (leave blank for auto-generated name): "), (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
            });
            // Save the file
            const savedPath = await (0, serial_1.saveJSONToFile)(jsonData, fileName || undefined);
            (0, cli_1.displayBrandedMessage)(`JSON data successfully saved to:\n${savedPath}`, "Download Complete", { borderColor: "green" });
            this.ui.addData(chalk_1.default.green(`JSON data saved to: ${savedPath}`));
        }
        catch (error) {
            (0, cli_1.displayBrandedMessage)(`Error saving JSON data: ${error.message}`, "Download Failed", { borderColor: "red" });
        }
    }
    /**
     * Send a command to the Brain
     */
    async sendCommand() {
        if (!this.brainConnection.isConnected) {
            (0, cli_1.displayBrandedMessage)("Not connected to a VEX Brain.", "Error", {
                borderColor: "red",
            });
            return;
        }
        // Create a readline interface for command input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const command = await new Promise((resolve) => {
            rl.question(chalk_1.default.cyan("Enter command to send: "), (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
        if (command) {
            try {
                await this.brainConnection.sendCommand(command);
                console.log(chalk_1.default.green(`Command sent: ${command}`));
            }
            catch (err) {
                const errorMessage = (err === null || err === void 0 ? void 0 : err.message) || "Unknown error";
                console.error(chalk_1.default.red("Error sending command:"), errorMessage);
            }
        }
    }
    /**
     * Display connection information
     */
    displayConnectionInfo() {
        const info = this.brainConnection.isConnected
            ? "Connected to VEX Brain"
            : "Not connected to any device";
        (0, cli_1.displayBrandedMessage)(info, "Connection Status", {
            borderColor: this.brainConnection.isConnected ? "green" : "yellow",
        });
    }
    /**
     * Reconnect to the Brain
     */
    async reconnect() {
        // Disconnect first if already connected
        if (this.brainConnection.isConnected) {
            this.brainConnection.disconnect();
        }
        await this.connectToPort();
    }
    /**
     * Disconnect from the Brain
     */
    disconnect() {
        if (this.brainConnection.isConnected) {
            this.brainConnection.disconnect();
            (0, cli_1.displayBrandedMessage)("Disconnected from VEX Brain", "Disconnected");
        }
        else {
            console.log(chalk_1.default.yellow("Not currently connected."));
        }
    }
}
// Start the application
if (require.main === module) {
    const app = new RoboInsightsApp();
    app.start().catch((err) => {
        console.error(chalk_1.default.red("Fatal error:"), err);
        process.exit(1);
    });
}

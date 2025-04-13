"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliSelect = cliSelect;
var readline = require("readline");
/**
 * A simple CLI selector that allows users to select an option using arrow keys
 * @param options Array of options to select from
 * @param prompt Optional prompt text to display
 * @returns Promise resolving to the selected option
 */
function cliSelect(options, prompt) {
    if (prompt === void 0) { prompt = "Select an option:"; }
    return new Promise(function (resolve) {
        if (options.length === 0) {
            throw new Error("No options provided");
        }
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // Configure terminal for raw mode
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        var selectedIndex = 0;
        // Function to render the options
        var render = function () {
            // Clear the output
            console.clear();
            console.log(prompt + "\n");
            // Display all options
            options.forEach(function (option, index) {
                var prefix = index === selectedIndex ? "> " : "  ";
                console.log("".concat(prefix).concat(option));
            });
        };
        // Initial render
        render();
        // Handle keypress events
        process.stdin.on("keypress", function (_, key) {
            if (key) {
                // Handle exit keys
                if (key.name === "c" && key.ctrl) {
                    process.exit();
                }
                // Handle navigation keys
                if (key.name === "up" && selectedIndex > 0) {
                    selectedIndex--;
                    render();
                }
                else if (key.name === "down" && selectedIndex < options.length - 1) {
                    selectedIndex++;
                    render();
                }
                else if (key.name === "return") {
                    // User made a selection with Enter key
                    rl.close();
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(false);
                    }
                    process.stdin.removeAllListeners("keypress");
                    resolve(options[selectedIndex]);
                }
            }
        });
    });
}
// Example usage
if (require.main === module) {
    var options = ["Option 1", "Option 2", "Option 3", "Exit"];
    cliSelect(options, "Please select an option:").then(function (selection) {
        console.log("You selected: ".concat(selection));
        process.exit(0);
    });
}

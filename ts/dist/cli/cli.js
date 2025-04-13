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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliSelect = cliSelect;
const readline = __importStar(require("readline"));
/**
 * A simple CLI selector that allows users to select an option using arrow keys
 * @param options Array of options to select from
 * @param prompt Optional prompt text to display
 * @returns Promise resolving to the selected option
 */
function cliSelect(options, prompt = "Select an option:") {
    return new Promise((resolve) => {
        if (options.length === 0) {
            throw new Error("No options provided");
        }
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // Configure terminal for raw mode
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        let selectedIndex = 0;
        // Function to render the options
        const render = () => {
            // Clear the output
            console.clear();
            console.log(prompt + "\n");
            // Display all options
            options.forEach((option, index) => {
                const prefix = index === selectedIndex ? "> " : "  ";
                console.log(`${prefix}${option}`);
            });
        };
        // Initial render
        render();
        // Handle keypress events
        process.stdin.on("keypress", (_, key) => {
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
    const options = ["Option 1", "Option 2", "Option 3", "Exit"];
    cliSelect(options, "Please select an option:").then((selection) => {
        console.log(`You selected: ${selection}`);
        process.exit(0);
    });
}

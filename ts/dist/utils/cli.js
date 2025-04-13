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
exports.cliSelect = cliSelect;
exports.displayBrandedMessage = displayBrandedMessage;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const figlet = __importStar(require("figlet"));
const boxen_1 = __importDefault(require("boxen"));
const roboinsights = `
                                                                                                                                                                                                        
                                                                                                                                                                                                        
                                                                                                                                                                                                        
        :??:                                                                                                                                                                                            
        G@@B                                                                                                                                                                                            
        B@@B                         .5B5:                                                                                                                                                              
        B@@B                         5@@@~                                    .~~~.                         ^JJ!                              :?Y7                  ^~~:                                
        B@@B                        7@@@Y       7GPGGGGGP5?^                  !@@&:                         B@@#.                             P@@&:                .#@@7           .~~^                 
        B@@B         ^7??!:        7@@@P        G@@BJJJYG@@@J                 Y@@P                          :!!:                              .!!:                 ~@@&.           J@@Y                 
        B@@B       !B@@@@@@P^     J@@@P.       :&@@!     P@@G   :75GGGG57:    B@@J!5GGPJ:    :7YPGGG5?^  ~5YYYJ.  7YY:^YPGG5!    ~JPGGGPY7::55YYY:   :!YPGGGPY7~   Y@@P^YPGG5!  ^55&@@GY5^ :?5GGGG5?~   
        B@@B      5@@@P!7B@@&?.:!B@@@J         7@@&.    :#@@? .5@@#5JJP@@&?  ^@@@&BYJP@@&!  J&@&5JJ5&@@Y !5#@@#   B@@B#PJY&@@J .P@@BJ?J5BB~^5B@@&:  J&@&5???B@@#.  B@@&#PJY&@@J ~5B@@&555:?@@&5?JYG#J   
        B@@B     5@@@?   .Y@@@&&@@@P~          5@@&YYJYP&@&Y  G@@Y     !@@&: ?@@&!    P@@P 5@@P.    ^@@@~  G@@Y  ^@@@P:   5@@P ^@@@J.        Y@@P  5@@G.    P@@5  ^@@@P:   5@@P   Y@@P    B@@G:         
        B@@B    7@@@J      ^JPBGPJ^           .#@@BPG&@@#!:  !@@&.     ~@@&: G@@J     P@@Y:@@@^     :&@@~ :&@@~  ?@@B     B@@?  7B&@@#PJ^   .#@@? ^@@@^    .&@@!  ?@@B     B@@?   #@@7    ^P&@@&GY!     
        B@@B   .&@@B                          ~@@@^  ~@@@7   Y@@P      5@@P :&@@~    :&@@~7@@#      ?@@B  7@@#.  G@@Y    ^@@@^    :~?P&@@Y  ^@@@^ ?@@B     7@@&:  P@@Y    ^@@@^  ~@@&:      .^7Y#@@B.   
        B@@B   Y@@@~                          J@@B    ?@@@!  ?@@#^   .J@@#: 7@@#.   ^G@@5 !@@&!   .7&@&~  5@@P  :&@@!    ?@@B .7!.    5@@B  J@@B  7@@&!..~5@@@G  :&@@!    ?@@B   J@@B.   ~7:    7@@@^   
        B@@B   5@@5                           B@@Y     Y@@&^  ?#@@#BB&@#Y.  J&@@BGG#@@G7   7B@@#BB&@&5:  .#@@7  !@@&.    G@@Y ?#@&#BB&@&G~  G@@Y   ?B@@&##5B@@?  !@@&.    G@@Y   7@@@##5^B@@#BB#@@#?    
        B@@B    ::                            ~~~.      ~~~:   .^!7?7!^.     .^!7??7~:       ^!7??!^.    .~~~.  :~~^     ~~~:  .:!7??7~:    ~~~.     :^~: :&@@:  :~~^     ~~~:    :!7?7~  :~7??7!^.     
        B@@B                                                                                                                                      ^5?!~~!Y&@&7                                          
        J@@@P?????????????????????????????~                                                                                                       !PB##&&#P?:                                           
         7B@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&.                                                                                                          ...                                               
           :~!!!!!!!!!!!!!!!!!!!!!!!!!!!!!:                                                                                                                                                             
                                                                                                                                                                                                        
                                                                                                                                                                                                        
                                                                                                                                                                                                        `;
// Fixed chalk theme setup to avoid "Cannot read properties of undefined" error
const defaultOptions = {
    title: undefined,
    prompt: "Select an option:",
    cursorSymbol: "▶",
    theme: {
        title: (text) => chalk_1.default.bold.cyan(text),
        cursor: (text) => chalk_1.default.bold.yellow(text),
        selected: (text) => chalk_1.default.bold.green(text),
        unselected: (text) => chalk_1.default.white(text),
        prompt: (text) => chalk_1.default.bold.blue(text),
    },
    showBanner: true,
    bannerText: "RoboInsights",
    clearScreen: true,
    boxWidth: 60,
};
/**
 * Renders a fancy ASCII art banner
 * @param text The text to display in the banner
 * @returns The formatted banner string
 */
function renderBanner(text) {
    try {
        return figlet.textSync(text, {
            font: "Standard",
            horizontalLayout: "default",
            verticalLayout: "default",
        });
    }
    catch (err) {
        return `=== ${text} ===`;
    }
}
/**
 * A fancy CLI selector that allows users to select an option using arrow keys
 * @param options Array of options to select from
 * @param userOptions Configuration options for the CLI
 * @returns Promise resolving to the selected option
 */
function cliSelect(options, userOptions = {}) {
    var _a, _b, _c, _d, _e;
    // Merge user options with defaults - fixed to properly handle functions
    const opts = { ...defaultOptions, ...userOptions };
    // Carefully merge theme options to avoid undefined errors
    opts.theme = {
        title: ((_a = userOptions.theme) === null || _a === void 0 ? void 0 : _a.title) || defaultOptions.theme.title,
        cursor: ((_b = userOptions.theme) === null || _b === void 0 ? void 0 : _b.cursor) || defaultOptions.theme.cursor,
        selected: ((_c = userOptions.theme) === null || _c === void 0 ? void 0 : _c.selected) || defaultOptions.theme.selected,
        unselected: ((_d = userOptions.theme) === null || _d === void 0 ? void 0 : _d.unselected) || defaultOptions.theme.unselected,
        prompt: ((_e = userOptions.theme) === null || _e === void 0 ? void 0 : _e.prompt) || defaultOptions.theme.prompt,
    };
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
            // Clear the output if requested
            if (opts.clearScreen) {
                console.clear();
            }
            // Show banner if requested
            if (opts.showBanner && opts.bannerText) {
                const banner = renderBanner(opts.bannerText);
                console.log(chalk_1.default.cyan(banner) + "\n");
            }
            // Display title if provided
            if (opts.title) {
                console.log(opts.theme.title(opts.title) + "\n");
            }
            // Display prompt
            console.log(opts.theme.prompt(opts.prompt) + "\n");
            // Build the options display
            const optionsDisplay = options
                .map((option, index) => {
                const prefix = index === selectedIndex
                    ? opts.theme.cursor(`${opts.cursorSymbol} `)
                    : "  ";
                const optionText = index === selectedIndex
                    ? opts.theme.selected(String(option))
                    : opts.theme.unselected(String(option));
                return `${prefix}${optionText}`;
            })
                .join("\n");
            // Display in a box if boxWidth is set
            if (opts.boxWidth && opts.boxWidth > 0) {
                const boxedOptions = (0, boxen_1.default)(optionsDisplay, {
                    padding: 1,
                    margin: 0,
                    borderStyle: "round",
                    borderColor: "cyan",
                });
                console.log(boxedOptions);
            }
            else {
                console.log(optionsDisplay);
            }
        };
        // Initial render
        render();
        // Handle keypress events
        process.stdin.on("keypress", (_, key) => {
            if (key) {
                // Handle exit keys
                if (key.name === "c" && key.ctrl) {
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(false);
                    }
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
/**
 * Displays a branded message in a stylish box
 * @param message Message to display
 * @param title Optional title for the box
 * @param style Box style configuration
 */
function displayBrandedMessage(message, title, style) {
    const defaultStyle = {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: title,
        titleAlignment: "center",
    };
    const boxStyle = { ...defaultStyle, ...(style || {}) };
    const boxedMessage = (0, boxen_1.default)(message, boxStyle);
    console.log(boxedMessage);
}
// Example usage
if (require.main === module) {
    const options = ["Option 1", "Option 2", "Option 3", "Exit"];
    cliSelect(options, {
        title: "Test CLI Selection",
        prompt: "Please select an option:",
        showBanner: true,
        bannerText: "TEST CLI",
    }).then((selection) => {
        displayBrandedMessage(`You selected: ${selection}`, "Result");
        process.exit(0);
    });
}

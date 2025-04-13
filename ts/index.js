"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var serialport_1 = require("serialport");
var cli_1 = require("./cli/cli");
/**
 * Cleans up the received data from the VEX Brain by removing unwanted patterns.
 * @param data The raw data received from the Brain.
 * @returns The cleaned-up data.
 */
function cleanOutput(data) {
    // Remove all occurrences of "[some-character]sout" from the data
    return data.replace(/[^\w\s]*sout/g, "").trim();
}
/**
 * Lists all available serial ports.
 * @returns Promise resolving to an array of port paths.
 */
function listSerialPorts() {
    return __awaiter(this, void 0, void 0, function () {
        var ports, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, serialport_1.SerialPort.list()];
                case 1:
                    ports = _a.sent();
                    return [2 /*return*/, ports.map(function (port) { return "".concat(port.path, " - ").concat(port.manufacturer || "Unknown"); })];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error listing serial ports:", error_1);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Connects to the VEX V5 Brain on the given port and reads data.
 * @param portPath The path to the port (e.g., 'COM6').
 */
function connectToVEXBrain(portPath) {
    return __awaiter(this, void 0, void 0, function () {
        var port;
        return __generator(this, function (_a) {
            console.log("Connecting to VEX Brain on port: ".concat(portPath));
            port = new serialport_1.SerialPort({
                path: portPath, // COM6 for User Port
                baudRate: 115200, // Baud rate for VEX V5 communication
                autoOpen: false, // Do not open immediately
            });
            // Open the port
            port.open(function (err) {
                if (err) {
                    console.error("Error opening port:", err.message);
                    return;
                }
                console.log("Successfully connected to VEX Brain on ".concat(portPath));
            });
            // Listen for data from the Brain
            port.on("data", function (data) {
                var rawData = data.toString();
                var cleanedData = cleanOutput(rawData);
                console.log("Cleaned Data from VEX Brain: ".concat(cleanedData));
            });
            // Handle port errors
            port.on("error", function (err) {
                console.error("Serial port error:", err.message);
            });
            // Close the port gracefully
            port.on("close", function () {
                console.log("Serial port closed.");
            });
            // Example: Write a command to the Brain (optional, depending on your use case)
            port.write("PING\n", function (err) {
                if (err) {
                    console.error("Error writing to port:", err.message);
                }
                else {
                    console.log("Command sent to VEX Brain: PING");
                }
            });
            return [2 /*return*/];
        });
    });
}
// Start the connection process
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var availablePorts, selectedOption, portPath, rl_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, listSerialPorts()];
            case 1:
                availablePorts = _a.sent();
                if (availablePorts.length === 0) {
                    console.error("No serial ports detected. Please ensure your VEX Brain is connected.");
                    return [2 /*return*/];
                }
                // Add a manual entry option
                availablePorts.push("Enter port manually");
                return [4 /*yield*/, (0, cli_1.cliSelect)(availablePorts, "Select the port connected to your VEX Brain:")];
            case 2:
                selectedOption = _a.sent();
                portPath = void 0;
                if (!(selectedOption === "Enter port manually")) return [3 /*break*/, 4];
                rl_1 = require("readline").createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                return [4 /*yield*/, new Promise(function (resolve) {
                        rl_1.question("Enter the port name (e.g., COM6): ", function (answer) {
                            rl_1.close();
                            resolve(answer.trim());
                        });
                    })];
            case 3:
                portPath = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                // Extract the port path from the selected option (format: "COM6 - VEX")
                portPath = selectedOption.split(" - ")[0];
                _a.label = 5;
            case 5:
                if (!portPath) {
                    console.error("No port selected. Exiting.");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, connectToVEXBrain(portPath)];
            case 6:
                _a.sent();
                return [3 /*break*/, 8];
            case 7:
                error_2 = _a.sent();
                console.error("Error connecting to VEX Brain:", error_2);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); })();

#include "main.h"
#include "insights/logging/logging.h"
#include "insights/utilities/utilities.h"

using namespace insights;
using namespace insights::logging;

pros::Motor motor(1); // Replace with your motor port

// Define some values to track
int getTemperature()
{
    // Implementation to get temperature from sensor
    return 25;
}

// Example function to get sensor readings
float getBatteryVoltage()
{
    return pros::battery::get_voltage() / 1000.0f; // Convert millivolts to volts
}

// Track motor temperature
int getMotorTemperature(int port)
{
    pros::Motor motor(port);
    return motor.get_temperature();
}

void initialize()
{
    // Initialize the robot's systems here
    // For example, you can initialize motors, sensors, etc.
    // Example: pros::Motor motor(1);
    // motor.move_velocity(100);
    pros::lcd::initialize();

    // Initialize the logger
    auto &logger = Logger::getInstance();
    // Configure logger
    logger.setSDCardPath("/usd/");
    logger.setTimeSeriesFileName("robot_data.json");
    logger.enableFileOutput(true);
    logger.clearLogFile();
    logger.clearTimeSeriesFile();
    // Register values to track
    // Method 1: Using the trackValue template method

    logger.trackValue<int>(
        "motor_voltage",
        []() -> int
        {
            return motor.get_actual_velocity();
        },
        "VOLTAGE",
        std::chrono::seconds(1));

    // Start the time series logging (this launches a background thread)
    logger.startTimeSeriesLogging();

    LOG_INFO("Robot initialization complete");

    for (int i = 0; i < 60; i++)
    {
        motor.move(i);
        pros::delay(100);
    } // Simulate motor movement
    insights::logging::Logger::getInstance().stopTimeSeriesLogging();
    motor.move(0);
    std::cout << "Motor test complete" << std::endl;
    char buffer[10240]; // 10 KB buffer for JSON data
    logger.readJSONFromSDCard(buffer, sizeof(buffer));
    std::cout << "Read from SD card: " << buffer << std::endl;
    pros::lcd::print(2, buffer);
}

/**
 * Runs while the robot is in the disabled state of Field Management System or
 * the VEX Competition Switch, following either autonomous or opcontrol. When
 * the robot is enabled, this task will exit.
 */
void disabled()
{
    // Stop logging when robot is disabled
}

/**
 * Runs after initialize(), and before autonomous when connected to the Field
 * Management System or the VEX Competition Switch. This is intended for
 * competition-specific initialization routines, such as an autonomous selector
 * on the LCD.
 *
 * This task will exit when the robot is enabled and autonomous or opcontrol
 * starts.
 */
void competition_initialize() {}

/**
 * Runs the user autonomous code. This function will be started in its own task
 * with the default priority and stack size whenever the robot is enabled via
 * the Field Management System or the VEX Competition Switch in the autonomous
 * mode. Alternatively, this function may be called in initialize or opcontrol
 * for non-competition testing purposes.
 *
 * If the robot is disabled or communications is lost, the autonomous task
 * will be stopped. Re-enabling the robot will restart the task, not re-start it
 * from where it left off.
 */
void autonomous() {}

/**
 * Runs the operator control code. This function will be started in its own task
 * with the default priority and stack size whenever the robot is enabled via
 * the Field Management System or the VEX Competition Switch in the operator
 * control mode.
 *
 * If no competition control is connected, this function will run immediately
 * following initialize().
 *
 * If the robot is disabled or communications is lost, the
 * operator control task will be stopped. Re-enabling the robot will restart the
 * task, not resume it from where it left off.
 */
void opcontrol()
{
}
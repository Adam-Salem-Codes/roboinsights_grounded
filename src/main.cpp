#include "main.h"
#include "insights/logging/logging.h"

void initialize()
{
    // Initialize the robot's systems here
    // For example, you can initialize motors, sensors, etc.
    // Example: pros::Motor motor(1);
    // motor.move_velocity(100);
    pros::lcd::initialize();
    pros::lcd::set_text(1, "Robot is initializing...");
    nlohmann::json json_data;
    json_data["robot"] = "VEX V5";
    json_data["status"] = "initializing";
    json_data["timestamp"] = pros::millis();
    // Initialize logging
    insights::logging::logJSON(json_data);

    char buffer[1024];
    insights::logging::readJSONFromSDCard(buffer, sizeof(buffer));
    std::cout << "Read from SD card: " << buffer << std::endl;
    pros::lcd::set_text(2, buffer);
}

/**
 * Runs while the robot is in the disabled state of Field Management System or
 * the VEX Competition Switch, following either autonomous or opcontrol. When
 * the robot is enabled, this task will exit.
 */
void disabled() {}

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
#include "main.h"
#include "insights/logging/logging.h"
#include "insights/graphics.h"
#include "pros/llemu.hpp"
#include "liblvgl/lvgl.h"
#include <chrono>

using namespace insights;
using namespace insights::logging;

void initialize()
{
    insights::graphics::initGraphics();

    // Create a dashboard view
    auto dashView = insights::graphics::createDashboardView();
    dashView->addStatusCard("Battery", "12.6V");
    dashView->addBatteryStatus(95);

    // Create a console view
    auto consoleView = insights::graphics::createConsoleView();

    // Register views with the system
    auto &viewManager = insights::graphics::ViewManager::getInstance();
    viewManager.registerView(dashView);
    viewManager.registerView(consoleView);

    // Switch to dashboard view
    insights::graphics::switchView("Dashboard");
}

/**
 * Runs while the robot is disabled.
 */
void disabled()
{
}

/**
 * Runs after initialize(), before autonomous.
 */
void competition_initialize()
{
}

/**
 * Runs the user autonomous code.
 */
void autonomous()
{
}

/**
 * Runs the operator control code.
 */
void opcontrol()
{
}
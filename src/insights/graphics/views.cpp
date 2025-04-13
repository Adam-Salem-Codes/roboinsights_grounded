#include "insights/graphics/views.h"
#include "insights/logging/logging.h"
#define LOG_INFO(msg) insights::logging::log(msg)
#include "api.h"
#include <iomanip>
#include <sstream>
#include <ctime>
#include <cstdlib>
#include "insights/graphics/views.h"

// Forward declarations for Montserrat fonts
LV_FONT_DECLARE(lv_font_montserrat_10);
LV_FONT_DECLARE(lv_font_montserrat_12);
LV_FONT_DECLARE(lv_font_montserrat_14);
LV_FONT_DECLARE(lv_font_montserrat_16);
LV_FONT_DECLARE(lv_font_montserrat_18);
LV_FONT_DECLARE(lv_font_montserrat_20);
LV_FONT_DECLARE(lv_font_montserrat_22);
LV_FONT_DECLARE(lv_font_montserrat_24);
LV_FONT_DECLARE(lv_font_montserrat_26);
LV_FONT_DECLARE(lv_font_montserrat_28);
LV_FONT_DECLARE(lv_font_montserrat_30);
LV_FONT_DECLARE(lv_font_montserrat_32);

// Corrected logging function usage
namespace insights
{
    namespace logging
    {
        void log(const std::string &message)
        {
            std::cout << message << std::endl;
        }
    } // namespace logging
} // namespace insights

namespace insights
{
    namespace graphics
    {

        // DashboardView implementation
        DashboardView::DashboardView(const std::string &name) : View(name)
        {
        }

        void DashboardView::initialize(lv_obj_t *parent)
        {
            // Create the base container
            obj = lv_obj_create(parent);
            lv_obj_set_size(obj, lv_obj_get_width(parent), lv_obj_get_height(parent));
            lv_obj_set_pos(obj, 0, 0);
            lv_obj_add_flag(obj, LV_OBJ_FLAG_HIDDEN); // Hidden by default

            // Create title
            lv_obj_t *title = lv_label_create(obj);
            lv_label_set_text(title, "Dashboard");
            lv_obj_set_style_text_font(title, &lv_font_montserrat_20, 0);
            lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 10);

            // Create cards container for status items
            cardsContainer = lv_obj_create(obj);
            lv_obj_set_size(cardsContainer, lv_obj_get_width(obj) - 20, lv_obj_get_height(obj) * 0.4);
            lv_obj_align(cardsContainer, LV_ALIGN_TOP_MID, 0, 50);
            lv_obj_set_flex_flow(cardsContainer, LV_FLEX_FLOW_ROW_WRAP);
            lv_obj_set_flex_align(cardsContainer, LV_FLEX_ALIGN_SPACE_EVENLY, LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_START);
            lv_obj_set_style_pad_all(cardsContainer, 10, 0);
            lv_obj_set_style_pad_row(cardsContainer, 10, 0);
            lv_obj_set_style_pad_column(cardsContainer, 10, 0);
            lv_obj_set_style_bg_opa(cardsContainer, 0, 0); // Transparent background

            // Create charts container
            chartsContainer = lv_obj_create(obj);
            lv_obj_set_size(chartsContainer, lv_obj_get_width(obj) - 20, lv_obj_get_height(obj) * 0.45);
            lv_obj_align(chartsContainer, LV_ALIGN_BOTTOM_MID, 0, -10);
            lv_obj_set_flex_flow(chartsContainer, LV_FLEX_FLOW_COLUMN);
            lv_obj_set_style_pad_all(chartsContainer, 10, 0);
            lv_obj_set_style_pad_row(chartsContainer, 10, 0);
            lv_obj_set_style_bg_opa(chartsContainer, 0, 0); // Transparent background

            LOG_INFO("Dashboard view initialized");
        }

        void DashboardView::update()
        {
            // Update all widgets
            for (auto &widget : widgets)
            {
                widget->update();
            }

            // Update stats in widgets
            updateStats();
        }

        void DashboardView::updateStats()
        {
            LOG_INFO("Updating stats...");
        }

        std::shared_ptr<Label> DashboardView::addStatusCard(
            const std::string &title,
            const std::string &initialValue,
            const char * /*icon*/)
        {

            // Create card container
            lv_obj_t *card = lv_obj_create(cardsContainer);
            lv_obj_set_size(card, lv_obj_get_width(cardsContainer) / 2 - 20, 80);
            lv_obj_set_style_radius(card, 10, 0);
            lv_obj_set_style_bg_color(card, lv_color_hex(0x2D3746), 0);
            lv_obj_set_style_border_width(card, 0, 0);
            lv_obj_set_style_shadow_width(card, 5, 0);
            lv_obj_set_style_shadow_color(card, lv_color_hex(0x000000), 0);
            lv_obj_set_style_shadow_opa(card, 100, 0);

            // Add title
            lv_obj_t *titleLabel = lv_label_create(card);
            lv_label_set_text(titleLabel, title.c_str());
            lv_obj_align(titleLabel, LV_ALIGN_TOP_MID, 0, 10);
            lv_obj_set_style_text_color(titleLabel, lv_color_hex(0xBBBBBB), 0);

            // Create value label
            auto valueLabel = std::make_shared<Label>(title + "_value", initialValue);
            valueLabel->initialize(card);
            lv_obj_align(valueLabel->getObject(), LV_ALIGN_CENTER, 0, 10);
            lv_obj_set_style_text_font(valueLabel->getObject(), &lv_font_montserrat_20, 0);
            lv_obj_set_style_text_color(valueLabel->getObject(), lv_color_hex(0xFFFFFF), 0);

            // Add to our widget list and return
            widgets.push_back(valueLabel);
            statusLabels.push_back(valueLabel);

            return valueLabel;
        }

        std::shared_ptr<ProgressBar> DashboardView::addBatteryStatus(int initialPercent)
        {
            // Create container
            lv_obj_t *container = lv_obj_create(cardsContainer);
            lv_obj_set_size(container, lv_obj_get_width(cardsContainer) - 20, 60);
            lv_obj_set_style_radius(container, 10, 0);
            lv_obj_set_style_bg_color(container, lv_color_hex(0x2D3746), 0);
            lv_obj_set_style_border_width(container, 0, 0);

            // Add title
            lv_obj_t *titleLabel = lv_label_create(container);
            lv_label_set_text(titleLabel, "Battery");
            lv_obj_align(titleLabel, LV_ALIGN_TOP_LEFT, 10, 5);
            lv_obj_set_style_text_color(titleLabel, lv_color_hex(0xBBBBBB), 0);

            // Create progress bar
            auto batteryBar = std::make_shared<ProgressBar>("battery_level", 0, 100, initialPercent);
            batteryBar->initialize(container);
            lv_obj_set_size(batteryBar->getObject(), lv_obj_get_width(container) - 20, 20);
            lv_obj_align(batteryBar->getObject(), LV_ALIGN_BOTTOM_MID, 0, -5);

            // Set colors based on level
            if (initialPercent > 60)
            {
                batteryBar->setColors(lv_color_hex(0x4CAF50), lv_color_hex(0x333333)); // Green
            }
            else if (initialPercent > 20)
            {
                batteryBar->setColors(lv_color_hex(0xFFC107), lv_color_hex(0x333333)); // Yellow
            }
            else
            {
                batteryBar->setColors(lv_color_hex(0xF44336), lv_color_hex(0x333333)); // Red
            }

            // Add percentage label
            std::string percentText = std::to_string(initialPercent) + "%";
            lv_obj_t *percentLabel = lv_label_create(container);
            lv_label_set_text(percentLabel, percentText.c_str());
            lv_obj_align(percentLabel, LV_ALIGN_TOP_RIGHT, -10, 5);

            // Add to our widget list and return
            widgets.push_back(batteryBar);

            return batteryBar;
        }

        std::shared_ptr<Label> DashboardView::addSensorDisplay(
            const std::string &name,
            const std::string &unit,
            double initialValue,
            double min,
            double max)
        {

            // Create container
            lv_obj_t *container = lv_obj_create(cardsContainer);
            lv_obj_set_size(container, lv_obj_get_width(cardsContainer) / 2 - 20, 80);
            lv_obj_set_style_radius(container, 10, 0);
            lv_obj_set_style_bg_color(container, lv_color_hex(0x2D3746), 0);
            lv_obj_set_style_border_width(container, 0, 0);

            // Add title
            lv_obj_t *titleLabel = lv_label_create(container);
            lv_label_set_text(titleLabel, name.c_str());
            lv_obj_align(titleLabel, LV_ALIGN_TOP_MID, 0, 10);
            lv_obj_set_style_text_color(titleLabel, lv_color_hex(0xBBBBBB), 0);

            // Format value with unit
            std::stringstream ss;
            ss << std::fixed << std::setprecision(1) << initialValue << " " << unit;

            // Create value label
            auto valueLabel = std::make_shared<Label>(name + "_value", ss.str());
            valueLabel->initialize(container);
            lv_obj_align(valueLabel->getObject(), LV_ALIGN_CENTER, 0, 10);
            lv_obj_set_style_text_font(valueLabel->getObject(), &lv_font_montserrat_18, 0);

            // Set color based on value range
            lv_color_t textColor;
            double normalizedValue = (initialValue - min) / (max - min);
            if (normalizedValue < 0.25)
            {
                textColor = lv_color_hex(0x4CAF50); // Green for low values
            }
            else if (normalizedValue > 0.75)
            {
                textColor = lv_color_hex(0xF44336); // Red for high values
            }
            else
            {
                textColor = lv_color_hex(0xFFC107); // Yellow for middle values
            }
            lv_obj_set_style_text_color(valueLabel->getObject(), textColor, 0);

            // Add to our widget list and return
            widgets.push_back(valueLabel);
            statusLabels.push_back(valueLabel);

            return valueLabel;
        }

        std::shared_ptr<Chart> DashboardView::addTimeSeriesChart(
            const std::string &title,
            const std::string &yAxisLabel,
            int min,
            int max)
        {

            // Create container
            lv_obj_t *container = lv_obj_create(chartsContainer);
            lv_obj_set_size(container, lv_obj_get_width(chartsContainer), lv_obj_get_height(chartsContainer) / 2 - 10);
            lv_obj_set_style_radius(container, 10, 0);
            lv_obj_set_style_bg_color(container, lv_color_hex(0x2D3746), 0);
            lv_obj_set_style_border_width(container, 0, 0);

            // Add title
            lv_obj_t *titleLabel = lv_label_create(container);
            lv_label_set_text(titleLabel, title.c_str());
            lv_obj_align(titleLabel, LV_ALIGN_TOP_MID, 0, 5);
            lv_obj_set_style_text_color(titleLabel, lv_color_hex(0xBBBBBB), 0);

            // Add y-axis label
            lv_obj_t *yAxisLbl = lv_label_create(container);
            lv_label_set_text(yAxisLbl, yAxisLabel.c_str());
            lv_obj_set_style_text_color(yAxisLbl, lv_color_hex(0xBBBBBB), 0);
            lv_obj_align(yAxisLbl, LV_ALIGN_LEFT_MID, 5, 0);
            lv_obj_set_style_transform_angle(yAxisLbl, 2700, 0); // 270 degrees * 10

            // Create chart
            auto chart = std::make_shared<Chart>(title + "_chart", Chart::Type::LINE);
            chart->initialize(container);
            lv_obj_set_size(chart->getObject(), lv_obj_get_width(container) - 40, lv_obj_get_height(container) - 40);
            lv_obj_align(chart->getObject(), LV_ALIGN_CENTER, 10, 0);
            chart->setRange(0, 10, min, max);

            // Add a series
            chart->addSeries("data", lv_color_hex(0x2196F3)); // Blue

            // Add to our widget list and return
            widgets.push_back(chart);
            charts.push_back(chart);

            return chart;
        }

        void DashboardView::updateStats()
        {
            // This is where real-time data updates happen
            // For example, updating battery level or sensor readings

            // Update battery voltage if we have battery widgets
            if (!statusLabels.empty())
            {
                float batteryVoltage = pros::battery::get_voltage() / 1000.0f; // Convert from mV to V
                for (auto &label : statusLabels)
                {
                    if (label->getName() == "Battery_value")
                    {
                        std::stringstream ss;
                        ss << std::fixed << std::setprecision(2) << batteryVoltage << "V";
                        label->setText(ss.str());

                        // Update color based on voltage
                        lv_color_t color;
                        if (batteryVoltage >= 12.5f)
                        {
                            color = lv_color_hex(0x4CAF50); // Good - Green
                        }
                        else if (batteryVoltage >= 11.5f)
                        {
                            color = lv_color_hex(0xFFC107); // Medium - Yellow
                        }
                        else
                        {
                            color = lv_color_hex(0xF44336); // Low - Red
                        }
                        label->setTextColor(color);
                    }
                }
            }

            // Example: Add random data points to charts for demonstration
            for (auto &chart : charts)
            {
                static int value = 50;
                // Simple random walk
                value += (rand() % 11) - 5;                // Random change between -5 and +5
                value = std::max(0, std::min(100, value)); // Clamp to 0-100
                chart->addPoint(0, value);
            }
        }

        // Added missing member variables
        std::vector<std::shared_ptr<Label>> statusLabels;
        std::vector<std::shared_ptr<Chart>> charts;

        // Added placeholder for statusLabels
        std::vector<std::string> statusLabels = {"Status 1", "Status 2", "Status 3"};

        // Added placeholder for charts
        std::vector<std::shared_ptr<Chart>> charts;

        // ConsoleView implementation
        ConsoleView::ConsoleView(const std::string &name) : View(name), autoScroll(true), maxLines(1000)
        {
        }

        void ConsoleView::initialize(lv_obj_t *parent)
        {
            // Create the base container
            obj = lv_obj_create(parent);
            lv_obj_set_size(obj, lv_obj_get_width(parent), lv_obj_get_height(parent));
            lv_obj_set_pos(obj, 0, 0);
            lv_obj_add_flag(obj, LV_OBJ_FLAG_HIDDEN); // Hidden by default

            // Create title
            lv_obj_t *title = lv_label_create(obj);
            lv_label_set_text(title, "Console");
            lv_obj_set_style_text_font(title, &lv_font_montserrat_20, 0);
            lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 10);

            // Create a container for the log area (with scrolling capability)
            logContainer = lv_obj_create(obj);
            lv_obj_set_size(logContainer, lv_obj_get_width(obj) - 20, lv_obj_get_height(obj) - 80);
            lv_obj_align(logContainer, LV_ALIGN_CENTER, 0, 10);
            lv_obj_set_style_bg_color(logContainer, lv_color_hex(0x1A1A1A), 0);
            lv_obj_set_style_radius(logContainer, 5, 0);
            lv_obj_set_style_border_width(logContainer, 1, 0);
            lv_obj_set_style_border_color(logContainer, lv_color_hex(0x444444), 0);
            lv_obj_set_style_pad_all(logContainer, 5, 0);

            // Create the log text area
            logArea = lv_label_create(logContainer);
            lv_obj_set_width(logArea, lv_obj_get_width(logContainer) - 10);
            lv_label_set_long_mode(logArea, LV_LABEL_LONG_WRAP);
            lv_label_set_text(logArea, "");

            // Create auto-scroll switch
            lv_obj_t *scrollLabel = lv_label_create(obj);
            lv_label_set_text(scrollLabel, "Auto-scroll:");
            lv_obj_align(scrollLabel, LV_ALIGN_BOTTOM_LEFT, 10, -15);

            lv_obj_t *scrollSwitch = lv_switch_create(obj);
            lv_obj_align(scrollSwitch, LV_ALIGN_BOTTOM_LEFT, 90, -15);
            if (autoScroll)
            {
                lv_obj_add_state(scrollSwitch, LV_STATE_CHECKED);
            }

            lv_obj_add_event_cb(scrollSwitch, [](lv_event_t *e)
                                {
        ConsoleView* view = static_cast<ConsoleView*>(lv_event_get_user_data(e));
        if (view) {
            view->setAutoScroll(lv_obj_has_state(lv_event_get_target(e), LV_STATE_CHECKED));
        } }, LV_EVENT_VALUE_CHANGED, this);

            // Create clear button
            lv_obj_t *clearBtn = lv_btn_create(obj);
            lv_obj_set_size(clearBtn, 60, 30);
            lv_obj_align(clearBtn, LV_ALIGN_BOTTOM_RIGHT, -10, -10);
            lv_obj_set_style_bg_color(clearBtn, lv_color_hex(0xF44336), 0); // Red

            lv_obj_t *clearBtnLabel = lv_label_create(clearBtn);
            lv_label_set_text(clearBtnLabel, "Clear");
            lv_obj_center(clearBtnLabel);

            lv_obj_add_event_cb(clearBtn, [](lv_event_t *e)
                                {
        ConsoleView* view = static_cast<ConsoleView*>(lv_event_get_user_data(e));
        if (view) {
            view->clearLogs();
        } }, LV_EVENT_CLICKED, this);

            // Add a welcome message
            addLogMessage("Console initialized", 0);
            addLogMessage("Welcome to the Insights Graphics Library", 0);

            LOG_INFO("Console view initialized");
        }

        void ConsoleView::update()
        {
            // Regular updates - nothing to do here
        }

        void ConsoleView::addLogMessage(const std::string &message, int logLevel)
        {
            // Get current time for timestamp
            time_t now = time(nullptr);
            tm *ltm = localtime(&now);

            std::stringstream timestampSS;
            timestampSS << std::setfill('0')
                        << std::setw(2) << ltm->tm_hour << ":"
                        << std::setw(2) << ltm->tm_min << ":"
                        << std::setw(2) << ltm->tm_sec;

            // Determine log prefix and color
            std::string prefix;
            lv_color_t color;

            switch (logLevel)
            {
            case 0: // INFO
                prefix = "[INFO] ";
                color = lv_color_hex(0x4CAF50); // Green
                break;
            case 1: // WARNING
                prefix = "[WARN] ";
                color = lv_color_hex(0xFFC107); // Yellow
                break;
            case 2: // ERROR
                prefix = "[ERROR] ";
                color = lv_color_hex(0xF44336); // Red
                break;
            case 3: // DEBUG
                prefix = "[DEBUG] ";
                color = lv_color_hex(0x2196F3); // Blue
                break;
            default:
                prefix = "[INFO] ";
                color = lv_color_hex(0x4CAF50); // Green
                break;
            }

            // Format the log line
            std::string logLine = "[" + timestampSS.str() + "] " + prefix + message;

            // Add to log lines
            logLines.push_back(logLine);

            // Apply max line limit
            if (maxLines > 0 && logLines.size() > maxLines)
            {
                logLines.erase(logLines.begin());
            }

            // Update display
            updateLogDisplay();

            // Scroll to bottom if enabled
            if (autoScroll)
            {
                scrollToBottom();
            }
        }

        void ConsoleView::clearLogs()
        {
            logLines.clear();
            updateLogDisplay();
        }

        void ConsoleView::setAutoScroll(bool enabled)
        {
            autoScroll = enabled;
            if (autoScroll)
            {
                scrollToBottom();
            }
        }

        bool ConsoleView::isAutoScrollEnabled() const
        {
            return autoScroll;
        }

        void ConsoleView::setMaxLogLines(uint32_t lines)
        {
            maxLines = lines;

            // Apply limit if we already exceed it
            while (maxLines > 0 && logLines.size() > maxLines)
            {
                logLines.erase(logLines.begin());
            }

            updateLogDisplay();
        }

        void ConsoleView::updateLogDisplay()
        {
            if (!logArea)
                return;

            // Combine all log lines
            std::string allLogs;
            for (const auto &line : logLines)
            {
                allLogs += line + "\n";
            }

            // Update the log area
            lv_label_set_text(logArea, allLogs.c_str());
        }

        void ConsoleView::scrollToBottom()
        {
            // This is a simplified version since we're using a label
            // For a more complex scrollable console, we would use a page or container with proper scrolling
            updateLogDisplay();
        }

        // Helper functions to create views
        std::shared_ptr<View> createView(const std::string &name)
        {
            return std::make_shared<View>(name);
        }

        std::shared_ptr<DashboardView> createDashboardView(const std::string &name)
        {
            return std::make_shared<DashboardView>(name);
        }

        std::shared_ptr<ConsoleView> createConsoleView(const std::string &name)
        {
            return std::make_shared<ConsoleView>(name);
        }

    } // namespace graphics
} // namespace insights
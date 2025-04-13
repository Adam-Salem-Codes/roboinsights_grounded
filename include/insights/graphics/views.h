/**
 * @file views.h
 * @brief InsightsGL view templates - Pre-built views for robotics interfaces
 * @ingroup graphics
 */

#pragma once

#include "core.h"
#include "widgets.h"

namespace insights
{
    namespace graphics
    {

        /// @addtogroup graphics
        /// @{

        /**
         * @brief A dashboard view displaying robot status information
         */
        class DashboardView : public View
        {
        public:
            /**
             * @brief Constructor
             * @param name View name
             */
            DashboardView(const std::string &name = "Dashboard");

            /**
             * @brief Virtual destructor
             */
            virtual ~DashboardView() = default;

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the view
             */
            virtual void update() override;

            /**
             * @brief Create a status card
             * @param title Card title
             * @param initialValue Initial value
             * @param icon Optional icon
             * @return The created label widget for later updates
             */
            std::shared_ptr<Label> addStatusCard(
                const std::string &title,
                const std::string &initialValue,
                const char *icon = nullptr);

            /**
             * @brief Add a battery status widget
             * @param initialPercent Initial battery percentage
             * @return The created progress bar widget for later updates
             */
            std::shared_ptr<ProgressBar> addBatteryStatus(int initialPercent = 100);

            /**
             * @brief Add a sensor value display
             * @param name Sensor name
             * @param unit Unit of measure (e.g., "°C")
             * @param initialValue Initial value
             * @param min Minimum expected value
             * @param max Maximum expected value
             * @return The created label widget for later updates
             */
            std::shared_ptr<Label> addSensorDisplay(
                const std::string &name,
                const std::string &unit,
                double initialValue,
                double min,
                double max);

            /**
             * @brief Add a chart for time-series data
             * @param title Chart title
             * @param yAxisLabel Y-axis label
             * @param min Minimum Y value
             * @param max Maximum Y value
             * @return The created chart widget for later updates
             */
            std::shared_ptr<Chart> addTimeSeriesChart(
                const std::string &title,
                const std::string &yAxisLabel,
                int min,
                int max);

        private:
            lv_obj_t *cardsContainer = nullptr;
            lv_obj_t *chartsContainer = nullptr;

            std::vector<std::shared_ptr<Label>> statusLabels;
            std::vector<std::shared_ptr<Chart>> charts;
        };

        /**
         * @brief A console view for displaying logs and messages
         */
        class ConsoleView : public View
        {
        public:
            /**
             * @brief Constructor
             * @param name View name
             */
            ConsoleView(const std::string &name = "Console");

            /**
             * @brief Virtual destructor
             */
            virtual ~ConsoleView() = default;

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the view
             */
            virtual void update() override;

            /**
             * @brief Add a log message
             * @param message Log message
             * @param logLevel Log level (0=info, 1=warning, 2=error, 3=debug)
             */
            void addLogMessage(const std::string &message, int logLevel = 0);

            /**
             * @brief Clear all log messages
             */
            void clearLogs();

            /**
             * @brief Enable or disable auto-scrolling
             * @param enabled Whether auto-scrolling is enabled
             */
            void setAutoScroll(bool enabled);

            /**
             * @brief Get whether auto-scrolling is enabled
             * @return True if auto-scrolling is enabled
             */
            bool isAutoScrollEnabled() const;

            /**
             * @brief Set maximum number of log lines to display
             * @param maxLines Maximum lines (0 = unlimited)
             */
            void setMaxLogLines(uint32_t maxLines);

        private:
            lv_obj_t *logContainer = nullptr;
            lv_obj_t *logArea = nullptr;
            bool autoScroll = true;
            uint32_t maxLines = 1000;
            std::vector<std::string> logLines;

            void updateLogDisplay();
            void scrollToBottom();
        };

        /**
         * @brief A control panel view with various controls
         */
        class ControlPanelView : public View
        {
        public:
            /**
             * @brief Constructor
             * @param name View name
             */
            ControlPanelView(const std::string &name = "Controls");

            /**
             * @brief Virtual destructor
             */
            virtual ~ControlPanelView() = default;

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the view
             */
            virtual void update() override;

            /**
             * @brief Add a control group
             * @param title Group title
             * @return Container object for adding controls
             */
            lv_obj_t *addControlGroup(const std::string &title);

            /**
             * @brief Add a slider control
             * @param group Control group
             * @param name Control name
             * @param min Minimum value
             * @param max Maximum value
             * @param value Initial value
             * @param callback Callback for value changes
             * @return The created slider widget
             */
            std::shared_ptr<Slider> addSlider(
                lv_obj_t *group,
                const std::string &name,
                int min,
                int max,
                int value,
                std::function<void(int)> callback = nullptr);

            /**
             * @brief Add a toggle switch
             * @param group Control group
             * @param name Switch name
             * @param initialState Initial state
             * @param callback Callback for state changes
             * @return The created switch widget
             */
            std::shared_ptr<Switch> addSwitch(
                lv_obj_t *group,
                const std::string &name,
                bool initialState = false,
                std::function<void(bool)> callback = nullptr);

            /**
             * @brief Add a dropdown selector
             * @param group Control group
             * @param name Control name
             * @param options List of options
             * @param callback Callback for selection changes
             * @return The created dropdown widget
             */
            std::shared_ptr<Dropdown> addDropdown(
                lv_obj_t *group,
                const std::string &name,
                const std::vector<std::string> &options,
                std::function<void(uint16_t, const std::string &)> callback = nullptr);

            /**
             * @brief Add a button
             * @param group Control group
             * @param name Button name
             * @param callback Callback for button click
             * @return The created button widget
             */
            std::shared_ptr<Button> addButton(
                lv_obj_t *group,
                const std::string &name,
                std::function<void()> callback = nullptr);

        private:
            lv_obj_t *groupsContainer = nullptr;
            std::vector<lv_obj_t *> groups;
        };

        /**
         * @brief A teleoperation view with joysticks and controls
         */
        class TeleOpView : public View
        {
        public:
            /**
             * @brief Constructor
             * @param name View name
             */
            TeleOpView(const std::string &name = "TeleOp");

            /**
             * @brief Virtual destructor
             */
            virtual ~TeleOpView() = default;

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the view
             */
            virtual void update() override;

            /**
             * @brief Set the callback for left joystick
             * @param callback Function called with (x, y) values [-100 to 100]
             */
            void setLeftJoystickCallback(std::function<void(int, int)> callback);

            /**
             * @brief Set the callback for right joystick
             * @param callback Function called with (x, y) values [-100 to 100]
             */
            void setRightJoystickCallback(std::function<void(int, int)> callback);

            /**
             * @brief Add a control button
             * @param name Button name
             * @param position Position (0 = left side, 1 = right side)
             * @param callback Click callback
             * @return Created button widget
             */
            std::shared_ptr<Button> addControlButton(
                const std::string &name,
                int position,
                std::function<void()> callback);

        private:
            lv_obj_t *leftJoystick = nullptr;
            lv_obj_t *rightJoystick = nullptr;
            lv_obj_t *leftControls = nullptr;
            lv_obj_t *rightControls = nullptr;

            std::function<void(int, int)> leftJoystickCb;
            std::function<void(int, int)> rightJoystickCb;

            // Handling for joystick input
            static void joystickEventHandler(lv_event_t *e);
            void processJoystickInput(lv_obj_t *joystick, int x, int y);
        };

        /**
         * @brief A configuration view for setting parameters
         */
        class ConfigView : public View
        {
        public:
            /**
             * @brief Parameter type
             */
            enum class ParamType
            {
                INTEGER,
                FLOAT,
                BOOLEAN,
                STRING,
                OPTION
            };

            /**
             * @brief Parameter structure
             */
            struct Parameter
            {
                std::string name;
                std::string description;
                ParamType type;

                // Value union
                union
                {
                    int intValue;
                    float floatValue;
                    bool boolValue;
                };
                std::string stringValue; // For string and option types

                // Constraints
                union
                {
                    struct
                    {
                        int min;
                        int max;
                    } intRange;
                    struct
                    {
                        float min;
                        float max;
                    } floatRange;
                };
                std::vector<std::string> options; // For option type

                // Widget reference
                lv_obj_t *widget = nullptr;
            };

            /**
             * @brief Constructor
             * @param name View name
             */
            ConfigView(const std::string &name = "Configuration");

            /**
             * @brief Virtual destructor
             */
            virtual ~ConfigView() = default;

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the view
             */
            virtual void update() override;

            /**
             * @brief Add an integer parameter
             * @param name Parameter name
             * @param description Parameter description
             * @param initialValue Initial value
             * @param min Minimum value
             * @param max Maximum value
             */
            void addIntegerParam(
                const std::string &name,
                const std::string &description,
                int initialValue,
                int min,
                int max);

            /**
             * @brief Add a float parameter
             * @param name Parameter name
             * @param description Parameter description
             * @param initialValue Initial value
             * @param min Minimum value
             * @param max Maximum value
             */
            void addFloatParam(
                const std::string &name,
                const std::string &description,
                float initialValue,
                float min,
                float max);

            /**
             * @brief Add a boolean parameter
             * @param name Parameter name
             * @param description Parameter description
             * @param initialValue Initial value
             */
            void addBoolParam(
                const std::string &name,
                const std::string &description,
                bool initialValue);

            /**
             * @brief Add a string parameter
             * @param name Parameter name
             * @param description Parameter description
             * @param initialValue Initial value
             */
            void addStringParam(
                const std::string &name,
                const std::string &description,
                const std::string &initialValue);

            /**
             * @brief Add an option parameter
             * @param name Parameter name
             * @param description Parameter description
             * @param options Available options
             * @param initialValue Initial option index
             */
            void addOptionParam(
                const std::string &name,
                const std::string &description,
                const std::vector<std::string> &options,
                int initialValue = 0);

            /**
             * @brief Get an integer parameter value
             * @param name Parameter name
             * @param defaultValue Value to return if not found
             * @return Parameter value
             */
            int getIntParam(const std::string &name, int defaultValue = 0);

            /**
             * @brief Get a float parameter value
             * @param name Parameter name
             * @param defaultValue Value to return if not found
             * @return Parameter value
             */
            float getFloatParam(const std::string &name, float defaultValue = 0.0f);

            /**
             * @brief Get a boolean parameter value
             * @param name Parameter name
             * @param defaultValue Value to return if not found
             * @return Parameter value
             */
            bool getBoolParam(const std::string &name, bool defaultValue = false);

            /**
             * @brief Get a string parameter value
             * @param name Parameter name
             * @param defaultValue Value to return if not found
             * @return Parameter value
             */
            std::string getStringParam(const std::string &name, const std::string &defaultValue = "");

            /**
             * @brief Get an option parameter value
             * @param name Parameter name
             * @param defaultValue Value to return if not found
             * @return Parameter value
             */
            std::string getOptionParam(const std::string &name, const std::string &defaultValue = "");

            /**
             * @brief Save configuration
             * @param callback Called when save completes
             */
            void saveConfig(std::function<void(bool)> callback = nullptr);

            /**
             * @brief Load configuration
             * @param callback Called when load completes
             */
            void loadConfig(std::function<void(bool)> callback = nullptr);

        private:
            lv_obj_t *paramsContainer = nullptr;
            lv_obj_t *saveButton = nullptr;
            std::vector<Parameter> parameters;

            void createWidgetForParameter(Parameter &param);
            static void paramEventHandler(lv_event_t *e);
            Parameter *findParameter(const std::string &name);
        };

        /**
         * @brief Create a generic view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<View> createView(const std::string &name);

        /**
         * @brief Create a dashboard view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<DashboardView> createDashboardView(const std::string &name = "Dashboard");

        /**
         * @brief Create a console view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<ConsoleView> createConsoleView(const std::string &name = "Console");

        /**
         * @brief Create a control panel view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<ControlPanelView> createControlPanelView(const std::string &name = "Controls");

        /**
         * @brief Create a teleoperation view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<TeleOpView> createTeleOpView(const std::string &name = "TeleOp");

        /**
         * @brief Create a configuration view
         * @param name View name
         * @return Shared pointer to created view
         */
        std::shared_ptr<ConfigView> createConfigView(const std::string &name = "Configuration");

        /// @}

    } // namespace graphics
} // namespace insights
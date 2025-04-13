/**
 * @file widgets.h
 * @brief InsightsGL widgets - UI components for robotics interfaces
 * @ingroup graphics
 */

#pragma once

#include "core.h"

namespace insights
{
    namespace graphics
    {

        /// @addtogroup graphics
        /// @{

        /**
         * @brief A simple text label widget
         */
        class Label : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param text Initial text
             */
            Label(const std::string &name, const std::string &text);

            /**
             * @brief Destructor
             */
            virtual ~Label() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set the text content
             * @param text New text
             */
            void setText(const std::string &text);

            /**
             * @brief Get the current text
             * @return Current text
             */
            std::string getText() const;

            /**
             * @brief Set the text color
             * @param color Text color
             */
            void setTextColor(lv_color_t color);

            /**
             * @brief Set the font size
             * @param size Font size
             */
            void setFontSize(uint8_t size);

            /**
             * @brief Set text alignment
             * @param align Alignment (LV_TEXT_ALIGN_LEFT, LV_TEXT_ALIGN_CENTER, LV_TEXT_ALIGN_RIGHT)
             */
            void setAlignment(lv_text_align_t align);

        private:
            std::string text;
        };

        /**
         * @brief Button widget with customizable appearance and events
         */
        class Button : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param text Button text
             */
            Button(const std::string &name, const std::string &text);

            /**
             * @brief Destructor
             */
            virtual ~Button() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set button text
             * @param text New text
             */
            void setText(const std::string &text);

            /**
             * @brief Get current button text
             * @return Current text
             */
            std::string getText() const;

            /**
             * @brief Set click callback
             * @param callback Function to call when button is clicked
             */
            void setClickCallback(std::function<void()> callback);

            /**
             * @brief Set button colors
             * @param bgColor Background color
             * @param textColor Text color
             */
            void setColors(lv_color_t bgColor, lv_color_t textColor);

            /**
             * @brief Enable or disable the button
             * @param enabled Whether button is enabled
             */
            void setEnabled(bool enabled);

            /**
             * @brief Check if button is enabled
             * @return True if enabled
             */
            bool isEnabled() const;

        private:
            std::string text;
            std::function<void()> clickCallback;
            lv_obj_t *label = nullptr;
            bool enabled = true;

            static void buttonEventHandler(lv_event_t *e);
        };

        /**
         * @brief Slider widget for numeric value selection
         */
        class Slider : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param min Minimum value
             * @param max Maximum value
             * @param value Initial value
             */
            Slider(const std::string &name, int min, int max, int value);

            /**
             * @brief Destructor
             */
            virtual ~Slider() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set slider range
             * @param min Minimum value
             * @param max Maximum value
             */
            void setRange(int min, int max);

            /**
             * @brief Set current value
             * @param value New value
             */
            void setValue(int value);

            /**
             * @brief Get current value
             * @return Current value
             */
            int getValue() const;

            /**
             * @brief Set value change callback
             * @param callback Function to call when value changes
             */
            void setChangeCallback(std::function<void(int)> callback);

        private:
            int minValue;
            int maxValue;
            int currentValue;
            std::function<void(int)> changeCallback;

            static void sliderEventHandler(lv_event_t *e);
        };

        /**
         * @brief Progress bar widget
         */
        class ProgressBar : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param min Minimum value
             * @param max Maximum value
             * @param value Initial value
             */
            ProgressBar(const std::string &name, int min, int max, int value);

            /**
             * @brief Destructor
             */
            virtual ~ProgressBar() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set progress range
             * @param min Minimum value
             * @param max Maximum value
             */
            void setRange(int min, int max);

            /**
             * @brief Set current value
             * @param value New value
             */
            void setValue(int value);

            /**
             * @brief Get current value
             * @return Current value
             */
            int getValue() const;

            /**
             * @brief Set animation time
             * @param ms Animation duration in milliseconds
             */
            void setAnimationTime(uint32_t ms);

            /**
             * @brief Set progress bar color
             * @param fgColor Foreground (indicator) color
             * @param bgColor Background color
             */
            void setColors(lv_color_t fgColor, lv_color_t bgColor);

        private:
            int minValue;
            int maxValue;
            int currentValue;
            uint32_t animTime = 300;
        };

        /**
         * @brief Chart widget for data visualization
         */
        class Chart : public Widget
        {
        public:
            /**
             * @brief Chart type
             */
            enum class Type
            {
                LINE,   ///< Line chart
                BAR,    ///< Bar chart
                SCATTER ///< Scatter plot
            };

            /**
             * @brief Constructor
             * @param name Widget name
             * @param type Chart type
             */
            Chart(const std::string &name, Type type = Type::LINE);

            /**
             * @brief Destructor
             */
            virtual ~Chart() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Add a data series
             * @param name Series name
             * @param color Series color
             * @return Series index
             */
            int addSeries(const std::string &name, lv_color_t color);

            /**
             * @brief Add a point to a data series
             * @param seriesIndex Series index
             * @param value Point value
             */
            void addPoint(int seriesIndex, int value);

            /**
             * @brief Set X and Y range
             * @param xMin Minimum X value
             * @param xMax Maximum X value
             * @param yMin Minimum Y value
             * @param yMax Maximum Y value
             */
            void setRange(int xMin, int xMax, int yMin, int yMax);

            /**
             * @brief Clear all data points
             */
            void clear();

        private:
            Type chartType;
            lv_chart_type_t lvglType;
            std::vector<lv_chart_series_t *> series;
        };

        /**
         * @brief Switch widget (on/off toggle)
         */
        class Switch : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param state Initial state
             */
            Switch(const std::string &name, bool state = false);

            /**
             * @brief Destructor
             */
            virtual ~Switch() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set switch state
             * @param state New state
             */
            void setState(bool state);

            /**
             * @brief Get current state
             * @return Current state
             */
            bool getState() const;

            /**
             * @brief Set state change callback
             * @param callback Function to call when state changes
             */
            void setChangeCallback(std::function<void(bool)> callback);

        private:
            bool state;
            std::function<void(bool)> changeCallback;

            static void switchEventHandler(lv_event_t *e);
        };

        /**
         * @brief Dropdown widget for selecting from a list
         */
        class Dropdown : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             */
            Dropdown(const std::string &name);

            /**
             * @brief Destructor
             */
            virtual ~Dropdown() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Add an option
             * @param option Option text
             */
            void addOption(const std::string &option);

            /**
             * @brief Set options list
             * @param options Vector of option strings
             */
            void setOptions(const std::vector<std::string> &options);

            /**
             * @brief Set selected option by index
             * @param index Option index
             */
            void setSelectedIndex(uint16_t index);

            /**
             * @brief Get selected option index
             * @return Selected index
             */
            uint16_t getSelectedIndex() const;

            /**
             * @brief Get selected option text
             * @return Selected option text
             */
            std::string getSelectedOption() const;

            /**
             * @brief Set selection change callback
             * @param callback Function to call when selection changes
             */
            void setChangeCallback(std::function<void(uint16_t, const std::string &)> callback);

        private:
            std::vector<std::string> options;
            std::function<void(uint16_t, const std::string &)> changeCallback;

            static void dropdownEventHandler(lv_event_t *e);
        };

        /**
         * @brief Text area widget for user input
         */
        class TextArea : public Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Widget name
             * @param text Initial text
             */
            TextArea(const std::string &name, const std::string &text = "");

            /**
             * @brief Destructor
             */
            virtual ~TextArea() = default;

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) override;

            /**
             * @brief Update the widget
             */
            virtual void update() override;

            /**
             * @brief Set text content
             * @param text New text
             */
            void setText(const std::string &text);

            /**
             * @brief Get current text
             * @return Current text
             */
            std::string getText() const;

            /**
             * @brief Set placeholder text
             * @param placeholder Placeholder text
             */
            void setPlaceholder(const std::string &placeholder);

            /**
             * @brief Set text change callback
             * @param callback Function to call when text changes
             */
            void setChangeCallback(std::function<void(const std::string &)> callback);

            /**
             * @brief Set whether field is password protected
             * @param isPassword True to hide text
             */
            void setPassword(bool isPassword);

            /**
             * @brief Set maximum text length
             * @param maxLen Maximum length
             */
            void setMaxLength(uint32_t maxLen);

        private:
            std::string text;
            std::function<void(const std::string &)> changeCallback;

            static void textAreaEventHandler(lv_event_t *e);
        };

        /**
         * @brief Factory for creating widgets
         *
         * A convenience class to simplify widget creation with a fluent interface.
         */
        class WidgetFactory
        {
        public:
            /**
             * @brief Create a label
             * @param name Widget name
             * @param text Label text
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Label> createLabel(const std::string &name, const std::string &text);

            /**
             * @brief Create a button
             * @param name Widget name
             * @param text Button text
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Button> createButton(const std::string &name, const std::string &text);

            /**
             * @brief Create a slider
             * @param name Widget name
             * @param min Minimum value
             * @param max Maximum value
             * @param value Initial value
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Slider> createSlider(const std::string &name, int min, int max, int value);

            /**
             * @brief Create a progress bar
             * @param name Widget name
             * @param min Minimum value
             * @param max Maximum value
             * @param value Initial value
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<ProgressBar> createProgressBar(
                const std::string &name, int min, int max, int value);

            /**
             * @brief Create a chart
             * @param name Widget name
             * @param type Chart type
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Chart> createChart(
                const std::string &name, Chart::Type type = Chart::Type::LINE);

            /**
             * @brief Create a switch
             * @param name Widget name
             * @param state Initial state
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Switch> createSwitch(const std::string &name, bool state = false);

            /**
             * @brief Create a dropdown
             * @param name Widget name
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<Dropdown> createDropdown(const std::string &name);

            /**
             * @brief Create a text area
             * @param name Widget name
             * @param text Initial text
             * @return Shared pointer to created widget
             */
            static std::shared_ptr<TextArea> createTextArea(
                const std::string &name, const std::string &text = "");
        };

        /// @}

    } // namespace graphics
} // namespace insights
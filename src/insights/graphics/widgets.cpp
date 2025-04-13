#include "insights/graphics/widgets.h"
#include "insights/logging/logging.h"
#include <cstdio>

namespace insights
{
    namespace graphics
    {

        // Label implementation
        Label::Label(const std::string &name, const std::string &text) : Widget(name), text(text)
        {
        }

        void Label::initialize(lv_obj_t *parent)
        {
            obj = lv_label_create(parent);
            lv_label_set_text(obj, text.c_str());
            lv_obj_set_width(obj, LV_SIZE_CONTENT);
        }

        void Label::update()
        {
            // Nothing to do for basic label update
        }

        void Label::setText(const std::string &newText)
        {
            text = newText;
            if (obj)
            {
                lv_label_set_text(obj, text.c_str());
            }
        }

        std::string Label::getText() const
        {
            return text;
        }

        void Label::setTextColor(lv_color_t color)
        {
            if (obj)
            {
                lv_obj_set_style_text_color(obj, color, 0);
            }
        }

        void Label::setFontSize(uint8_t size)
        {
            if (!obj)
                return;

            const lv_font_t *font = nullptr;

            // Select appropriate font based on size
            if (size <= 20)
            {
                font = &lv_font_montserrat_20;
            }
            else
            {
                font = &lv_font_montserrat_20; // Default to largest available
            }

            lv_obj_set_style_text_font(obj, font, 0);
        }

        void Label::setAlignment(lv_text_align_t align)
        {
            if (obj)
            {
                lv_obj_set_style_text_align(obj, align, 0);
            }
        }

        // Button implementation
        Button::Button(const std::string &name, const std::string &text)
            : Widget(name), text(text), clickCallback(nullptr), enabled(true)
        {
        }

        void Button::initialize(lv_obj_t *parent)
        {
            obj = lv_btn_create(parent);

            // Create label
            label = lv_label_create(obj);
            lv_label_set_text(label, text.c_str());
            lv_obj_center(label);

            // Add event handler
            lv_obj_add_event_cb(obj, buttonEventHandler, LV_EVENT_CLICKED, this);

            // Initial state
            setEnabled(enabled);
        }

        void Button::update()
        {
            // Nothing to update regularly for a button
        }

        void Button::setText(const std::string &newText)
        {
            text = newText;
            if (label)
            {
                lv_label_set_text(label, text.c_str());
            }
        }

        std::string Button::getText() const
        {
            return text;
        }

        void Button::setClickCallback(std::function<void()> callback)
        {
            clickCallback = callback;
        }

        void Button::setColors(lv_color_t bgColor, lv_color_t textColor)
        {
            if (obj)
            {
                lv_obj_set_style_bg_color(obj, bgColor, 0);
                if (label)
                {
                    lv_obj_set_style_text_color(label, textColor, 0);
                }
            }
        }

        void Button::setEnabled(bool isEnabled)
        {
            enabled = isEnabled;
            if (obj)
            {
                if (enabled)
                {
                    lv_obj_clear_state(obj, LV_STATE_DISABLED);
                }
                else
                {
                    lv_obj_add_state(obj, LV_STATE_DISABLED);
                }
            }
        }

        bool Button::isEnabled() const
        {
            return enabled;
        }

        void Button::buttonEventHandler(lv_event_t *e)
        {
            Button *button = static_cast<Button *>(lv_event_get_user_data(e));
            if (button && button->isEnabled() && button->clickCallback)
            {
                button->clickCallback();
            }
        }

        // Slider implementation
        Slider::Slider(const std::string &name, int min, int max, int value)
            : Widget(name), minValue(min), maxValue(max), currentValue(value), changeCallback(nullptr)
        {
        }

        void Slider::initialize(lv_obj_t *parent)
        {
            obj = lv_slider_create(parent);
            lv_slider_set_range(obj, minValue, maxValue);
            lv_slider_set_value(obj, currentValue, LV_ANIM_OFF);

            // Add event handler
            lv_obj_add_event_cb(obj, sliderEventHandler, LV_EVENT_VALUE_CHANGED, this);
        }

        void Slider::update()
        {
            // Nothing to update regularly for a slider
        }

        void Slider::setRange(int min, int max)
        {
            minValue = min;
            maxValue = max;
            if (obj)
            {
                lv_slider_set_range(obj, minValue, maxValue);
            }
        }

        void Slider::setValue(int value)
        {
            currentValue = value;
            if (obj)
            {
                lv_slider_set_value(obj, currentValue, LV_ANIM_ON);
            }
        }

        int Slider::getValue() const
        {
            if (obj)
            {
                return lv_slider_get_value(obj);
            }
            return currentValue;
        }

        void Slider::setChangeCallback(std::function<void(int)> callback)
        {
            changeCallback = callback;
        }

        void Slider::sliderEventHandler(lv_event_t *e)
        {
            Slider *slider = static_cast<Slider *>(lv_event_get_user_data(e));
            if (slider)
            {
                slider->currentValue = lv_slider_get_value(slider->obj);
                if (slider->changeCallback)
                {
                    slider->changeCallback(slider->currentValue);
                }
            }
        }

        // ProgressBar implementation
        ProgressBar::ProgressBar(const std::string &name, int min, int max, int value)
            : Widget(name), minValue(min), maxValue(max), currentValue(value), animTime(300)
        {
        }

        void ProgressBar::initialize(lv_obj_t *parent)
        {
            obj = lv_bar_create(parent);
            lv_bar_set_range(obj, minValue, maxValue);
            lv_bar_set_value(obj, currentValue, LV_ANIM_OFF);
        }

        void ProgressBar::update()
        {
            // Nothing to update regularly for a progress bar
        }

        void ProgressBar::setRange(int min, int max)
        {
            minValue = min;
            maxValue = max;
            if (obj)
            {
                lv_bar_set_range(obj, minValue, maxValue);
            }
        }

        void ProgressBar::setValue(int value)
        {
            currentValue = value;
            if (obj)
            {
                lv_bar_set_value(obj, currentValue, animTime > 0 ? LV_ANIM_ON : LV_ANIM_OFF);
            }
        }

        int ProgressBar::getValue() const
        {
            return currentValue;
        }

        void ProgressBar::setAnimationTime(uint32_t ms)
        {
            animTime = ms; // Store animation time for future use
        }

        void ProgressBar::setColors(lv_color_t fgColor, lv_color_t bgColor)
        {
            if (obj)
            {
                lv_obj_set_style_bg_color(obj, bgColor, LV_PART_MAIN);
                lv_obj_set_style_bg_color(obj, fgColor, LV_PART_INDICATOR);
            }
        }

        // Chart implementation
        Chart::Chart(const std::string &name, Type type)
            : Widget(name), chartType(type)
        {

            // Convert to LVGL chart type
            switch (chartType)
            {
            case Type::LINE:
                lvglType = LV_CHART_TYPE_LINE;
                break;
            case Type::BAR:
                lvglType = LV_CHART_TYPE_BAR;
                break;
            case Type::SCATTER:
                lvglType = LV_CHART_TYPE_SCATTER;
                break;
            default:
                lvglType = LV_CHART_TYPE_LINE;
                break;
            }
        }

        void Chart::initialize(lv_obj_t *parent)
        {
            obj = lv_chart_create(parent);
            lv_chart_set_type(obj, lvglType);
            lv_obj_set_size(obj, LV_PCT(100), LV_PCT(100));

            // Set default point count
            lv_chart_set_point_count(obj, 10);
        }

        void Chart::update()
        {
            // Nothing to update regularly for a chart
        }

        int Chart::addSeries(const std::string &name, lv_color_t color)
        {
            if (!obj)
                return -1;

            lv_chart_series_t *ser = lv_chart_add_series(obj, color, LV_CHART_AXIS_PRIMARY_Y);
            if (ser)
            {
                series.push_back(ser);
                return series.size() - 1;
            }

            return -1;
        }

        void Chart::addPoint(int seriesIndex, int value)
        {
            if (!obj || seriesIndex < 0 || seriesIndex >= static_cast<int>(series.size()))
            {
                return;
            }

            lv_chart_set_next_value(obj, series[seriesIndex], value);
        }

        void Chart::setRange(int xMin, int xMax, int yMin, int yMax)
        {
            if (!obj)
                return;

            lv_chart_set_range(obj, LV_CHART_AXIS_PRIMARY_Y, yMin, yMax);
            lv_chart_set_range(obj, LV_CHART_AXIS_PRIMARY_X, xMin, xMax);
        }

        void Chart::clear()
        {
            if (obj)
            {
                lv_chart_refresh(obj);
            }
        }

        // Switch implementation
        Switch::Switch(const std::string &name, bool state)
            : Widget(name), state(state), changeCallback(nullptr)
        {
        }

        void Switch::initialize(lv_obj_t *parent)
        {
            obj = lv_switch_create(parent);

            // Set initial state
            if (state)
            {
                lv_obj_add_state(obj, LV_STATE_CHECKED);
            }
            else
            {
                lv_obj_clear_state(obj, LV_STATE_CHECKED);
            }

            // Add event handler
            lv_obj_add_event_cb(obj, switchEventHandler, LV_EVENT_VALUE_CHANGED, this);
        }

        void Switch::update()
        {
            // Nothing to update regularly for a switch
        }

        void Switch::setState(bool newState)
        {
            state = newState;
            if (obj)
            {
                if (state)
                {
                    lv_obj_add_state(obj, LV_STATE_CHECKED);
                }
                else
                {
                    lv_obj_clear_state(obj, LV_STATE_CHECKED);
                }
            }
        }

        bool Switch::getState() const
        {
            if (obj)
            {
                return lv_obj_has_state(obj, LV_STATE_CHECKED);
            }
            return state;
        }

        void Switch::setChangeCallback(std::function<void(bool)> callback)
        {
            changeCallback = callback;
        }

        void Switch::switchEventHandler(lv_event_t *e)
        {
            Switch *switchObj = static_cast<Switch *>(lv_event_get_user_data(e));
            if (switchObj)
            {
                switchObj->state = lv_obj_has_state(switchObj->obj, LV_STATE_CHECKED);
                if (switchObj->changeCallback)
                {
                    switchObj->changeCallback(switchObj->state);
                }
            }
        }

        // Dropdown implementation
        Dropdown::Dropdown(const std::string &name)
            : Widget(name), changeCallback(nullptr)
        {
        }

        void Dropdown::initialize(lv_obj_t *parent)
        {
            obj = lv_dropdown_create(parent);

            // Add event handler
            lv_obj_add_event_cb(obj, dropdownEventHandler, LV_EVENT_VALUE_CHANGED, this);

            // Update options if any were set before initialization
            if (!options.empty())
            {
                setOptions(options);
            }
        }

        void Dropdown::update()
        {
            // Nothing to update regularly for a dropdown
        }

        void Dropdown::addOption(const std::string &option)
        {
            options.push_back(option);

            // Update LVGL dropdown if already initialized
            if (obj)
            {
                setOptions(options);
            }
        }

        void Dropdown::setOptions(const std::vector<std::string> &newOptions)
        {
            options = newOptions;

            if (!obj)
                return;

            // Build options string (comma separated)
            std::string optionsStr;
            for (size_t i = 0; i < options.size(); ++i)
            {
                optionsStr += options[i];
                if (i < options.size() - 1)
                {
                    optionsStr += "\n";
                }
            }

            lv_dropdown_set_options(obj, optionsStr.c_str());
        }

        void Dropdown::setSelectedIndex(uint16_t index)
        {
            if (obj && index < options.size())
            {
                lv_dropdown_set_selected(obj, index);
            }
        }

        uint16_t Dropdown::getSelectedIndex() const
        {
            if (obj)
            {
                return lv_dropdown_get_selected(obj);
            }
            return 0;
        }

        std::string Dropdown::getSelectedOption() const
        {
            uint16_t index = getSelectedIndex();
            if (index < options.size())
            {
                return options[index];
            }
            return "";
        }

        void Dropdown::setChangeCallback(std::function<void(uint16_t, const std::string &)> callback)
        {
            changeCallback = callback;
        }

        void Dropdown::dropdownEventHandler(lv_event_t *e)
        {
            Dropdown *dropdown = static_cast<Dropdown *>(lv_event_get_user_data(e));
            if (dropdown && dropdown->changeCallback)
            {
                uint16_t index = dropdown->getSelectedIndex();
                std::string option = dropdown->getSelectedOption();
                dropdown->changeCallback(index, option);
            }
        }

        // TextArea implementation
        TextArea::TextArea(const std::string &name, const std::string &text)
            : Widget(name), text(text), changeCallback(nullptr)
        {
        }

        void TextArea::initialize(lv_obj_t *parent)
        {
            obj = lv_textarea_create(parent);
            lv_textarea_set_text(obj, text.c_str());

            // Add event handler
            lv_obj_add_event_cb(obj, textAreaEventHandler, LV_EVENT_VALUE_CHANGED, this);
        }

        void TextArea::update()
        {
            // Nothing to update regularly for a text area
        }

        void TextArea::setText(const std::string &newText)
        {
            text = newText;
            if (obj)
            {
                lv_textarea_set_text(obj, text.c_str());
            }
        }

        std::string TextArea::getText() const
        {
            if (obj)
            {
                return std::string(lv_textarea_get_text(obj));
            }
            return text;
        }

        void TextArea::setPlaceholder(const std::string &placeholder)
        {
            if (obj)
            {
                lv_textarea_set_placeholder_text(obj, placeholder.c_str());
            }
        }

        void TextArea::setChangeCallback(std::function<void(const std::string &)> callback)
        {
            changeCallback = callback;
        }

        void TextArea::setPassword(bool isPassword)
        {
            if (obj)
            {
                lv_textarea_set_password_mode(obj, isPassword);
            }
        }

        void TextArea::setMaxLength(uint32_t maxLen)
        {
            if (obj)
            {
                lv_textarea_set_max_length(obj, maxLen);
            }
        }

        void TextArea::textAreaEventHandler(lv_event_t *e)
        {
            TextArea *textArea = static_cast<TextArea *>(lv_event_get_user_data(e));
            if (textArea)
            {
                textArea->text = lv_textarea_get_text(textArea->obj);
                if (textArea->changeCallback)
                {
                    textArea->changeCallback(textArea->text);
                }
            }
        }

        // Widget Factory implementation
        std::shared_ptr<Label> WidgetFactory::createLabel(const std::string &name, const std::string &text)
        {
            return std::make_shared<Label>(name, text);
        }

        std::shared_ptr<Button> WidgetFactory::createButton(const std::string &name, const std::string &text)
        {
            return std::make_shared<Button>(name, text);
        }

        std::shared_ptr<Slider> WidgetFactory::createSlider(const std::string &name, int min, int max, int value)
        {
            return std::make_shared<Slider>(name, min, max, value);
        }

        std::shared_ptr<ProgressBar> WidgetFactory::createProgressBar(
            const std::string &name, int min, int max, int value)
        {
            return std::make_shared<ProgressBar>(name, min, max, value);
        }

        std::shared_ptr<Chart> WidgetFactory::createChart(
            const std::string &name, Chart::Type type)
        {
            return std::make_shared<Chart>(name, type);
        }

        std::shared_ptr<Switch> WidgetFactory::createSwitch(const std::string &name, bool state)
        {
            return std::make_shared<Switch>(name, state);
        }

        std::shared_ptr<Dropdown> WidgetFactory::createDropdown(const std::string &name)
        {
            return std::make_shared<Dropdown>(name);
        }

        std::shared_ptr<TextArea> WidgetFactory::createTextArea(
            const std::string &name, const std::string &text)
        {
            return std::make_shared<TextArea>(name, text);
        }

    } // namespace graphics
} // namespace insights
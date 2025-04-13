/**
 * @file core.h
 * @brief InsightsGL core header - A modern graphics library for robotics
 * @ingroup graphics
 */

#pragma once

#include "liblvgl/lvgl.h"
#include <string>
#include <memory>
#include <functional>
#include <vector>

namespace insights
{
    namespace graphics
    {

        /**
         * @defgroup graphics Graphics Library
         * @brief A modern view management and graphics system for robotics interfaces
         *
         * InsightsGL provides a flexible and powerful UI framework built on LVGL,
         * offering responsive interfaces, animations, and a consistent theme
         * for robotics dashboards and control systems.
         */

        /// @addtogroup graphics
        /// @{

        /**
         * @brief Animation types supported by the graphics system
         */
        enum class AnimationType
        {
            NONE,        ///< No animation
            FADE,        ///< Fade in/out
            SLIDE_LEFT,  ///< Slide from/to left
            SLIDE_RIGHT, ///< Slide from/to right
            SLIDE_UP,    ///< Slide from/to top
            SLIDE_DOWN,  ///< Slide from/to bottom
            ZOOM,        ///< Zoom in/out
            BOUNCE       ///< Bounce effect
        };

        /**
         * @brief Animation configuration
         */
        struct AnimationConfig
        {
            AnimationType type = AnimationType::FADE; ///< Animation type
            uint32_t duration = 300;                  ///< Duration in milliseconds
            bool enabled = true;                      ///< Whether animations are enabled
        };

        /**
         * @brief Theme configuration
         */
        struct ThemeConfig
        {
            lv_color_t primaryColor = lv_color_hex(0x3498db);    ///< Primary theme color
            lv_color_t secondaryColor = lv_color_hex(0x2ecc71);  ///< Secondary theme color
            lv_color_t accentColor = lv_color_hex(0xe74c3c);     ///< Accent color for highlights
            lv_color_t backgroundColor = lv_color_hex(0x121212); ///< Background color
            lv_color_t textColor = lv_color_hex(0xffffff);       ///< Text color
            bool darkMode = true;                                ///< Dark or light mode
        };

        // Forward declarations
        class View;
        class Widget;
        class Screen;
        class ViewManager;

        /**
         * @brief Base class for all views in the graphics system
         *
         * A View represents a full-screen interface that can be switched between.
         * Each view has its own LVGL object and can contain multiple widgets.
         */
        class View
        {
        public:
            /**
             * @brief Constructor
             * @param name Name of the view
             */
            View(const std::string &name);

            /**
             * @brief Virtual destructor
             */
            virtual ~View();

            /**
             * @brief Get the name of the view
             * @return The view name
             */
            std::string getName() const { return name; }

            /**
             * @brief Get the underlying LVGL object
             * @return Pointer to the LVGL object
             */
            lv_obj_t *getObject() const { return obj; }

            /**
             * @brief Initialize the view
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent);

            /**
             * @brief Called when view becomes active
             */
            virtual void onActivate();

            /**
             * @brief Called when view becomes inactive
             */
            virtual void onDeactivate();

            /**
             * @brief Update the view (called periodically)
             */
            virtual void update();

            /**
             * @brief Set the animation configuration for this view
             * @param config Animation configuration
             */
            void setAnimationConfig(const AnimationConfig &config);

            /**
             * @brief Get the current animation configuration
             * @return The animation configuration
             */
            const AnimationConfig &getAnimationConfig() const { return animConfig; }

            /**
             * @brief Add a widget to this view
             * @param widget Shared pointer to widget
             */
            void addWidget(std::shared_ptr<Widget> widget);

            /**
             * @brief Get all widgets in this view
             * @return Vector of widget pointers
             */
            const std::vector<std::shared_ptr<Widget>> &getWidgets() const { return widgets; }

        protected:
            std::string name;                             ///< View name
            lv_obj_t *obj = nullptr;                      ///< LVGL object
            AnimationConfig animConfig;                   ///< Animation configuration
            std::vector<std::shared_ptr<Widget>> widgets; ///< Widgets in this view
            bool isActive = false;                        ///< Whether view is currently active

            friend class ViewManager;
        };

        /**
         * @brief Base class for UI widgets
         *
         * Widgets are UI elements that can be added to views, such as
         * buttons, labels, charts, etc.
         */
        class Widget
        {
        public:
            /**
             * @brief Constructor
             * @param name Name of the widget
             */
            Widget(const std::string &name);

            /**
             * @brief Virtual destructor
             */
            virtual ~Widget();

            /**
             * @brief Get the name of the widget
             * @return The widget name
             */
            std::string getName() const { return name; }

            /**
             * @brief Get the underlying LVGL object
             * @return Pointer to the LVGL object
             */
            lv_obj_t *getObject() const { return obj; }

            /**
             * @brief Initialize the widget
             * @param parent Parent LVGL object
             */
            virtual void initialize(lv_obj_t *parent) = 0;

            /**
             * @brief Update the widget (called periodically)
             */
            virtual void update() = 0;

        protected:
            std::string name;        ///< Widget name
            lv_obj_t *obj = nullptr; ///< LVGL object
        };

        /**
         * @brief Manager for views and transitions
         *
         * The ViewManager handles the creation, switching, and animation
         * of views in the graphics system.
         */
        class ViewManager
        {
        public:
            /**
             * @brief Get singleton instance
             * @return Reference to the ViewManager instance
             */
            static ViewManager &getInstance();

            /**
             * @brief Initialize the graphics system
             * @param theme Theme configuration
             */
            void initialize(const ThemeConfig &theme = ThemeConfig());

            /**
             * @brief Shutdown the graphics system
             */
            void shutdown();

            /**
             * @brief Register a new view
             * @param view Shared pointer to the view
             * @return True if successful, false if a view with the same name exists
             */
            bool registerView(std::shared_ptr<View> view);

            /**
             * @brief Switch to view by name
             * @param name Name of the view to switch to
             * @return True if successful, false if view doesn't exist
             */
            bool switchToView(const std::string &name);

            /**
             * @brief Get current active view
             * @return Shared pointer to the active view, or nullptr if none
             */
            std::shared_ptr<View> getCurrentView() const { return currentView; }

            /**
             * @brief Get a view by name
             * @param name Name of the view
             * @return Shared pointer to the view, or nullptr if not found
             */
            std::shared_ptr<View> getView(const std::string &name) const;

            /**
             * @brief Show an alert message
             * @param title Alert title
             * @param message Alert message
             * @param callback Optional callback when alert is dismissed
             */
            void showAlert(const std::string &title, const std::string &message,
                           std::function<void()> callback = nullptr);

            /**
             * @brief Show a confirmation dialog
             * @param title Dialog title
             * @param message Dialog message
             * @param onConfirm Callback for confirm button
             * @param onCancel Callback for cancel button
             */
            void showConfirmDialog(const std::string &title, const std::string &message,
                                   std::function<void()> onConfirm,
                                   std::function<void()> onCancel = nullptr);

            /**
             * @brief Set default animation configuration for all views
             * @param config Animation configuration
             */
            void setDefaultAnimationConfig(const AnimationConfig &config);

            /**
             * @brief Get the default animation configuration
             * @return The default animation configuration
             */
            const AnimationConfig &getDefaultAnimationConfig() const { return defaultAnimConfig; }

            /**
             * @brief Set the theme configuration
             * @param config Theme configuration
             */
            void setTheme(const ThemeConfig &config);

            /**
             * @brief Get the current theme configuration
             * @return The theme configuration
             */
            const ThemeConfig &getTheme() const { return themeConfig; }

            /**
             * @brief Update all views (call periodically)
             */
            void update();

            /**
             * @brief Check if graphics system is initialized
             * @return True if initialized, false otherwise
             */
            bool isInitialized() const { return initialized; }

        private:
            ViewManager();
            ~ViewManager();

            // Prevent copying
            ViewManager(const ViewManager &) = delete;
            ViewManager &operator=(const ViewManager &) = delete;

            static ViewManager *instance; ///< Singleton instance

            bool initialized = false;           ///< Whether system is initialized
            lv_obj_t *screen = nullptr;         ///< Main screen object
            lv_obj_t *contentArea = nullptr;    ///< Content area for views
            lv_obj_t *navbar = nullptr;         ///< Navigation bar
            lv_obj_t *alertContainer = nullptr; ///< Container for alerts

            ThemeConfig themeConfig;           ///< Theme configuration
            AnimationConfig defaultAnimConfig; ///< Default animation configuration

            std::vector<std::shared_ptr<View>> views; ///< Registered views
            std::shared_ptr<View> currentView;        ///< Currently active view

            void createAlert(const std::string &title, const std::string &message,
                             std::function<void()> onConfirm,
                             std::function<void()> onCancel);

            void applyTheme();
        };

        /**
         * @brief Create and transition to a simple loading screen
         * @param message Message to display
         * @param spinnerEnabled Whether to show a spinner
         * @return Shared pointer to the created view
         */
        std::shared_ptr<View> createLoadingScreen(const std::string &message, bool spinnerEnabled = true);

        /**
         * @brief Initialize the graphics system with default settings
         */
        void initGraphics();

        /**
         * @brief Update the graphics system (call periodically)
         */
        void updateGraphics();

        /**
         * @brief Shorthand to switch view by name
         * @param name Name of the view
         * @return True if successful
         */
        bool switchView(const std::string &name);

        /**
         * @brief Shorthand to show an alert
         * @param title Alert title
         * @param message Alert message
         * @param callback Optional callback
         */
        void showAlert(const std::string &title, const std::string &message,
                       std::function<void()> callback = nullptr);

        /// @}

    } // namespace graphics
} // namespace insights
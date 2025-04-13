#include "insights/graphics/core.h"
#include "insights/logging/logging.h"
#include <algorithm>

namespace insights
{
    namespace graphics
    {

        // Static instance initialization
        ViewManager *ViewManager::instance = nullptr;

        // View implementation
        View::View(const std::string &name) : name(name), obj(nullptr), isActive(false)
        {
        }

        View::~View()
        {
            if (obj != nullptr)
            {
                lv_obj_del(obj);
                obj = nullptr;
            }

            widgets.clear();
        }

        void View::initialize(lv_obj_t *parent)
        {
            // Create the main container for this view
            obj = lv_obj_create(parent);
            lv_obj_set_size(obj, lv_obj_get_width(parent), lv_obj_get_height(parent));
            lv_obj_set_pos(obj, 0, 0);
            lv_obj_add_flag(obj, LV_OBJ_FLAG_HIDDEN); // Hidden by default

            // Initialize all widgets in this view
            for (auto &widget : widgets)
            {
                widget->initialize(obj);
            }
        }

        // Corrected lambda to use a static function instead of capturing `this`
        static void anim_exec_cb(void *var, int32_t v)
        {
            lv_obj_set_style_opa(static_cast<lv_obj_t *>(var), v, 0);
        }

        void View::onActivate()
        {
            if (obj == nullptr)
                return;

            // Show the view with animation if enabled
            if (animConfig.enabled)
            {
                // Setup animation based on type
                lv_anim_t a;
                lv_anim_init(&a);
                lv_anim_set_var(&a, obj);
                lv_anim_set_time(&a, animConfig.duration);

                switch (animConfig.type)
                {
                case AnimationType::FADE:
                    lv_obj_set_style_opa(obj, 0, 0);
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, anim_exec_cb);
                    lv_anim_set_values(&a, 0, 255);
                    break;

                case AnimationType::SLIDE_LEFT:
                    lv_obj_set_x(obj, -lv_obj_get_width(obj));
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                        { lv_obj_set_x((lv_obj_t *)var, v); });
                    lv_anim_set_values(&a, -lv_obj_get_width(obj), 0);
                    break;

                case AnimationType::SLIDE_RIGHT:
                    lv_obj_set_x(obj, lv_obj_get_width(obj));
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                        { lv_obj_set_x((lv_obj_t *)var, v); });
                    lv_anim_set_values(&a, lv_obj_get_width(obj), 0);
                    break;

                case AnimationType::SLIDE_UP:
                    lv_obj_set_y(obj, lv_obj_get_height(obj));
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                        { lv_obj_set_y((lv_obj_t *)var, v); });
                    lv_anim_set_values(&a, lv_obj_get_height(obj), 0);
                    break;

                case AnimationType::SLIDE_DOWN:
                    lv_obj_set_y(obj, -lv_obj_get_height(obj));
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                        { lv_obj_set_y((lv_obj_t *)var, v); });
                    lv_anim_set_values(&a, -lv_obj_get_height(obj), 0);
                    break;

                case AnimationType::ZOOM:
                    // Simple version without transform scale (which is undefined)
                    lv_obj_set_style_opa(obj, 0, 0);
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, anim_exec_cb);
                    lv_anim_set_values(&a, 0, 255);
                    break;

                case AnimationType::BOUNCE:
                    lv_obj_set_y(obj, 50); // Start above final position
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                        { lv_obj_set_y((lv_obj_t *)var, v); });
                    lv_anim_set_values(&a, 50, 0);
                    lv_anim_set_path_cb(&a, lv_anim_path_bounce);
                    break;

                case AnimationType::NONE:
                default:
                    lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
                    break;
                }

                if (animConfig.type != AnimationType::NONE)
                {
                    lv_anim_start(&a);
                }
            }
            else
            {
                // No animation, just show the view
                lv_obj_clear_flag(obj, LV_OBJ_FLAG_HIDDEN);
            }

            isActive = true;
        }

        void View::onDeactivate()
        {
            if (obj == nullptr)
                return;

            // Hide the view immediately without animation
            lv_obj_add_flag(obj, LV_OBJ_FLAG_HIDDEN);
            isActive = false;
        }

        void View::update()
        {
            // Update all widgets
            for (auto &widget : widgets)
            {
                widget->update();
            }
        }

        void View::setAnimationConfig(const AnimationConfig &config)
        {
            animConfig = config;
        }

        void View::addWidget(std::shared_ptr<Widget> widget)
        {
            if (!widget)
                return;

            widgets.push_back(widget);

            // If view is already initialized, initialize the widget too
            if (obj != nullptr)
            {
                widget->initialize(obj);
            }
        }

        // Widget implementation
        Widget::Widget(const std::string &name) : name(name), obj(nullptr)
        {
        }

        Widget::~Widget()
        {
            // LVGL objects are deleted automatically when parent is deleted
            // So we don't need to delete obj here
        }

        // ViewManager implementation
        ViewManager &ViewManager::getInstance()
        {
            if (instance == nullptr)
            {
                instance = new ViewManager();
            }
            return *instance;
        }

        ViewManager::ViewManager()
            : initialized(false), screen(nullptr), contentArea(nullptr),
              navbar(nullptr), alertContainer(nullptr)
        {
        }

        ViewManager::~ViewManager()
        {
            shutdown();
        }

        void ViewManager::initialize(const ThemeConfig &theme)
        {
            if (initialized)
                return;

            themeConfig = theme;

            // Init display and input devices if needed
            // This assumes LVGL is already initialized by the main program

            // Create screen layout
            screen = lv_scr_act(); // Use active screen

            // Create a navbar/sidebar at the top
            navbar = lv_obj_create(screen);
            lv_obj_set_size(navbar, LV_HOR_RES, 40); // 40px tall navbar
            lv_obj_align(navbar, LV_ALIGN_TOP_MID, 0, 0);
            lv_obj_set_style_bg_color(navbar, themeConfig.primaryColor, 0);
            lv_obj_set_style_pad_all(navbar, 5, 0);

            // Content area for views
            contentArea = lv_obj_create(screen);
            lv_obj_set_size(contentArea, LV_HOR_RES, LV_VER_RES - 40); // Full width, height minus navbar
            lv_obj_align(contentArea, LV_ALIGN_TOP_MID, 0, 40);        // Below navbar
            lv_obj_set_style_bg_color(contentArea, themeConfig.backgroundColor, 0);
            lv_obj_set_style_border_width(contentArea, 0, 0);
            lv_obj_clear_flag(contentArea, LV_OBJ_FLAG_SCROLLABLE);

            // Create alert container (hidden initially)
            alertContainer = lv_obj_create(screen);
            lv_obj_set_size(alertContainer, LV_HOR_RES - 40, LV_VER_RES / 3);
            lv_obj_align(alertContainer, LV_ALIGN_CENTER, 0, 0);
            lv_obj_add_flag(alertContainer, LV_OBJ_FLAG_HIDDEN);
            lv_obj_set_style_bg_color(alertContainer, themeConfig.backgroundColor, 0);
            lv_obj_set_style_border_color(alertContainer, themeConfig.primaryColor, 0);
            lv_obj_set_style_border_width(alertContainer, 2, 0);
            lv_obj_set_style_radius(alertContainer, 10, 0);

            // Apply the theme
            applyTheme();

            // Initialize registered views
            for (auto &view : views)
            {
                view->initialize(contentArea);
            }

            initialized = true;
        }

        void ViewManager::shutdown()
        {
            if (!initialized)
                return;

            currentView = nullptr;
            views.clear();

            // The screen will be cleaned up by LVGL, we don't need to delete it

            initialized = false;
        }

        bool ViewManager::registerView(std::shared_ptr<View> view)
        {
            if (!view)
                return false;

            // Check if view with same name already exists
            for (auto &v : views)
            {
                if (v->getName() == view->getName())
                {
                    return false;
                }
            }

            views.push_back(view);

            // If already initialized, initialize the view now
            if (initialized)
            {
                view->initialize(contentArea);
            }

            return true;
        }

        bool ViewManager::switchToView(const std::string &name)
        {
            if (!initialized)
                return false;

            // Find the view with the given name
            auto it = std::find_if(views.begin(), views.end(),
                                   [&name](const std::shared_ptr<View> &v)
                                   {
                                       return v->getName() == name;
                                   });

            if (it == views.end())
            {
                return false; // View not found
            }

            // Deactivate the current view
            if (currentView)
            {
                currentView->onDeactivate();
            }

            // Activate the new view
            currentView = *it;
            currentView->onActivate();

            return true;
        }

        std::shared_ptr<View> ViewManager::getView(const std::string &name) const
        {
            auto it = std::find_if(views.begin(), views.end(),
                                   [&name](const std::shared_ptr<View> &v)
                                   {
                                       return v->getName() == name;
                                   });

            if (it == views.end())
            {
                return nullptr; // View not found
            }

            return *it;
        }

        void ViewManager::showAlert(const std::string &title, const std::string &message,
                                    std::function<void()> callback)
        {
            createAlert(title, message, callback, nullptr);
        }

        void ViewManager::showConfirmDialog(const std::string &title, const std::string &message,
                                            std::function<void()> onConfirm,
                                            std::function<void()> onCancel)
        {
            createAlert(title, message, onConfirm, onCancel);
        }

        void ViewManager::createAlert(const std::string &title, const std::string &message,
                                      std::function<void()> onConfirm,
                                      std::function<void()> onCancel)
        {
            if (!initialized || !alertContainer)
                return;

            // Clear previous alert content
            lv_obj_clean(alertContainer);

            // Create title
            lv_obj_t *titleLabel = lv_label_create(alertContainer);
            lv_label_set_text(titleLabel, title.c_str());
            lv_obj_set_style_text_font(titleLabel, &lv_font_montserrat_16, 0);
            lv_obj_set_style_text_color(titleLabel, themeConfig.textColor, 0);
            lv_obj_align(titleLabel, LV_ALIGN_TOP_MID, 0, 10);

            // Create message
            lv_obj_t *msgLabel = lv_label_create(alertContainer);
            lv_label_set_text(msgLabel, message.c_str());
            lv_obj_set_style_text_color(msgLabel, themeConfig.textColor, 0);
            lv_obj_set_width(msgLabel, lv_obj_get_width(alertContainer) - 40);
            lv_obj_align(msgLabel, LV_ALIGN_TOP_MID, 0, 40);

            // Create buttons
            if (onCancel)
            {
                // Two buttons: OK and Cancel
                lv_obj_t *confirmBtn = lv_btn_create(alertContainer);
                lv_obj_set_size(confirmBtn, 100, 40);
                lv_obj_align(confirmBtn, LV_ALIGN_BOTTOM_LEFT, 20, -10);
                lv_obj_set_style_bg_color(confirmBtn, themeConfig.primaryColor, 0);

                lv_obj_t *confirmLabel = lv_label_create(confirmBtn);
                lv_label_set_text(confirmLabel, "OK");
                lv_obj_center(confirmLabel);

                lv_obj_t *cancelBtn = lv_btn_create(alertContainer);
                lv_obj_set_size(cancelBtn, 100, 40);
                lv_obj_align(cancelBtn, LV_ALIGN_BOTTOM_RIGHT, -20, -10);
                lv_obj_set_style_bg_color(cancelBtn, themeConfig.accentColor, 0);

                lv_obj_t *cancelLabel = lv_label_create(cancelBtn);
                lv_label_set_text(cancelLabel, "Cancel");
                lv_obj_center(cancelLabel);

                // Add event handlers - using copies of callbacks to avoid capture issues
                auto confirmCallback = onConfirm;
                lv_obj_add_event_cb(confirmBtn, [](lv_event_t *e)
                                    {
            auto* fn = static_cast<std::function<void()>*>(lv_event_get_user_data(e));
            if (fn) (*fn)();
            
            // Hide the alert
            lv_obj_t* alertCont = lv_obj_get_parent(lv_obj_get_parent(lv_event_get_target(e)));
            lv_obj_add_flag(alertCont, LV_OBJ_FLAG_HIDDEN); }, LV_EVENT_CLICKED, new std::function<void()>(confirmCallback));

                auto cancelCallback = onCancel;
                lv_obj_add_event_cb(cancelBtn, [](lv_event_t *e)
                                    {
            auto* fn = static_cast<std::function<void()>*>(lv_event_get_user_data(e));
            if (fn) (*fn)();
            
            // Hide the alert
            lv_obj_t* alertCont = lv_obj_get_parent(lv_obj_get_parent(lv_event_get_target(e)));
            lv_obj_add_flag(alertCont, LV_OBJ_FLAG_HIDDEN); }, LV_EVENT_CLICKED, new std::function<void()>(cancelCallback));
            }
            else
            {
                // Just one button: OK
                lv_obj_t *okBtn = lv_btn_create(alertContainer);
                lv_obj_set_size(okBtn, 100, 40);
                lv_obj_align(okBtn, LV_ALIGN_BOTTOM_MID, 0, -10);
                lv_obj_set_style_bg_color(okBtn, themeConfig.primaryColor, 0);

                lv_obj_t *okLabel = lv_label_create(okBtn);
                lv_label_set_text(okLabel, "OK");
                lv_obj_center(okLabel);

                // Add event handler - using a copy of the callback to avoid capture issues
                auto confirmCallback = onConfirm;
                lv_obj_add_event_cb(okBtn, [](lv_event_t *e)
                                    {
            auto* fn = static_cast<std::function<void()>*>(lv_event_get_user_data(e));
            if (fn) (*fn)();
            
            // Hide the alert
            lv_obj_t* alertCont = lv_obj_get_parent(lv_obj_get_parent(lv_event_get_target(e)));
            lv_obj_add_flag(alertCont, LV_OBJ_FLAG_HIDDEN); }, LV_EVENT_CLICKED, new std::function<void()>(confirmCallback));
            }

            // Show alert with animation
            lv_obj_clear_flag(alertContainer, LV_OBJ_FLAG_HIDDEN);
            lv_obj_move_foreground(alertContainer);

            // Add fade-in animation
            lv_obj_set_style_opa(alertContainer, 0, 0);

            lv_anim_t a;
            lv_anim_init(&a);
            lv_anim_set_var(&a, alertContainer);
            lv_anim_set_time(&a, 200);
            lv_anim_set_exec_cb(&a, [](void *var, int32_t v)
                                { lv_obj_set_style_opa((lv_obj_t *)var, v, 0); });
            lv_anim_set_values(&a, 0, 255);
            lv_anim_start(&a);
        }

        void ViewManager::setDefaultAnimationConfig(const AnimationConfig &config)
        {
            defaultAnimConfig = config;
        }

        void ViewManager::setTheme(const ThemeConfig &config)
        {
            themeConfig = config;

            // Apply the new theme
            if (initialized)
            {
                applyTheme();
            }
        }

        void ViewManager::applyTheme()
        {
            if (!initialized)
                return;

            // Set colors in navbar
            lv_obj_set_style_bg_color(navbar, themeConfig.primaryColor, 0);
            lv_obj_set_style_text_color(navbar, themeConfig.textColor, 0);

            // Set colors in content area
            lv_obj_set_style_bg_color(contentArea, themeConfig.backgroundColor, 0);

            // Apply theme to all views (this is a notification, views need to handle it themselves)
            for (auto &view : views)
            {
                if (view->obj)
                {
                    lv_obj_set_style_bg_color(view->obj, themeConfig.backgroundColor, 0);
                    lv_obj_set_style_text_color(view->obj, themeConfig.textColor, 0);
                }
            }
        }

        void ViewManager::update()
        {
            if (!initialized)
                return;

            // Update the current view
            if (currentView)
            {
                currentView->update();
            }
        }

        // Global convenience functions
        std::shared_ptr<View> createLoadingScreen(const std::string &message, bool spinnerEnabled)
        {
            auto view = std::make_shared<View>("Loading");

            // When view is initialized, we'll set up the loading UI
            auto initFunction = [view, message, spinnerEnabled](lv_obj_t *parent)
            {
                // Create the container
                lv_obj_t *obj = lv_obj_create(parent);
                lv_obj_set_size(obj, lv_obj_get_width(parent), lv_obj_get_height(parent));
                lv_obj_set_pos(obj, 0, 0);
                lv_obj_add_flag(obj, LV_OBJ_FLAG_HIDDEN); // Hidden by default

                // Create loading message
                lv_obj_t *msgLabel = lv_label_create(obj);
                lv_label_set_text(msgLabel, message.c_str());
                lv_obj_align(msgLabel, LV_ALIGN_CENTER, 0, spinnerEnabled ? 40 : 0);

                if (spinnerEnabled)
                {
                    // Create a simple spinner (using arc since spinner might not be available)
                    lv_obj_t *spinner = lv_arc_create(obj);
                    lv_obj_set_size(spinner, 80, 80);
                    lv_arc_set_rotation(spinner, 270);
                    lv_arc_set_bg_angles(spinner, 0, 360);
                    lv_arc_set_angles(spinner, 0, 90);
                    lv_obj_align(spinner, LV_ALIGN_CENTER, 0, -20);
                    lv_obj_remove_style(spinner, NULL, LV_PART_KNOB);
                }

                // Now view is properly captured in the lambda
                view->obj = obj;
            };

            // Corrected function pointer usage
            view->initialize = [initFunction](lv_obj_t *parent)
            {
                initFunction(parent);
            };

            return view;
        }

        void initGraphics()
        {
            ViewManager::getInstance().initialize();
        }

        void updateGraphics()
        {
            ViewManager::getInstance().update();
        }

        bool switchView(const std::string &name)
        {
            return ViewManager::getInstance().switchToView(name);
        }

        void showAlert(const std::string &title, const std::string &message,
                       std::function<void()> callback)
        {
            ViewManager::getInstance().showAlert(title, message, callback);
        }

    } // namespace graphics
} // namespace insights
/**
 * @file graphics.h
 * @brief InsightsGL - A modern graphics library for robotics interfaces
 * @ingroup graphics
 *
 * This is the main header file for the InsightsGL graphics library.
 * Including this file will include all graphics components.
 */

#pragma once

#include "graphics/core.h"
#include "graphics/widgets.h"
#include "graphics/views.h"

namespace insights
{
    // Forward declarations of common functions for convenience
    namespace graphics
    {
        // Import most useful functions into the insights namespace for easier access
        using insights::graphics::createConsoleView;
        using insights::graphics::createControlPanelView;
        using insights::graphics::createDashboardView;
        using insights::graphics::initGraphics;
        using insights::graphics::showAlert;
        using insights::graphics::switchView;
        using insights::graphics::updateGraphics;

        // Theme management
        using insights::graphics::ThemeConfig;

        // Animation configuration
        using insights::graphics::AnimationConfig;
        using insights::graphics::AnimationType;
    }
}
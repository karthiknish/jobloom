"use client";

import { useEffect } from "react";
import { usePageViewTracker } from "@/app/page-view-tracker";

interface AnalyticsTrackerProps {
  pageName?: string;
  pageTitle?: string;
  customEvents?: Record<string, any>;
  enableTracking?: boolean;
}

export function AnalyticsTracker({ 
  pageName, 
  pageTitle, 
  customEvents = {}, 
  enableTracking = true 
}: AnalyticsTrackerProps) {
  const { trackEngagement, trackScrollDepth, trackTimeOnPage } = usePageViewTracker({
    enableAutoTracking: enableTracking,
    enableTimeTracking: enableTracking,
    enableScrollDepthTracking: enableTracking,
    enableEngagementTracking: enableTracking,
    enablePerformanceTracking: enableTracking,
  });

  useEffect(() => {
    if (!enableTracking) return;

    // Track custom events if provided
    Object.entries(customEvents).forEach(([eventName, eventData]) => {
      trackEngagement(eventName, eventData);
    });
  }, [customEvents, trackEngagement, enableTracking]);

  return null; // This is a tracking component, no UI
}

interface GlobalAnalyticsTrackerProps {
  children: React.ReactNode;
  enableGlobalTracking?: boolean;
}

export function GlobalAnalyticsTracker({ 
  children, 
  enableGlobalTracking = true 
}: GlobalAnalyticsTrackerProps) {
  const { trackEngagement } = usePageViewTracker({
    enableAutoTracking: enableGlobalTracking,
    enableTimeTracking: enableGlobalTracking,
    enableScrollDepthTracking: enableGlobalTracking,
    enableEngagementTracking: enableGlobalTracking,
    enablePerformanceTracking: enableGlobalTracking,
  });

  // Set up global click tracking
  useEffect(() => {
    if (!enableGlobalTracking) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementData = {
        tag_name: target.tagName.toLowerCase(),
        element_id: target.id || '',
        element_class: target.className || '',
        element_text: target.textContent?.slice(0, 100) || '',
        element_type: target.getAttribute('type') || '',
        href: target.getAttribute('href') || '',
        button_text: target.textContent || '',
        parent_element_id: target.parentElement?.id || '',
        parent_element_class: target.parentElement?.className || '',
        is_button: target.tagName.toLowerCase() === 'button' || target.getAttribute('type') === 'button',
        is_link: target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'link',
        is_input: target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'select',
        page_url: window.location.pathname,
        timestamp: Date.now(),
      };

      trackEngagement('element_click', elementData);
    };

    const handleFormSubmit = (event: Event) => {
      const target = event.target as HTMLFormElement;
      const formData = new FormData(target);
      
      const formEventData = {
        form_id: target.id || '',
        form_class: target.className || '',
        form_action: target.action || '',
        form_method: target.method || '',
        form_name: target.name || '',
        input_count: target.querySelectorAll('input').length,
        textarea_count: target.querySelectorAll('textarea').length,
        select_count: target.querySelectorAll('select').length,
        has_required_fields: target.querySelectorAll('[required]').length > 0,
        page_url: window.location.pathname,
        timestamp: Date.now(),
      };

      trackEngagement('form_submit', formEventData);
    };

    const handleInputFocus = (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      const inputData = {
        input_id: target.id || '',
        input_name: target.name || '',
        input_type: target.type || '',
        input_placeholder: target.placeholder || '',
        is_required: target.hasAttribute('required'),
        input_max_length: target.maxLength || -1,
        page_url: window.location.pathname,
        timestamp: Date.now(),
      };

      trackEngagement('input_focus', inputData);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('focus', handleInputFocus, true);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('focus', handleInputFocus, true);
    };
  }, [trackEngagement, enableGlobalTracking]);

  return <>{children}</>;
}

export default AnalyticsTracker;

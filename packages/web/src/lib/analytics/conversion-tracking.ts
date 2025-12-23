import { analyticsService, ANALYTICS_EVENTS } from "@/firebase/analytics";

// Conversion tracking configuration
export interface ConversionConfig {
  conversionType: 'sign_up' | 'login' | 'cv_upload' | 'job_application' | 'premium_upgrade' | 'portfolio_creation';
  value?: number;
  currency?: string;
  category?: string;
  label?: string;
  description?: string;
}

// Goal tracking configuration
export interface GoalConfig {
  goalName: string;
  goalType: 'macro' | 'micro';
  value?: number;
  description?: string;
  steps?: string[];
}

// Funnel tracking
export interface FunnelStep {
  stepName: string;
  stepNumber: number;
  funnelName: string;
  customData?: Record<string, any>;
}

// Conversion tracking service
export class ConversionTrackingService {
  // Track macro conversions (primary business goals)
  async trackMacroConversion(config: ConversionConfig, additionalData?: Record<string, any>) {
    const conversionData = {
      conversion_type: config.conversionType,
      conversion_category: config.category || 'general',
      conversion_label: config.label || config.conversionType,
      conversion_value: config.value || 0,
      currency: config.currency || 'usd',
      timestamp: Date.now(),
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      ...additionalData,
    };

    // Track conversion event
    await analyticsService.logEvent({
      name: 'macro_conversion',
      parameters: conversionData,
    });

    // Track specific conversion type events
    switch (config.conversionType) {
      case 'sign_up':
        await analyticsService.logSignUp('web', additionalData?.userId);
        break;
      case 'login':
        await analyticsService.logLogin('web', additionalData?.userId);
        break;
      case 'cv_upload':
        await analyticsService.logCvUploaded(
          additionalData?.cvId || '', 
          additionalData?.fileSize || 0, 
          additionalData?.fileType || 'unknown'
        );
        break;
      case 'job_application':
        await analyticsService.logJobApplied(
          additionalData?.jobId || '',
          additionalData?.applicationId || '',
          additionalData?.jobTitle || 'Unknown Job'
        );
        break;
      case 'premium_upgrade':
        await analyticsService.logSubscriptionUpgrade(
          additionalData?.previousPlan || 'free',
          additionalData?.newPlan || 'premium',
          config.value || 0,
          config.currency
        );
        break;
    }

    // Track goal completion
    await this.trackGoalCompletion(
      `${config.conversionType}_completed`,
      'macro',
      config.value,
      config.description || `Macro conversion: ${config.conversionType}`
    );
  }

  // Track micro conversions (smaller engagement actions)
  async trackMicroConversion(action: string, data?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'micro_conversion',
      parameters: {
        action: action,
        timestamp: Date.now(),
        page_url: typeof window !== 'undefined' ? window.location.pathname : '',
        ...data,
      },
    });

    await this.trackGoalCompletion(
      `micro_${action}`,
      'micro',
      data?.value,
      `Micro conversion: ${action}`
    );
  }

  // Track goal completion
  async trackGoalCompletion(goalName: string, goalType: 'macro' | 'micro', value?: number, description?: string) {
    await analyticsService.logEvent({
      name: ANALYTICS_EVENTS.GOAL_COMPLETED,
      parameters: {
        goal_name: goalName,
        goal_type: goalType,
        goal_value: value || 0,
        goal_description: description || '',
        timestamp: Date.now(),
        page_url: typeof window !== 'undefined' ? window.location.pathname : '',
        session_id: this.getSessionId(),
      },
    });
  }

  // Track funnel progress
  async trackFunnelStep(step: FunnelStep) {
    await analyticsService.logEvent({
      name: 'funnel_step_completed',
      parameters: {
        funnel_name: step.funnelName,
        step_name: step.stepName,
        step_number: step.stepNumber,
        timestamp: Date.now(),
        ...step.customData,
      },
    });

    // Track funnel completion if it's the last step
    if (step.stepNumber === this.getFunnelTotalSteps(step.funnelName)) {
      await analyticsService.logEvent({
        name: 'funnel_completed',
        parameters: {
          funnel_name: step.funnelName,
          completion_time: Date.now(),
          total_steps: step.stepNumber,
        },
      });
      
      await this.trackGoalCompletion(
        `funnel_${step.funnelName}`,
        'macro',
        10, // Funnel completion value
        `Complete funnel: ${step.funnelName}`
      );
    }
  }

  // Track revenue and e-commerce events
  async trackPurchase(orderId: string, items: any[], revenue: number, currency = 'usd') {
    await analyticsService.logEvent({
      name: 'purchase',
      parameters: {
        order_id: orderId,
        items: items,
        revenue: revenue,
        currency: currency,
        timestamp: Date.now(),
      },
    });

    await this.trackMacroConversion({
      conversionType: 'premium_upgrade',
      value: revenue,
      currency: currency,
      category: 'premium_features',
      label: 'premium_purchase',
    }, { orderId, items });
  }

  // Track content engagement
  async trackContentAction(contentType: string, contentId: string, action: string, metadata?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'content_interaction',
      parameters: {
        content_type: contentType,
        content_id: contentId,
        action: action,
        timestamp: Date.now(),
        ...metadata,
      },
    });

    // Track as micro conversion
    await this.trackMicroConversion(`${contentType}_${action}`, {
      contentId,
      contentType,
      ...metadata,
    });
  }

  // Track user retention events
  async trackUserRetentionEvent(eventType: 'daily_engagement' | 'weekly_retention' | 'monthly_retention', userId: string, data?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'user_retention',
      parameters: {
        retention_type: eventType,
        user_id: userId,
        timestamp: Date.now(),
        ...data,
      },
    });

    if (eventType === 'daily_engagement') {
      await this.trackMicroConversion('daily_active_user', { userId, ...data });
    } else if (eventType === 'weekly_retention') {
      await this.trackGoalCompletion('weekly_retention', 'micro', 5, 'User returned within 7 days');
    } else if (eventType === 'monthly_retention') {
      await this.trackGoalCompletion('monthly_retention', 'macro', 15, 'User returned within 30 days');
    }
  }

  // Track feature adoption
  async trackFeatureAdoption(featureName: string, adoptionLevel: 'first_time' | 'regular_use' | 'power_user', metadata?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'feature_adoption',
      parameters: {
        feature_name: featureName,
        adoption_level: adoptionLevel,
        timestamp: Date.now(),
        ...metadata,
      },
    });

    const values = {
      'first_time': 3,
      'regular_use': 7,
      'power_user': 15,
    };

    await this.trackGoalCompletion(
      `feature_${featureName}_${adoptionLevel}`,
      adoptionLevel === 'power_user' ? 'macro' : 'micro',
      values[adoptionLevel],
      `Feature adoption: ${featureName} - ${adoptionLevel}`
    );
  }

  // Track A/B test participation
  async trackABTestParticipation(testName: string, variant: string, metadata?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'ab_test_participation',
      parameters: {
        test_name: testName,
        test_variant: variant,
        timestamp: Date.now(),
        ...metadata,
      },
    });

    await this.trackMicroConversion('ab_test_participation', {
      testName,
      variant,
      ...metadata,
    });
  }

  // Utility methods
  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('analytics_session_id') : '';
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
    }
    
    return sessionId;
  }

  private getFunnelTotalSteps(funnelName: string): number {
    // Define funnel configurations
    const funnelSteps: Record<string, number> = {
      'onboarding': 5, // Sign up -> Email -> Profile -> Preferences -> Complete
      'application_process': 4, // Find job -> View details -> Apply -> Confirmation
      'premium_upgrade': 3, // Click upgrade -> Choose plan -> Payment -> Complete
      'cv_upload': 3, // Select file -> Upload -> Analysis -> Complete
      'portfolio_creation': 4, // Start -> Add content -> Customize -> Publish
    };

    return funnelSteps[funnelName] || 1;
  }

  // Track error events affecting conversion
  async trackConversionError(errorType: string, error: Error, context: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'conversion_error',
      parameters: {
        error_type: errorType,
        error_message: error.message,
        error_stack: error.stack,
        context: JSON.stringify(context),
        timestamp: Date.now(),
      },
    });
  }

  // Track cart abandonment for premium features
  async trackPremiumFeatureAbandonment(feature: string, step: string, metadata?: Record<string, any>) {
    await analyticsService.logEvent({
      name: 'premium_feature_abandonment',
      parameters: {
        feature_name: feature,
        abandonment_step: step,
        timestamp: Date.now(),
        ...metadata,
      },
    });

    await this.trackMicroConversion('premium_feature_abandonment', {
      feature,
      step,
      ...metadata,
    });
  }
}

export const conversionTracking = new ConversionTrackingService();

// React hook for conversion tracking
export function useConversionTracking() {
  const trackMacroConversion = (config: ConversionConfig, additionalData?: Record<string, any>) => {
    return conversionTracking.trackMacroConversion(config, additionalData);
  };

  const trackMicroConversion = (action: string, data?: Record<string, any>) => {
    return conversionTracking.trackMicroConversion(action, data);
  };

  const trackGoalCompletion = (goalName: string, goalType: 'macro' | 'micro', value?: number, description?: string) => {
    return conversionTracking.trackGoalCompletion(goalName, goalType, value, description);
  };

  const trackFunnelStep = (step: FunnelStep) => {
    return conversionTracking.trackFunnelStep(step);
  };

  const trackFeatureAdoption = (featureName: string, adoptionLevel: 'first_time' | 'regular_use' | 'power_user', metadata?: Record<string, any>) => {
    return conversionTracking.trackFeatureAdoption(featureName, adoptionLevel, metadata);
  };

  return {
    trackMacroConversion,
    trackMicroConversion,
    trackGoalCompletion,
    trackFunnelStep,
    trackFeatureAdoption,
  };
}

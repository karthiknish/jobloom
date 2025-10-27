/**
 * Enhanced Hook for CV Evaluator API
 * Integrates with the new error handling system
 */

import { useState, useCallback } from 'react';
import { useEnhancedApi } from './useEnhancedApi';
import { CvAnalysis, CvStats } from '@/types/api';
import { cvEvaluatorApi } from '@/utils/api/cvEvaluator';
import { FrontendApiError } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface UseCvEvaluatorOptions {
  userId?: string;
  showNotifications?: boolean;
  onError?: (error: FrontendApiError) => void;
  onSuccess?: (data: any) => void;
}

export function useCvEvaluator(options: UseCvEvaluatorOptions = {}) {
  const { userId, showNotifications = true, onError, onSuccess } = options;

  // Get user's CV analyses
  const {
    data: analyses,
    loading: loadingAnalyses,
    error: analysesError,
    execute: fetchAnalyses,
    refetch: refetchAnalyses
  } = useEnhancedApi<CvAnalysis[]>(
    useCallback(async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return cvEvaluatorApi.getUserCvAnalyses(userId);
    }, [userId]),
    {
      immediate: !!userId,
      onError: (error) => {
        if (showNotifications) {
          toast.error('Failed to load CV analyses');
        }
        onError?.(error);
      },
      onSuccess
    }
  );

  // Get CV statistics
  const {
    data: stats,
    loading: loadingStats,
    error: statsError,
    execute: fetchStats,
    refetch: refetchStats
  } = useEnhancedApi<CvStats>(
    useCallback(async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return cvEvaluatorApi.getCvAnalysisStats(userId);
    }, [userId]),
    {
      immediate: !!userId,
      onError: (error) => {
        if (showNotifications) {
          toast.error('Failed to load CV statistics');
        }
        onError?.(error);
      },
      onSuccess
    }
  );

  // Upload and analyze CV
  const {
    data: uploadResult,
    loading: uploading,
    error: uploadError,
    execute: uploadCv
  } = useEnhancedApi(
    useCallback(async (file: File, options?: {
      targetRole?: string;
      industry?: string;
    }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // This would integrate with the CV upload API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      
      if (options?.targetRole) {
        formData.append('targetRole', options.targetRole);
      }
      
      if (options?.industry) {
        formData.append('industry', options.industry);
      }

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        headers: {
          'Authorization': await getAuthToken(),
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      return response.json();
    }, [userId]),
    {
      immediate: false,
      showGlobalError: true,
      onError: (error) => {
        if (showNotifications) {
          toast.error('CV upload failed');
        }
        onError?.(error);
      },
      onSuccess: (result) => {
        if (showNotifications) {
          toast.success('CV uploaded successfully! Analysis in progress...');
        }
        
        // Refresh analyses after successful upload
        refetchAnalyses();
        refetchStats();
        
        onSuccess?.(result);
      }
    }
  );

  // Delete CV analysis
  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      await cvEvaluatorApi.deleteCvAnalysis(analysisId);
      
      if (showNotifications) {
        toast.success('CV analysis deleted');
      }
      
      // Refresh data
      refetchAnalyses();
      refetchStats();
      
      return true;
    } catch (error) {
      if (showNotifications) {
        toast.error('Failed to delete CV analysis');
      }
      onError?.(error as FrontendApiError);
      return false;
    }
  }, [showNotifications, onError, refetchAnalyses, refetchStats]);

  // Refresh all data
  const refresh = useCallback(() => {
    return Promise.all([
      refetchAnalyses(),
      refetchStats()
    ]);
  }, [refetchAnalyses, refetchStats]);

  // Get analyses by status
  const getAnalysesByStatus = useCallback((status: string) => {
    if (!analyses) return [];
    return analyses.filter(analysis => analysis.analysisStatus === status);
  }, [analyses]);

  // Get completed analyses
  const completedAnalyses = getAnalysesByStatus('completed');
  
  // Get pending analyses
  const pendingAnalyses = getAnalysesByStatus('pending');
  
  // Get failed analyses
  const failedAnalyses = getAnalysesByStatus('failed');

  // Get recent analysis
  const recentAnalysis = analyses && analyses.length > 0 
    ? analyses.sort((a, b) => b.createdAt - a.createdAt)[0] 
    : null;

  return {
    // Data
    analyses,
    stats,
    uploadResult,
    recentAnalysis,
    completedAnalyses,
    pendingAnalyses,
    failedAnalyses,
    
    // Loading states
    loading: loadingAnalyses || loadingStats,
    uploading,
    
    // Error states
    error: analysesError || statsError || uploadError,
    
    // Actions
    fetchAnalyses,
    fetchStats,
    uploadCv,
    deleteAnalysis,
    refresh,
    refetchAnalyses,
    refetchStats,
    getAnalysesByStatus
  };
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const user = (window as any).firebase?.auth()?.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  }
  return '';
}

export default useCvEvaluator;

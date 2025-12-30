/**
 * Enhanced Hook for CV Evaluator API
 * Uses TanStack Query for data fetching and mutations
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CvAnalysis, CvStats } from '@/types/api';
import { cvEvaluatorApi } from '@/utils/api/cvEvaluator';
import { FrontendApiError, apiClient } from '@/lib/api/client';
import { showSuccess, showError } from '@/components/ui/Toast';

interface UseCvEvaluatorOptions {
  userId?: string;
  showNotifications?: boolean;
  onError?: (error: FrontendApiError) => void;
  onSuccess?: (data: any) => void;
}

export function useCvEvaluator(options: UseCvEvaluatorOptions = {}) {
  const { userId, showNotifications = true, onError, onSuccess } = options;
  const queryClient = useQueryClient();

  // Get user's Resume analyses using TanStack Query
  const {
    data: analyses,
    isLoading: loadingAnalyses,
    error: analysesError,
    refetch: refetchAnalyses
  } = useQuery<CvAnalysis[]>({
    queryKey: ['cvAnalyses', 'list', userId],
    queryFn: () => cvEvaluatorApi.getUserCvAnalyses(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Get CV statistics using TanStack Query
  const {
    data: stats,
    isLoading: loadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery<CvStats>({
    queryKey: ['cvAnalyses', 'stats', userId],
    queryFn: () => cvEvaluatorApi.getCvAnalysisStats(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Get upload limits using TanStack Query
  const {
    data: limitsData,
    isLoading: loadingLimits
  } = useQuery({
    queryKey: ['cvAnalyses', 'limits'],
    queryFn: () => cvEvaluatorApi.getUploadLimits(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Upload and analyze CV mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, options: uploadOptions }: {
      file: File;
      options?: { targetRole?: string; industry?: string };
    }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return apiClient.upload('/api/cv/upload', file, {
        userId,
        targetRole: uploadOptions?.targetRole,
        industry: uploadOptions?.industry
      });
    },
    onSuccess: (result) => {
      if (showNotifications) {
        showSuccess('Resume uploaded successfully! Analysis in progress...');
      }
      // Refresh analyses after successful upload
      queryClient.invalidateQueries({ queryKey: ['cvAnalyses'] });
      onSuccess?.(result);
    },
    onError: (error) => {
      if (showNotifications) {
        showError('CV upload failed');
      }
      onError?.(error as FrontendApiError);
    },
  });

  // Delete Resume analysis mutation
  const deleteMutation = useMutation({
    mutationFn: (analysisId: string) => cvEvaluatorApi.deleteCvAnalysis(analysisId),
    onSuccess: () => {
      if (showNotifications) {
        showSuccess('Resume analysis deleted');
      }
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['cvAnalyses'] });
    },
    onError: (error) => {
      if (showNotifications) {
        showError('Failed to delete Resume analysis');
      }
      onError?.(error as FrontendApiError);
    },
  });

  // Upload wrapper function matching original API
  const uploadCv = useCallback((file: File, uploadOptions?: {
    targetRole?: string;
    industry?: string;
  }) => {
    return uploadMutation.mutateAsync({ file, options: uploadOptions });
  }, [uploadMutation]);

  // Delete wrapper function
  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      await deleteMutation.mutateAsync(analysisId);
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation]);

  // Refresh all data
  const refresh = useCallback(() => {
    return Promise.all([
      refetchAnalyses(),
      refetchStats()
    ]);
  }, [refetchAnalyses, refetchStats]);

  // Ensure analyses is always an array
  const safeAnalyses = Array.isArray(analyses) ? analyses : [];

  // Get analyses by status
  const getAnalysesByStatus = useCallback((status: string) => {
    return safeAnalyses.filter(analysis => analysis.analysisStatus === status);
  }, [safeAnalyses]);

  // Get completed analyses
  const completedAnalyses = safeAnalyses.filter(analysis => analysis.analysisStatus === 'completed');
  
  // Get pending analyses
  const pendingAnalyses = safeAnalyses.filter(analysis => analysis.analysisStatus === 'pending');
  
  // Get failed analyses
  const failedAnalyses = safeAnalyses.filter(analysis => analysis.analysisStatus === 'failed');

  // Get recent analysis
  const recentAnalysis = safeAnalyses.length > 0 
    ? [...safeAnalyses].sort((a, b) => b.createdAt - a.createdAt)[0] 
    : null;

  return {
    // Data
    analyses: safeAnalyses,
    stats,
    uploadResult: uploadMutation.data,
    recentAnalysis,
    completedAnalyses,
    pendingAnalyses,
    failedAnalyses,
    
    // Loading states
    loading: loadingAnalyses || loadingStats,
    uploading: uploadMutation.isPending,
    
    // Error states
    error: analysesError || statsError || uploadMutation.error,
    
    // Actions
    fetchAnalyses: refetchAnalyses,
    fetchStats: refetchStats,
    uploadCv,
    deleteAnalysis,
    refresh,
    refetchAnalyses,
    refetchStats,
    getAnalysesByStatus,
    uploadLimits: limitsData?.uploadLimits,
    loadingLimits
  };
}

export default useCvEvaluator;


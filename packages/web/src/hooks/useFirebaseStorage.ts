// Custom hook for Firebase Storage operations
import { useState, useCallback } from 'react';
import {
  uploadCVFile,
  uploadProfilePicture,
  deleteFile,
  getFileDownloadURL,
  validateFile,
  type FileUploadOptions,
  type FileUploadResult,
} from '@/firebase/storage';

interface UseStorageUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: FileUploadResult | null;
}

interface UseStorageUploadReturn extends UseStorageUploadState {
  uploadCV: (file: File, userId: string, options?: FileUploadOptions) => Promise<FileUploadResult | null>;
  uploadProfilePicture: (file: File, userId: string, options?: FileUploadOptions) => Promise<FileUploadResult | null>;
  reset: () => void;
}

export function useStorageUpload(): UseStorageUploadReturn {
  const [state, setState] = useState<UseStorageUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  const uploadCV = useCallback(async (
    file: File,
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> => {
    // Validate file first
    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
    });

    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
      return null;
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      const result = await uploadCVFile(file, userId, {
        ...options,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
          options.onProgress?.(progress);
        },
        onError: (error) => {
          setState(prev => ({ ...prev, error: error.message }));
          options.onError?.(error);
        },
      });

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
        progress: 0,
      }));
      return null;
    }
  }, []);

  const uploadProfilePic = useCallback(async (
    file: File,
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> => {
    // Validate file first
    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
      return null;
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      const result = await uploadProfilePicture(file, userId, {
        ...options,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
          options.onProgress?.(progress);
        },
        onError: (error) => {
          setState(prev => ({ ...prev, error: error.message }));
          options.onError?.(error);
        },
      });

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
        progress: 0,
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    uploadCV,
    uploadProfilePicture: uploadProfilePic,
    reset,
  };
}

// Hook for managing file URLs with caching
interface UseFileURLState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

interface UseFileURLReturn extends UseFileURLState {
  loadURL: (path: string) => Promise<string | null>;
  clearURL: () => void;
}

export function useFileURL(): UseFileURLReturn {
  const [state, setState] = useState<UseFileURLState>({
    url: null,
    loading: false,
    error: null,
  });

  const loadURL = useCallback(async (path: string): Promise<string | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const url = await getFileDownloadURL(path);
      setState(prev => ({ ...prev, url, loading: false }));
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file URL';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return null;
    }
  }, []);

  const clearURL = useCallback(() => {
    setState({ url: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    loadURL,
    clearURL,
  };
}

// Hook for file operations (delete, etc.)
interface UseFileOperationsState {
  loading: boolean;
  error: string | null;
}

interface UseFileOperationsReturn extends UseFileOperationsState {
  deleteFile: (path: string) => Promise<boolean>;
  reset: () => void;
}

export function useFileOperations(): UseFileOperationsReturn {
  const [state, setState] = useState<UseFileOperationsState>({
    loading: false,
    error: null,
  });

  const deleteFileOperation = useCallback(async (path: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await deleteFile(path);
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    deleteFile: deleteFileOperation,
    reset,
  };
}

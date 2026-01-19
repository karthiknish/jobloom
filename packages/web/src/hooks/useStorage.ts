"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface FileUploadResult {
  storageId: string;
  url: string; // We can get a signed URL if needed, or just the storageId
  name: string;
  size: number;
  contentType: string;
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

interface UseStorageUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: FileUploadResult | null;
}

interface UseStorageUploadReturn extends UseStorageUploadState {
  uploadCV: (file: File, options?: FileUploadOptions) => Promise<FileUploadResult | null>;
  uploadProfilePicture: (file: File, options?: FileUploadOptions) => Promise<FileUploadResult | null>;
  reset: () => void;
}

export function useStorageUpload(): UseStorageUploadReturn {
  const [state, setState] = useState<UseStorageUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createResumeVersion = useMutation(api.resumeVersions.create);
  const updateProfile = useMutation(api.users.updateProfile);
  const user = useQuery(api.users.viewer);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  const uploadFile = async (
    file: File,
    options: FileUploadOptions
  ): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));

      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      // Note: Fetch doesn't support progress events easily. XMLHttpRequest does.
      // For simplicity, we'll set progress to 50% then 100%.
      options.onProgress?.(10);
      
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      options.onProgress?.(100);

      return storageId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({ ...prev, uploading: false, error: errorMessage }));
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  };

  const uploadCV = useCallback(async (
    file: File,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: "Not authenticated" }));
      return null;
    }

    const storageId = await uploadFile(file, options);
    if (!storageId) return null;

    try {
      // 3. Save metadata
      await createResumeVersion({
        userId: user._id,
        fileName: file.name,
        fileUrl: "", // Legacy field, empty or maybe we put storageId?
        storageId: storageId as any, // Cast because types might not be generated yet
        fileSize: file.size,
        contentType: file.type,
      });

      const result: FileUploadResult = {
        storageId,
        url: "", // We'd need to query to get URL
        name: file.name,
        size: file.size,
        contentType: file.type,
      };

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Metadata save failed';
      setState(prev => ({ ...prev, uploading: false, error: errorMessage }));
      return null;
    }
  }, [user, generateUploadUrl, createResumeVersion]);

  const uploadProfilePicture = useCallback(async (
    file: File,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: "Not authenticated" }));
      return null;
    }

    const storageId = await uploadFile(file, options);
    if (!storageId) return null;

    try {
      const url = await updateProfile({
        userId: user._id,
        storageId: storageId as any,
        imageUrl: "", // Clear old URL or maybe update with new one if we fetch it?
      });

      const result: FileUploadResult = {
        storageId,
        url: url || "",
        name: file.name,
        size: file.size,
        contentType: file.type,
      };

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result,
        error: null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setState(prev => ({ ...prev, uploading: false, error: errorMessage }));
      return null;
    }
  }, [user, generateUploadUrl, updateProfile]);

  return {
    ...state,
    uploadCV,
    uploadProfilePicture,
    reset,
  };
}

// Firebase Storage utilities for file uploads and management
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  type UploadResult,
  type StorageReference,
  type ListResult,
  type FullMetadata,
  type SettableMetadata
} from "firebase/storage";
import { getStorageClient } from "./client";

export interface FileUploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface FileUploadResult {
  downloadURL: string;
  fullPath: string;
  name: string;
  size: number;
  contentType: string;
  timeCreated: string;
  updated: string;
}

export interface StorageError extends Error {
  code: string;
  customData?: any;
}

// Storage paths
export const STORAGE_PATHS = {
  CV_FILES: 'cv-files',
  PROFILE_PICTURES: 'profile-pictures',
  JOB_ATTACHMENTS: 'job-attachments',
  TEMP_FILES: 'temp-files',
} as const;

type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];

// Get storage reference
function getStorageRef(path?: string): StorageReference | null {
  const storage = getStorageClient();
  if (!storage) return null;
  return path ? ref(storage, path) : ref(storage);
}

// Upload file with progress tracking
export async function uploadFile(
  file: File,
  path: string,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  const fileRef = ref(storage, path);

  try {
    // Prepare metadata
    const metadata: SettableMetadata = {
      contentType: options.contentType || file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...options.customMetadata,
      },
    };

    // Upload file
    const uploadTask = uploadBytes(fileRef, file, metadata);

    // Handle progress if callback provided
    if (options.onProgress) {
      // Note: uploadBytes doesn't provide progress, but we can simulate it
      // For progress tracking, we'd need to use uploadBytesResumable
      options.onProgress(0);
    }

    const snapshot = await uploadTask;

    if (options.onProgress) {
      options.onProgress(100);
    }

    // Get download URL and metadata
    const [downloadURL, fileMetadata] = await Promise.all([
      getDownloadURL(snapshot.ref),
      getMetadata(snapshot.ref),
    ]);

    return {
      downloadURL,
      fullPath: snapshot.ref.fullPath,
      name: snapshot.ref.name,
      size: fileMetadata.size || file.size,
      contentType: fileMetadata.contentType || file.type,
      timeCreated: fileMetadata.timeCreated,
      updated: fileMetadata.updated,
    };
  } catch (error) {
    const storageError = error as StorageError;
    if (options.onError) {
      options.onError(storageError);
    }
    throw storageError;
  }
}

// Upload CV file
export async function uploadCVFile(
  file: File,
  userId: string,
  options: Omit<FileUploadOptions, 'contentType'> = {}
): Promise<FileUploadResult> {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  const path = `${STORAGE_PATHS.CV_FILES}/${userId}/${Date.now()}_${file.name}`;
  return uploadFile(file, path, {
    ...options,
    contentType: file.type,
    customMetadata: {
      fileType: 'cv',
      userId,
      ...options.customMetadata,
    },
  });
}

// Upload profile picture
export async function uploadProfilePicture(
  file: File,
  userId: string,
  options: Omit<FileUploadOptions, 'contentType'> = {}
): Promise<FileUploadResult> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  const path = `${STORAGE_PATHS.PROFILE_PICTURES}/${userId}/profile_${Date.now()}.${file.name.split('.').pop()}`;
  return uploadFile(file, path, {
    ...options,
    contentType: file.type,
    customMetadata: {
      fileType: 'profile-picture',
      userId,
      ...options.customMetadata,
    },
  });
}

// Delete file
export async function deleteFile(path: string): Promise<void> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    // If file doesn't exist, consider it successfully deleted
    if ((error as StorageError).code === 'storage/object-not-found') {
      return;
    }
    throw error;
  }
}

// Get file download URL
export async function getFileDownloadURL(path: string): Promise<string> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  const fileRef = ref(storage, path);
  return getDownloadURL(fileRef);
}

// List files in a directory
export async function listFiles(path: string): Promise<ListResult> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  const directoryRef = ref(storage, path);
  return listAll(directoryRef);
}

// Get file metadata
export async function getFileMetadata(path: string): Promise<FullMetadata> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  const fileRef = ref(storage, path);
  return getMetadata(fileRef);
}

// Update file metadata
export async function updateFileMetadata(
  path: string,
  metadata: SettableMetadata
): Promise<FullMetadata> {
  const storage = getStorageClient();
  if (!storage) {
  throw new Error('Storage service is not available');
  }

  const fileRef = ref(storage, path);
  return updateMetadata(fileRef, metadata);
}

// Batch delete files
export async function deleteFiles(paths: string[]): Promise<void[]> {
  const deletePromises = paths.map(path => deleteFile(path));
  return Promise.all(deletePromises);
}

// Clean up old files (useful for temp files)
export async function cleanupOldFiles(
  directoryPath: string,
  olderThanHours: number = 24
): Promise<string[]> {
  const listResult = await listFiles(directoryPath);
  const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

  const oldFiles: string[] = [];
  const deletePromises: Promise<void>[] = [];

  for (const item of listResult.items) {
    try {
      const metadata = await getMetadata(item);
      const createdTime = new Date(metadata.timeCreated).getTime();

      if (createdTime < cutoffTime) {
        oldFiles.push(item.fullPath);
        deletePromises.push(deleteObject(item));
      }
    } catch (error) {
      // Skip files that can't be accessed
      console.warn(`Could not check metadata for ${item.fullPath}:`, error);
    }
  }

  await Promise.all(deletePromises);
  return oldFiles;
}

// Generate unique file name
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
}

// Validate file before upload
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxNameLength?: number;
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    maxNameLength = 255,
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file name length
  if (file.name.length > maxNameLength) {
    return {
      valid: false,
      error: `File name too long. Maximum length is ${maxNameLength} characters.`,
    };
  }

  return { valid: true };
}

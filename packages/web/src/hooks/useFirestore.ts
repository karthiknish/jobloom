// Enhanced Firestore hooks with real-time updates, caching, and error handling
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  createFirestoreCollection,
  createQueryBuilder,
  type FirestoreCollection,
  type FirestoreDocument,
  type FirestoreQueryBuilder,
  type FirestoreConnectionState,
  getFirestoreConnectionState,
  addFirestoreConnectionListener,
  type FirestoreError,
} from '@/firebase/firestore';
import { showError } from '@/components/ui/Toast';

interface UseFirestoreOptions {
  enableRealtime?: boolean;
  errorHandler?: (error: FirestoreError) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseFirestoreState<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
  isConnected: boolean;
  lastUpdated: number | null;
}

// Hook for document operations
export function useFirestoreDocument<T extends FirestoreDocument>(
  collectionName: string,
  documentId: string | null,
  options: UseFirestoreOptions = {}
) {
  const {
    enableRealtime = true,
    errorHandler,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseFirestoreState<T>>({
    data: null,
    loading: true,
    error: null,
    isConnected: true,
    lastUpdated: null,
  });

  const collectionRef = useRef<FirestoreCollection<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize collection
  useEffect(() => {
    try {
      collectionRef.current = createFirestoreCollection<T>(collectionName);
    } catch (error) {
      const firestoreError = error as FirestoreError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: firestoreError,
      }));
      errorHandler?.(firestoreError);
    }
  }, [collectionName, errorHandler]);

  // Setup real-time subscription
  useEffect(() => {
    if (!collectionRef.current || !documentId || !enableRealtime) return;

    const unsubscribe = collectionRef.current.subscribeToDocument(documentId, (document) => {
      setState(prev => ({
        ...prev,
        data: document,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [documentId, enableRealtime]);

  // Manual fetch for non-realtime mode
  const fetch = useCallback(async () => {
    if (!collectionRef.current || !documentId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    let attempt = 0;
    const executeFetch = async (): Promise<void> => {
      try {
        const document = await collectionRef.current!.get(documentId);
        setState(prev => ({
          ...prev,
          data: document,
          loading: false,
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        const firestoreError = error as FirestoreError;

        if (attempt < retryAttempts) {
          attempt++;
          retryTimeoutRef.current = setTimeout(executeFetch, retryDelay * attempt);
          return;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: firestoreError,
        }));

        showError(firestoreError.message);
        errorHandler?.(firestoreError);
      }
    };

    await executeFetch();
  }, [documentId, retryAttempts, retryDelay, errorHandler]);

  // Manual fetch trigger
  useEffect(() => {
    if (!enableRealtime && documentId) {
      fetch();
    }
  }, [enableRealtime, documentId, fetch]);

  // Update document
  const update = useCallback(async (updates: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>) => {
    if (!collectionRef.current || !documentId) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      await collectionRef.current.update(documentId, updates);
      // Real-time updates will handle state changes
      if (!enableRealtime) {
        await fetch();
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: firestoreError,
      }));
      showError(firestoreError.message);
      errorHandler?.(firestoreError);
    }
  }, [documentId, enableRealtime, fetch, errorHandler]);

  // Delete document
  const remove = useCallback(async () => {
    if (!collectionRef.current || !documentId) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      await collectionRef.current.delete(documentId);
      setState(prev => ({
        ...prev,
        data: null,
        loading: false,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      const firestoreError = error as FirestoreError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: firestoreError,
      }));
      showError(firestoreError.message);
      errorHandler?.(firestoreError);
    }
  }, [documentId, errorHandler]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    update,
    remove,
    refetch: fetch,
  };
}

// Hook for collection operations
export function useFirestoreCollection<T extends FirestoreDocument>(
  collectionName: string,
  queryBuilder?: FirestoreQueryBuilder,
  options: UseFirestoreOptions = {}
) {
  const {
    enableRealtime = true,
    errorHandler,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseFirestoreState<T[]>>({
    data: null,
    loading: true,
    error: null,
    isConnected: true,
    lastUpdated: null,
  });

  const collectionRef = useRef<FirestoreCollection<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize collection
  useEffect(() => {
    try {
      collectionRef.current = createFirestoreCollection<T>(collectionName);
    } catch (error) {
      const firestoreError = error as FirestoreError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: firestoreError,
      }));
      errorHandler?.(firestoreError);
    }
  }, [collectionName, errorHandler]);

  // Setup real-time subscription
  useEffect(() => {
    if (!collectionRef.current || !enableRealtime) return;

    const constraints = queryBuilder?.getConstraints() || [];
    const unsubscribe = collectionRef.current.subscribe((documents) => {
      setState(prev => ({
        ...prev,
        data: documents,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    }, constraints);

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [enableRealtime, queryBuilder]);

  // Manual fetch for non-realtime mode
  const fetch = useCallback(async () => {
    if (!collectionRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    let attempt = 0;
    const executeFetch = async (): Promise<void> => {
      try {
        const constraints = queryBuilder?.getConstraints() || [];
        const documents = constraints.length > 0
          ? await collectionRef.current!.query(constraints)
          : await collectionRef.current!.getAll();

        setState(prev => ({
          ...prev,
          data: documents,
          loading: false,
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        const firestoreError = error as FirestoreError;

        if (attempt < retryAttempts) {
          attempt++;
          retryTimeoutRef.current = setTimeout(executeFetch, retryDelay * attempt);
          return;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: firestoreError,
        }));

        showError(firestoreError.message);
        errorHandler?.(firestoreError);
      }
    };

    await executeFetch();
  }, [queryBuilder, retryAttempts, retryDelay, errorHandler]);

  // Manual fetch trigger
  useEffect(() => {
    if (!enableRealtime) {
      fetch();
    }
  }, [enableRealtime, fetch]);

  // Create document
  const create = useCallback(async (data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) => {
    if (!collectionRef.current) return null;

    try {
      const document = await collectionRef.current.create(data);
      // Real-time updates will handle state changes
      if (!enableRealtime) {
        await fetch();
      }
      return document;
    } catch (error) {
      const firestoreError = error as FirestoreError;
      showError(firestoreError.message);
      errorHandler?.(firestoreError);
      return null;
    }
  }, [enableRealtime, fetch, errorHandler]);

  // Update document
  const update = useCallback(async (id: string, updates: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>) => {
    if (!collectionRef.current) return;

    try {
      await collectionRef.current.update(id, updates);
      // Real-time updates will handle state changes
      if (!enableRealtime) {
        await fetch();
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      showError(firestoreError.message);
      errorHandler?.(firestoreError);
    }
  }, [enableRealtime, fetch, errorHandler]);

  // Delete document
  const remove = useCallback(async (id: string) => {
    if (!collectionRef.current) return;

    try {
      await collectionRef.current.delete(id);
      // Real-time updates will handle state changes
      if (!enableRealtime) {
        await fetch();
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      showError(firestoreError.message);
      errorHandler?.(firestoreError);
    }
  }, [enableRealtime, fetch, errorHandler]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    create,
    update,
    remove,
    refetch: fetch,
  };
}

// Hook for Firestore connection state
export function useFirestoreConnection(): FirestoreConnectionState {
  const [state, setState] = useState<FirestoreConnectionState>(getFirestoreConnectionState);

  useEffect(() => {
    const unsubscribe = addFirestoreConnectionListener(setState);
    return unsubscribe;
  }, []);

  return state;
}

// Hook for query building
export function useFirestoreQuery() {
  return useMemo(() => createQueryBuilder(), []);
}

// Utility hook for optimistic updates
export function useOptimisticUpdate<T>(
  currentData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [optimisticData, setOptimisticData] = useState<T>(currentData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setOptimisticData(currentData);
  }, [currentData]);

  const update = useCallback(async (newData: T) => {
    setOptimisticData(newData);
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateFn(newData);
      setOptimisticData(result);
    } catch (err) {
      setError(err as Error);
      setOptimisticData(currentData); // Revert on error
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [currentData, updateFn]);

  return {
    data: optimisticData,
    isUpdating,
    error,
    update,
  };
}

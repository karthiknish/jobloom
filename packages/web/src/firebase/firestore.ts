// Enhanced Firestore utilities with better TypeScript support, real-time listeners, and error handling
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  type Query,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
  type WhereFilterOp,
  type OrderByDirection,
  type QueryConstraint,
  type WithFieldValue,
  type UpdateData,
  Timestamp,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
} from "firebase/firestore";
import { getDb, getConnectionState, addConnectionListener } from "./client";

// Enhanced types for better TypeScript support
export interface FirestoreDocument {
  _id: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FirestoreCollection<T extends FirestoreDocument> {
  create: (data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) => Promise<T>;
  createWithId: (id: string, data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) => Promise<T>;
  get: (id: string) => Promise<T | null>;
  getAll: () => Promise<T[]>;
  update: (id: string, data: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  query: (constraints: QueryConstraint[]) => Promise<T[]>;
  subscribe: (callback: (documents: T[]) => void, constraints?: QueryConstraint[]) => Unsubscribe;
  subscribeToDocument: (id: string, callback: (document: T | null) => void) => Unsubscribe;
}

// Query builder for complex queries
export class FirestoreQueryBuilder {
  private constraints: QueryConstraint[] = [];
  private _limitValue?: number;
  private _orderBy?: { field: string; direction: OrderByDirection };

  where(field: string, operator: WhereFilterOp, value: any): this {
    this.constraints.push(where(field, operator, value));
    return this;
  }

  orderBy(field: string, direction: OrderByDirection = 'asc'): this {
    this._orderBy = { field, direction };
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  limit(value: number): this {
    this._limitValue = value;
    this.constraints.push(limit(value));
    return this;
  }

  startAfter(snapshot: DocumentSnapshot): this {
    this.constraints.push(startAfter(snapshot));
    return this;
  }

  build(): QueryConstraint[] {
    return [...this.constraints];
  }

  getConstraints(): QueryConstraint[] {
    return this.constraints;
  }
}

// Enhanced error handling
export class FirestoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public collection?: string,
    public documentId?: string
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

function createFirestoreError(error: any, operation: string, collection?: string, documentId?: string): FirestoreError {
  const code = error?.code || 'unknown';
  const message = error?.message || 'An unknown Firestore error occurred';

  let userMessage = message;
  switch (code) {
    case 'permission-denied':
      userMessage = 'You do not have permission to perform this action.';
      break;
    case 'not-found':
      userMessage = 'The requested document was not found.';
      break;
    case 'already-exists':
      userMessage = 'This document already exists.';
      break;
    case 'failed-precondition':
      userMessage = 'The operation failed due to a precondition check.';
      break;
    case 'resource-exhausted':
      userMessage = 'Quota exceeded. Please try again later.';
      break;
    case 'cancelled':
      userMessage = 'The operation was cancelled.';
      break;
    case 'deadline-exceeded':
      userMessage = 'The operation timed out. Please try again.';
      break;
    case 'unavailable':
      userMessage = 'Service is currently unavailable. Please check your connection.';
      break;
  }

  return new FirestoreError(userMessage, code, operation, collection, documentId);
}

// Connection state monitoring
export interface FirestoreConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastActivity: number | null;
  pendingOperations: number;
}

let connectionState: FirestoreConnectionState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isConnected: false,
  lastActivity: null,
  pendingOperations: 0,
};

const connectionListeners = new Set<(state: FirestoreConnectionState) => void>();

export function addFirestoreConnectionListener(callback: (state: FirestoreConnectionState) => void): () => void {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

function notifyConnectionListeners(): void {
  connectionListeners.forEach(callback => callback({ ...connectionState }));
}

function updateConnectionState(updates: Partial<FirestoreConnectionState>): void {
  connectionState = { ...connectionState, ...updates };
  notifyConnectionListeners();
}

// Enhanced collection wrapper
export function createFirestoreCollection<T extends FirestoreDocument>(
  collectionName: string,
  db?: Firestore
): FirestoreCollection<T> {
  const firestore = db || getDb();
  if (!firestore) {
    throw new FirestoreError('Firestore is not available', 'unavailable', 'initialize', collectionName);
  }

  const collectionRef = collection(firestore, collectionName);

  return {
    async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const now = Timestamp.now();
        const docData = {
          ...data,
          createdAt: now,
          updatedAt: now,
        } as WithFieldValue<DocumentData>;

        const docRef = await addDoc(collectionRef, docData);

        const result: T = {
          ...data,
          _id: docRef.id,
          createdAt: now,
          updatedAt: now,
        } as T;

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });

        return result;
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'create', collectionName);
      }
    },

    async createWithId(id: string, data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const now = Timestamp.now();
        const docData = {
          ...data,
          createdAt: now,
          updatedAt: now,
        } as WithFieldValue<DocumentData>;

        const docRef = doc(collectionRef, id);
        await setDoc(docRef, docData);

        const result: T = {
          ...data,
          _id: id,
          createdAt: now,
          updatedAt: now,
        } as T;

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });

        return result;
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'createWithId', collectionName, id);
      }
    },

    async get(id: string): Promise<T | null> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });

        if (!docSnap.exists()) {
          return null;
        }

        const data = docSnap.data();
        return {
          ...data,
          _id: docSnap.id,
        } as T;
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'get', collectionName, id);
      }
    },

    async getAll(): Promise<T[]> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const querySnapshot = await getDocs(collectionRef);
        const results: T[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            ...data,
            _id: doc.id,
          } as T);
        });

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });

        return results;
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'getAll', collectionName);
      }
    },

    async update(id: string, data: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const docRef = doc(collectionRef, id);
        const updateData: UpdateData<DocumentData> = {
          ...data,
          updatedAt: Timestamp.now(),
        };

        await updateDoc(docRef, updateData);

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'update', collectionName, id);
      }
    },

    async delete(id: string): Promise<void> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const docRef = doc(collectionRef, id);
        await deleteDoc(docRef);

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'delete', collectionName, id);
      }
    },

    async query(constraints: QueryConstraint[]): Promise<T[]> {
      try {
        updateConnectionState({ pendingOperations: connectionState.pendingOperations + 1 });

        const q = query(collectionRef, ...constraints);
        const querySnapshot = await getDocs(q);
        const results: T[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            ...data,
            _id: doc.id,
          } as T);
        });

        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1),
          lastActivity: Date.now()
        });

        return results;
      } catch (error) {
        updateConnectionState({
          pendingOperations: Math.max(0, connectionState.pendingOperations - 1)
        });
        throw createFirestoreError(error, 'query', collectionName);
      }
    },

    subscribe(callback: (documents: T[]) => void, constraints: QueryConstraint[] = []): Unsubscribe {
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

      return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
        const documents: T[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          documents.push({
            ...data,
            _id: doc.id,
          } as T);
        });

        updateConnectionState({
          isConnected: true,
          lastActivity: Date.now()
        });

        callback(documents);
      }, (error) => {
        console.error(`Firestore subscription error for ${collectionName}:`, error);
        updateConnectionState({ isConnected: false });
      });
    },

    subscribeToDocument(id: string, callback: (document: T | null) => void): Unsubscribe {
      const docRef = doc(collectionRef, id);

      return onSnapshot(docRef, (docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const document: T = {
            ...data,
            _id: docSnapshot.id,
          } as T;
          callback(document);
        } else {
          callback(null);
        }

        updateConnectionState({
          isConnected: true,
          lastActivity: Date.now()
        });
      }, (error) => {
        console.error(`Firestore document subscription error for ${collectionName}/${id}:`, error);
        updateConnectionState({ isConnected: false });
        callback(null);
      });
    },
  };
}

// Utility functions
export function createQueryBuilder(): FirestoreQueryBuilder {
  return new FirestoreQueryBuilder();
}

export function getFirestoreConnectionState(): FirestoreConnectionState {
  return { ...connectionState };
}

// Batch operations
export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}

export async function executeBatch(operations: BatchOperation[]): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new FirestoreError('Firestore is not available', 'unavailable', 'batch');
  }

  try {
    updateConnectionState({ pendingOperations: connectionState.pendingOperations + operations.length });

    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    const now = Timestamp.now();

    for (const operation of operations) {
      const collectionRef = collection(db, operation.collection);

      switch (operation.type) {
        case 'create':
          const newDocRef = doc(collectionRef);
          batch.set(newDocRef, {
            ...operation.data,
            createdAt: now,
            updatedAt: now,
          });
          break;
        case 'update':
          if (!operation.id) throw new Error('Document ID required for update operation');
          const updateDocRef = doc(collectionRef, operation.id);
          batch.update(updateDocRef, {
            ...operation.data,
            updatedAt: now,
          });
          break;
        case 'delete':
          if (!operation.id) throw new Error('Document ID required for delete operation');
          const deleteDocRef = doc(collectionRef, operation.id);
          batch.delete(deleteDocRef);
          break;
      }
    }

    await batch.commit();

    updateConnectionState({
      pendingOperations: Math.max(0, connectionState.pendingOperations - operations.length),
      lastActivity: Date.now()
    });
  } catch (error) {
    updateConnectionState({
      pendingOperations: Math.max(0, connectionState.pendingOperations - operations.length)
    });
    throw createFirestoreError(error, 'batch');
  }
}

// Initialize connection monitoring
function initializeConnectionMonitoring(): void {
  // Monitor Firebase connection state
  const unsubscribe = addConnectionListener((state) => {
    updateConnectionState({
      isOnline: state.isOnline,
      isConnected: state.isConnected,
    });
  });

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', unsubscribe);
  }
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  initializeConnectionMonitoring();
}

/// <reference types="jest" />

// Mock Chrome APIs
(global as any).chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      getRules: jest.fn(),
      addRules: jest.fn(),
      removeRules: jest.fn(),
      hasListeners: jest.fn()
    },
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
    id: 'test-extension-id'
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: 100000,
      QUOTA_BYTES: 102400,
      QUOTA_BYTES_PER_ITEM: 8192,
      MAX_ITEMS: 512,
      MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
      MAX_WRITE_OPERATIONS_PER_MINUTE: 120
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      QUOTA_BYTES: 5242880,
      getBytesInUse: jest.fn(),
      setAccessLevel: jest.fn(),
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
        getRules: jest.fn(),
        addRules: jest.fn(),
        removeRules: jest.fn(),
        hasListeners: jest.fn()
      }
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
};

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    auth: jest.fn(() => ({
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChanged: jest.fn()
    }))
  }))
}));

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
});

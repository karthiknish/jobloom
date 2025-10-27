describe('Extension Basic Tests', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should have Chrome APIs mocked', () => {
    expect(chrome.runtime.sendMessage).toBeDefined();
    expect(chrome.storage.sync.get).toBeDefined();
    expect(chrome.tabs.query).toBeDefined();
  });

  it('should mock Firebase correctly', () => {
    const firebase = require('firebase/app');
    expect(firebase.initializeApp).toBeDefined();
  });
});

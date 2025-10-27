/**
 * Test script for auth session sharing between extension and web app
 * This can be run in the browser console to test the integration
 */

import { acquireIdToken, cacheAuthToken } from "./authToken";
import { getAuthInstance } from "./firebase";

export class AuthSharingTester {
  private static instance: AuthSharingTester;
  
  private constructor() {}
  
  public static getInstance(): AuthSharingTester {
    if (!AuthSharingTester.instance) {
      AuthSharingTester.instance = new AuthSharingTester();
    }
    return AuthSharingTester.instance;
  }
  
  /**
   * Test 1: Check if extension can acquire token from web app
   */
  public async testTokenAcquisition(): Promise<boolean> {
    console.log("[AuthSharingTester] Testing token acquisition from web app...");
    
    try {
      const token = await acquireIdToken(true, { skipMessageFallback: false });
      
      if (token) {
        console.log("[AuthSharingTester] ✅ Successfully acquired token from web app");
        console.log("[AuthSharingTester] Token length:", token.length);
        return true;
      } else {
        console.log("[AuthSharingTester] ❌ Failed to acquire token from web app");
        return false;
      }
    } catch (error) {
      console.error("[AuthSharingTester] ❌ Error during token acquisition:", error);
      return false;
    }
  }
  
  /**
   * Test 2: Check if Firebase auth instance is properly initialized
   */
  public testFirebaseAuth(): boolean {
    console.log("[AuthSharingTester] Testing Firebase auth initialization...");
    
    try {
      const auth = getAuthInstance();
      
      if (auth) {
        console.log("[AuthSharingTester] ✅ Firebase auth instance initialized");
        console.log("[AuthSharingTester] Current user:", auth.currentUser?.uid || "None");
        return true;
      } else {
        console.log("[AuthSharingTester] ❌ Firebase auth instance not initialized");
        return false;
      }
    } catch (error) {
      console.error("[AuthSharingTester] ❌ Error testing Firebase auth:", error);
      return false;
    }
  }
  
  /**
   * Test 3: Check if web app auth bridge is available
   */
  public testWebAppAuthBridge(): boolean {
    console.log("[AuthSharingTester] Testing web app auth bridge availability...");
    
    if (typeof window !== "undefined") {
      // Check if the global function is available
      if (typeof (window as any).getHireallAuthToken === "function") {
        console.log("[AuthSharingTester] ✅ Web app auth bridge function available");
        return true;
      } else {
        console.log("[AuthSharingTester] ❌ Web app auth bridge function not available");
        return false;
      }
    }
    
    console.log("[AuthSharingTester] ❌ Window object not available");
    return false;
  }
  
  /**
   * Test 4: Test direct communication with web app
   */
  public async testWebAppCommunication(): Promise<boolean> {
    console.log("[AuthSharingTester] Testing direct communication with web app...");
    
    if (typeof window === "undefined") {
      console.log("[AuthSharingTester] ❌ Window not available");
      return false;
    }
    
    try {
      // Send a test message to web app
      window.postMessage({
        type: "HIREDALL_AUTH_TEST",
        timestamp: Date.now(),
        source: "extension_test"
      }, "*");
      
      // Wait for response
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("[AuthSharingTester] ❌ No response from web app within 5 seconds");
          resolve(false);
        }, 5000);
        
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === "HIREDALL_AUTH_TEST_RESPONSE") {
            clearTimeout(timeout);
            window.removeEventListener("message", handleMessage);
            console.log("[AuthSharingTester] ✅ Received response from web app");
            resolve(true);
          }
        };
        
        window.addEventListener("message", handleMessage);
      });
    } catch (error) {
      console.error("[AuthSharingTester] ❌ Error testing web app communication:", error);
      return false;
    }
  }
  
  /**
   * Test 5: Test token caching and retrieval
   */
  public async testTokenCaching(): Promise<boolean> {
    console.log("[AuthSharingTester] Testing token caching...");
    
    try {
      // Create a test token
      const testToken = "test_token_" + Date.now();
      const testUserId = "test_user_" + Date.now();
      
      // Cache the token
      await cacheAuthToken({
        token: testToken,
        userId: testUserId,
        source: "popup" as const
      });
      
      // Try to acquire it (should return cached token)
      const acquiredToken = await acquireIdToken(false, { skipMessageFallback: true });
      
      if (acquiredToken === testToken) {
        console.log("[AuthSharingTester] ✅ Token caching and retrieval working");
        return true;
      } else {
        console.log("[AuthSharingTester] ❌ Token caching failed");
        console.log("[AuthSharingTester] Expected:", testToken);
        console.log("[AuthSharingTester] Got:", acquiredToken);
        return false;
      }
    } catch (error) {
      console.error("[AuthSharingTester] ❌ Error testing token caching:", error);
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  public async runAllTests(): Promise<void> {
    console.log("[AuthSharingTester] 🚀 Starting auth sharing tests...");
    console.log("[AuthSharingTester] ======================================");
    
    const results = {
      firebaseAuth: this.testFirebaseAuth(),
      webAppBridge: this.testWebAppAuthBridge(),
      tokenCaching: await this.testTokenCaching(),
      tokenAcquisition: await this.testTokenAcquisition(),
      webAppCommunication: await this.testWebAppCommunication()
    };
    
    console.log("[AuthSharingTester] ======================================");
    console.log("[AuthSharingTester] 📊 Test Results:");
    console.log("[AuthSharingTester] Firebase Auth:", results.firebaseAuth ? "✅" : "❌");
    console.log("[AuthSharingTester] Web App Bridge:", results.webAppBridge ? "✅" : "❌");
    console.log("[AuthSharingTester] Token Caching:", results.tokenCaching ? "✅" : "❌");
    console.log("[AuthSharingTester] Token Acquisition:", results.tokenAcquisition ? "✅" : "❌");
    console.log("[AuthSharingTester] Web App Communication:", results.webAppCommunication ? "✅" : "❌");
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log("[AuthSharingTester] ======================================");
    console.log(`[AuthSharingTester] 🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log("[AuthSharingTester] 🎉 All tests passed! Auth sharing is working correctly.");
    } else {
      console.log("[AuthSharingTester] ⚠️  Some tests failed. Check the logs above for details.");
    }
  }
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).authSharingTester = AuthSharingTester.getInstance();
  console.log("[AuthSharingTester] Test suite available at window.authSharingTester");
  console.log("[AuthSharingTester] Run window.authSharingTester.runAllTests() to test auth sharing");
}

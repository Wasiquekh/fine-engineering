import CryptoJS from "crypto-js";

class StorageManager {
  private cacheKeys: Record<string, string>;
  private readonly ENCRYPTION_KEY = "fine-engineering-secret-key";

  constructor() {
    this.cacheKeys = {
      userEmail: "userEmail",
      userMobile: "userMobile",
      userSecretKey: "userSecretKey",
      accessToken: "accessToken",
      userId: "userId",
      userName: "userName",
      userPermissions: "userPermissions",
      tempToken: "tempToken",
      tempUserId: "tempUserId",
      totpSetupRequired: "totpSetupRequired",
      workerToken: "workerToken",
      workerData: "workerData",
    };
  }

  // ==================== TOKEN METHODS ====================

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.accessToken);
    }
    return null;
  }

  async saveAccessToken(token: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.accessToken, token);
      return true;
    }
    return false;
  }

  async removeAccessToken(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.accessToken);
    }
  }

  // Worker token methods
  getWorkerToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.workerToken);
    }
    return null;
  }

  async saveWorkerToken(token: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.workerToken, token);
      return true;
    }
    return false;
  }

  async removeWorkerToken(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.workerToken);
    }
  }

  // ==================== USER METHODS ====================

  async saveUserId(userId: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userId, userId);
      return true;
    }
    return false;
  }

  getUserId(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userId);
    }
    return null;
  }

  async removeUserId(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userId);
    }
  }

  async saveUserName(userName: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userName, userName);
      return true;
    }
    return false;
  }

  getUserName(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userName);
    }
    return null;
  }

  async removeUserName(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userName);
    }
  }

  async saveUserEmail(email: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userEmail, email);
      return true;
    }
    return false;
  }

  getUserEmail(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userEmail);
    }
    return null;
  }

  async removeUserEmail(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userEmail);
    }
  }

  async saveUserMobile(mobile: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userMobile, mobile);
      return true;
    }
    return false;
  }

  getUserMobile(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userMobile);
    }
    return null;
  }

  async removeUserMobile(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userMobile);
    }
  }

  async saveUserPermissions(permissions: Array<any>): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        this.cacheKeys.userPermissions,
        JSON.stringify(permissions)
      );
      return true;
    }
    return false;
  }

  getUserPermissions(): Array<any> | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(this.cacheKeys.userPermissions);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async removeUserPermissions(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userPermissions);
    }
  }

  // ==================== WORKER METHODS ====================

  async saveWorkerData(worker: any): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.workerData, JSON.stringify(worker));
      return true;
    }
    return false;
  }
  // Add to StorageManager class
  getUser(): any | null {
    if (typeof window !== "undefined") {
      const userId = this.getUserId();
      const userName = this.getUserName();
      const userEmail = this.getUserEmail();
      const userMobile = this.getUserMobile();
      const permissions = this.getUserPermissions();

      // If we have at least an ID, return a user object
      if (userId) {
        return {
          id: userId,
          name: userName,
          email: userEmail,
          mobile: userMobile,
          permissions: permissions,
          role: {
            name: this.getUserRole?.() || "", // You might need to store role separately
          },
        };
      }
      return null;
    }
    return null;
  }

  // You might also need to add a method to store/retrieve user role
  async saveUserRole(role: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
      return true;
    }
    return false;
  }

  getUserRole(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userRole");
    }
    return null;
  }

  getWorkerData(): any | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(this.cacheKeys.workerData);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async removeWorkerData(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.workerData);
    }
  }

  // ==================== SECRET KEY METHODS ====================

  async saveUserSecretKey(secretKey: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      try {
        const encryptedData = CryptoJS.AES.encrypt(
          secretKey,
          this.ENCRYPTION_KEY
        ).toString();
        localStorage.setItem(this.cacheKeys.userSecretKey, encryptedData);
        return true;
      } catch (error) {
        console.error("Error encrypting secret key:", error);
        return false;
      }
    }
    return false;
  }

  getUserSecretKey(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userSecretKey);
    }
    return null;
  }

  getDecryptedUserSecretKey(): string | null {
    if (typeof window !== "undefined") {
      const encryptedData = this.getUserSecretKey();
      if (encryptedData) {
        try {
          const bytes = CryptoJS.AES.decrypt(
            encryptedData,
            this.ENCRYPTION_KEY
          );
          return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
          console.error("Error decrypting secret key:", error);
          return null;
        }
      }
    }
    return null;
  }

  async removeUserSecretKey(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userSecretKey);
    }
  }

  // ==================== TEMP TOTP METHODS ====================

  async saveTempToken(token: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.tempToken, token);
      return true;
    }
    return false;
  }

  getTempToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.tempToken);
    }
    return null;
  }

  async removeTempToken(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.tempToken);
    }
  }

  async saveTempUserId(userId: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.tempUserId, userId);
      return true;
    }
    return false;
  }

  getTempUserId(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.tempUserId);
    }
    return null;
  }

  async removeTempUserId(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.tempUserId);
    }
  }

  async saveTotpSetupRequired(value: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.totpSetupRequired, value);
      return true;
    }
    return false;
  }

  getTotpSetupRequired(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.totpSetupRequired);
    }
    return null;
  }

  async removeTotpSetupRequired(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.totpSetupRequired);
    }
  }

  // ==================== CLEAR METHODS ====================

  /**
   * Clear all user data (for logout)
   */
  async clearUserData(): Promise<void> {
    if (typeof window !== "undefined") {
      const userKeys = [
        this.cacheKeys.accessToken,
        this.cacheKeys.userId,
        this.cacheKeys.userName,
        this.cacheKeys.userEmail,
        this.cacheKeys.userMobile,
        this.cacheKeys.userPermissions,
        this.cacheKeys.userSecretKey,
        this.cacheKeys.tempToken,
        this.cacheKeys.tempUserId,
        this.cacheKeys.totpSetupRequired,
      ];

      userKeys.forEach((key) => {
        localStorage.removeItem(key);
      });
      console.log("✅ User data cleared");
    }
  }

  /**
   * Clear all worker data
   */
  async clearWorkerData(): Promise<void> {
    if (typeof window !== "undefined") {
      const workerKeys = [
        this.cacheKeys.workerToken,
        this.cacheKeys.workerData,
      ];

      workerKeys.forEach((key) => {
        localStorage.removeItem(key);
      });
      console.log("✅ Worker data cleared");
    }
  }

  /**
   * Clear all data (complete logout)
   */
  async clearAll(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        Object.values(this.cacheKeys).forEach((key) => {
          localStorage.removeItem(key);
        });
        console.log("✅ All storage cleared");
      } catch (error) {
        console.error("❌ Error clearing storage:", error);
      }
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get appropriate token based on URL
   */
  getTokenForRequest(url: string): string | null {
    if (url.includes("/worker/")) {
      return this.getWorkerToken();
    }
    return this.getAccessToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!(token && token !== "null" && token !== "");
  }

  /**
   * Check if worker is authenticated
   */
  isWorkerAuthenticated(): boolean {
    const token = this.getWorkerToken();
    return !!(token && token !== "null" && token !== "");
  }

  /**
   * Check if user is in TOTP setup flow
   */
  isInTotpSetupFlow(): boolean {
    return this.getTotpSetupRequired() === "true" && !!this.getTempToken();
  }

  /**
   * Check if user is in TOTP verification flow
   */
  isInTotpVerificationFlow(): boolean {
    return this.getTotpSetupRequired() === "false" && !!this.getTempToken();
  }

  /**
   * Clear all temporary TOTP data
   */
  async clearTotpTempData(): Promise<void> {
    await this.removeTempToken();
    await this.removeTempUserId();
    await this.removeTotpSetupRequired();
  }

  /**
   * Get all storage data for debugging
   */
  getAllData(): Record<string, string | null> {
    const data: Record<string, string | null> = {};
    Object.values(this.cacheKeys).forEach((key) => {
      if (typeof window !== "undefined") {
        data[key] = localStorage.getItem(key);
      }
    });
    return data;
  }
}

export default StorageManager;

import CryptoJS from "crypto-js";

class StorageManager {
  private cacheKeys: Record<string, string>;

  constructor() {
    this.cacheKeys = {
      userEmail: "userEmail",
      userMobile: "userMobile",
      userSecretKey: "userSecretKey",
      accessToken: "accessToken",
      userId: "userId",
      userName: "userName",
      userPermissions: "userPermissions",
    };
  }

  async saveUserPermissions(permissions: Array<any>): Promise<boolean> {
    if (typeof window !== "undefined") {
      const permissionsString = JSON.stringify(permissions);
      localStorage.setItem(this.cacheKeys.userPermissions, permissionsString);
      return true;
    }
    throw new Error("localStorage is not available");
  }

  getUserPermissions(): Array<any> | null {
    if (typeof window !== "undefined") {
      const permissionsString = localStorage.getItem(this.cacheKeys.userPermissions);
      return permissionsString ? JSON.parse(permissionsString) : null;
    }
    return null;
  }

  async removeUserPermissions(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userPermissions);
    }
  }

  async saveUserName(userName: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userName, userName);
      return true;
    }
    throw new Error("localStorage is not available");
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
    throw new Error("localStorage is not available");
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
    throw new Error("localStorage is not available");
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

  async saveUserId(userId: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.cacheKeys.userId, userId);
      return true;
    }
    throw new Error("localStorage is not available");
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
    throw new Error("localStorage is not available");
  }

  async removeAccessToken(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.accessToken);
    }
  }

  async saveUserSecretKey(secretKey: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      const encryptedData = CryptoJS.AES.encrypt(
        secretKey,
        "secret_key"
      ).toString();
      localStorage.setItem(this.cacheKeys.userSecretKey, encryptedData);
      return true;
    }
    throw new Error("localStorage is not available");
  }

  getUserSecretKey(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.cacheKeys.userSecretKey);
    }
    return null;
  }

  async removeUserSecretKey(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKeys.userSecretKey);
    }
  }

  getDecryptedUserSecretKey(): string {
    if (typeof window !== "undefined") {
      const encryptedData = this.getUserSecretKey();
      if (encryptedData) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, "secret_key");
        return bytes.toString(CryptoJS.enc.Utf8);
      }
    }
    return "";
  }

  async resetAll(): Promise<void> {
    if (typeof window !== "undefined") {
      Object.values(this.cacheKeys).forEach((key) =>
        localStorage.removeItem(key)
      );
    }
  }
}

export default StorageManager;

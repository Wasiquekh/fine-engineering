import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { getToken } from "firebase/app-check";
import { appCheck } from "../app/firebase-config";
import StorageManager from "./StorageManager";

const isServer = typeof window === "undefined";
const defaultBaseURL = "https://fine-engineering-erp-backend.dynsimulation.com/api/v1";

export default class AxiosProvider {
  private instance: AxiosInstance;
  private baseURL: string;
  private storage: StorageManager;
  private isRedirecting: boolean = false;

  // Define endpoints that specifically need form-urlencoded
  private formUrlEncodedEndpoints = [
    '/login',
    '/token',
    '/oauth',
    '/auth/',
    '/worker/login',
    '/worker/verify'
  ];

  constructor(baseURL: string = defaultBaseURL) {
    this.baseURL = isServer
      ? process.env.NEXT_PUBLIC_API_URL || baseURL
      : baseURL;

    this.storage = new StorageManager();
    this.instance = axios.create({
      baseURL: this.baseURL,
    });

    // Add request interceptor
    this.instance.interceptors.request.use(
      this.handleRequest.bind(this),
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.instance.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleError.bind(this)
    );
  }

  private async handleRequest(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    try {
      const url = config.url || '';
      let accessToken: string | null = null;
      
      // Determine token type based on URL
      if (url.includes('/worker/')) {
        accessToken = this.storage.getWorkerToken();
      } else {
        accessToken = this.storage.getAccessToken();
      }
      
      // Set authorization header if token exists and not a login request
      if (accessToken && accessToken !== "null" && accessToken !== "" && 
          !url.includes('/login') && !url.includes('/verify')) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      }

      // Add AppCheck token (optional)
      try {
        const appCheckTokenResponse = await getToken(appCheck, true);
        const appCheckToken = appCheckTokenResponse.token;
        if (appCheckToken) {
          config.headers.set("X-Firebase-AppCheck", appCheckToken);
        }
      } catch (appCheckError) {
        // Ignore app check errors
      }

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 ${config.method?.toUpperCase()} ${url}`, {
          tokenType: url.includes('/worker/') ? 'worker' : 'system',
          hasToken: !!accessToken,
          contentType: config.headers.get('Content-Type'),
          data: config.data
        });
      }

    } catch (error) {
      console.error("Error setting request headers:", error);
    }

    return config;
  }

  private handleResponse(response: AxiosResponse): AxiosResponse {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Response from ${response.config.url}:`, response.status);
    }
    return response;
  }

  private async handleError(error: AxiosError): Promise<never> {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers,
      requestData: error.config?.data
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !isServer && !this.isRedirecting) {
      const url = error.config?.url || '';
      
      console.log("🔐 401 Unauthorized error");
      
      this.isRedirecting = true;
      
      try {
        // Clear appropriate storage based on URL
        if (url.includes('/worker/')) {
          await this.storage.clearWorkerData();
        } else {
          await this.storage.clearUserData();
        }
        
        // Show message and redirect
        if (typeof window !== 'undefined') {
          const message = url.includes('/worker/') 
            ? 'Worker session expired. Please login again.'
            : 'Your session has expired. Please login again.';
          
          sessionStorage.setItem('logoutMessage', message);
          
          // Redirect to appropriate login
          if (url.includes('/worker/')) {
            window.location.href = '/';
          } else {
            window.location.href = '/';
          }
        }
      } catch (redirectError) {
        console.error('Error during redirect:', redirectError);
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  }

  /**
   * POST request with automatic content-type detection
   */
  async post<T = any>(
    url: string,
    data: any,
    config?: InternalAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    // Log the incoming data
    console.log(`🔍 POST to ${url} with data:`, data);
    
    // Ensure we never send null or undefined as the body
    if (data === null || data === undefined) {
      console.warn(`⚠️ Warning: Sending ${data} as request body to ${url}`);
      // Send an empty object instead of null
      data = {};
    }
    
    const { formattedData, contentType } = this.formatData(data, url);
    
    console.log(`📦 Formatted data for ${url}:`, {
      originalData: data,
      formattedData,
      contentType,
      type: typeof formattedData,
      isFormData: formattedData instanceof FormData,
      isURLSearchParams: formattedData instanceof URLSearchParams
    });
    
    const headers = {
      ...config?.headers,
    };

    // Only set Content-Type if not already set and we have a specific one
    if (!headers['Content-Type'] && contentType) {
      headers['Content-Type'] = contentType;
    }

    // Log the final request configuration
    console.log(`🚀 Sending request to ${url}:`, {
      method: 'POST',
      headers,
      data: formattedData,
      dataType: typeof formattedData,
      isFormData: formattedData instanceof FormData,
      isURLSearchParams: formattedData instanceof URLSearchParams
    });

    return this.instance.post<T>(url, formattedData, { ...config, headers });
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * PUT request with automatic content-type detection
   */
  async put<T = any>(
    url: string,
    data: any,
    config?: InternalAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    console.log(`🔍 PUT to ${url} with data:`, data);
    
    if (data === null || data === undefined) {
      console.warn(`⚠️ Warning: Sending ${data} as request body to ${url}`);
      data = {};
    }
    
    const { formattedData, contentType } = this.formatData(data, url);
    
    const headers = {
      ...config?.headers,
    };

    if (!headers['Content-Type'] && contentType) {
      headers['Content-Type'] = contentType;
    }

    return this.instance.put<T>(url, formattedData, { ...config, headers });
  }

  /**
   * PATCH request with automatic content-type detection
   */
  async patch<T = any>(
    url: string,
    data: any,
    config?: InternalAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    console.log(`🔍 PATCH to ${url} with data:`, data);
    
    if (data === null || data === undefined) {
      console.warn(`⚠️ Warning: Sending ${data} as request body to ${url}`);
      data = {};
    }
    
    const { formattedData, contentType } = this.formatData(data, url);
    
    const headers = {
      ...config?.headers,
    };

    if (!headers['Content-Type'] && contentType) {
      headers['Content-Type'] = contentType;
    }

    return this.instance.patch<T>(url, formattedData, { ...config, headers });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * Helper method to check if endpoint should use form-urlencoded
   */
  private shouldUseFormUrlEncoded(url: string): boolean {
    return this.formUrlEncodedEndpoints.some(endpoint => 
      url.includes(endpoint)
    );
  }

  /**
   * Helper method to automatically format data based on content type
   */
  private formatData(data: any, url: string): { formattedData: any; contentType: string } {
    // Handle null/undefined data
    if (data === null || data === undefined) {
      console.warn(`⚠️ formatData received ${data}, converting to empty object`);
      return {
        formattedData: {}, // Send empty object instead of null
        contentType: 'application/json'
      };
    }

    // If data is already FormData, use it as-is
    if (data instanceof FormData) {
      return {
        formattedData: data,
        contentType: 'multipart/form-data'
      };
    }

    // If data is already URLSearchParams, use it as-is
    if (data instanceof URLSearchParams) {
      return {
        formattedData: data,
        contentType: 'application/x-www-form-urlencoded'
      };
    }

    // If data is a string, check if it's valid JSON
    if (typeof data === 'string') {
      try {
        // Try to parse it to see if it's JSON
        JSON.parse(data);
        return {
          formattedData: data,
          contentType: 'application/json'
        };
      } catch {
        // Not JSON, treat as plain text
        return {
          formattedData: data,
          contentType: 'text/plain'
        };
      }
    }

    // Check if this is a file upload
    if (data && typeof data === 'object') {
      const hasFile = Object.values(data).some(value => 
        value instanceof File || 
        value instanceof Blob ||
        (Array.isArray(value) && value.some(v => v instanceof File || v instanceof Blob))
      );

      if (hasFile) {
        // Convert to FormData for file uploads
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(item => {
                if (item instanceof File || item instanceof Blob) {
                  formData.append(key, item);
                } else {
                  formData.append(key, String(item));
                }
              });
            } else if (value instanceof File || value instanceof Blob) {
              formData.append(key, value);
            } else if (typeof value === 'object') {
              // For nested objects, stringify them
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        return {
          formattedData: formData,
          contentType: 'multipart/form-data'
        };
      }
    }

    // Check if this endpoint should use form-urlencoded
    if (this.shouldUseFormUrlEncoded(url)) {
      // Convert to URLSearchParams for form-urlencoded
      const params = new URLSearchParams();
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(item => params.append(key, String(item)));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      return {
        formattedData: params,
        contentType: 'application/x-www-form-urlencoded'
      };
    }

    // Default to JSON for all other cases
    return {
      formattedData: data,
      contentType: 'application/json'
    };
  }

  // Helper methods for token management
  async saveSystemToken(token: string): Promise<void> {
    await this.storage.saveAccessToken(token);
  }

  async saveWorkerToken(token: string): Promise<void> {
    await this.storage.saveWorkerToken(token);
  }

  async clearAllTokens(): Promise<void> {
    await this.storage.clearAll();
  }
}
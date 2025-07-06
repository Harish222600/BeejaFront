import axios from "axios"
import { CORSErrorHandler, showCORSErrorNotification } from '../utils/corsHandler.js';
import { getCurrentConfig, getEnvironmentInfo } from '../config/environment.js';

export const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Accept': 'application/json'
    }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            timestamp: new Date().toISOString()
        });
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for enhanced error handling
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', {
            url: response.config.url,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
        });
        return response;
    },
    (error) => {
        const url = error.config?.url || 'unknown';
        
        // Enhanced error logging
        console.error('❌ API Error:', {
            url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
            environment: getCurrentConfig().environment
        });

        // Handle CORS errors specifically
        if (CORSErrorHandler.isCORSError(error)) {
            console.error('🚫 CORS Error Detected');
            const corsError = CORSErrorHandler.handleCORSError(error, url);
            showCORSErrorNotification();
            
            // Return a structured error response
            return Promise.reject({
                ...error,
                corsError: true,
                userFriendlyMessage: corsError.message,
                details: corsError.details
            });
        }

        // Handle network errors
        if (CORSErrorHandler.isNetworkError(error)) {
            console.error('🌐 Network Error Detected');
            return Promise.reject({
                ...error,
                networkError: true,
                userFriendlyMessage: 'Network connection failed. Please check your internet connection.'
            });
        }

        return Promise.reject(error);
    }
);

export const apiConnector = (method, url, bodyData, headers, params, config = {}) => {
    const envConfig = getCurrentConfig();
    
    // Debug logging with environment info
    console.log('🔧 API Request Setup:', {
        method,
        url,
        environment: envConfig.environment,
        baseURL: envConfig.BASE_URL,
        bodyData: bodyData ? 'Present' : 'None',
        headers: headers ? Object.keys(headers) : 'None',
        params,
        config
    });

    // Determine if we're sending FormData (for file uploads)
    const isFormData = bodyData instanceof FormData;
    
    // Set default headers, but don't override Content-Type for FormData
    const defaultHeaders = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(headers?.Authorization ? { 'Authorization': headers.Authorization } : {})
    };

    // Debug token (safely)
    if (headers?.Authorization) {
        console.log('🔑 Token present:', headers.Authorization.substring(0, 20) + '...');
    }

    // Add timeout based on environment
    const requestConfig = {
        method: `${method}`,
        url: `${url}`,
        data: bodyData !== undefined && bodyData !== null ? bodyData : undefined,
        headers: {
            ...defaultHeaders,
            ...headers
        },
        params: params ? params : null,
        withCredentials: true,
        timeout: envConfig.TIMEOUT,
        ...config  // Spread additional axios config options like responseType
    };

    return axiosInstance(requestConfig);
};

// Enhanced API connector with retry logic
export const apiConnectorWithRetry = async (method, url, bodyData, headers, params, config = {}) => {
    const envConfig = getCurrentConfig();
    let lastError;

    for (let attempt = 1; attempt <= envConfig.RETRY_ATTEMPTS; attempt++) {
        try {
            console.log(`🔄 API Attempt ${attempt}/${envConfig.RETRY_ATTEMPTS}:`, url);
            
            const response = await apiConnector(method, url, bodyData, headers, params, config);
            
            if (attempt > 1) {
                console.log(`✅ API Success on attempt ${attempt}`);
            }
            
            return response;
        } catch (error) {
            lastError = error;
            
            // Don't retry CORS errors or client errors (4xx)
            if (error.corsError || (error.response?.status >= 400 && error.response?.status < 500)) {
                console.log('🚫 Not retrying due to client error or CORS issue');
                throw error;
            }
            
            if (attempt < envConfig.RETRY_ATTEMPTS) {
                const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ All ${envConfig.RETRY_ATTEMPTS} attempts failed`);
    throw lastError;
};

// Utility function to test API connectivity
export const testAPIConnectivity = async () => {
    const envConfig = getCurrentConfig();
    const testUrl = `${envConfig.BASE_URL}/health`;
    
    console.log('🏥 Testing API connectivity:', testUrl);
    
    try {
        const response = await apiConnector('GET', testUrl);
        console.log('✅ API connectivity test passed');
        return { success: true, response };
    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        return { success: false, error };
    }
};

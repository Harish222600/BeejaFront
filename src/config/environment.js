// Environment-based configuration
const getEnvironment = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    const isProduction = hostname.includes('onrender.com') || hostname.includes('netlify.app') || hostname.includes('vercel.app');
    
    return {
        isDevelopment,
        isProduction,
        hostname,
        protocol,
        origin: window.location.origin
    };
};

const environment = getEnvironment();

// API Configuration based on environment
export const API_CONFIG = {
    // Development configuration
    development: {
        BASE_URL: 'http://localhost:4000', // Local backend
        USE_PROXY: true,
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3
    },
    
    // Production configuration
    production: {
        BASE_URL: 'https://beejalms.onrender.com', // Production backend
        USE_PROXY: false,
        TIMEOUT: 15000,
        RETRY_ATTEMPTS: 2
    },
    
    // Staging configuration (if needed)
    staging: {
        BASE_URL: 'https://beejalms-staging.onrender.com',
        USE_PROXY: false,
        TIMEOUT: 12000,
        RETRY_ATTEMPTS: 2
    }
};

// Get current environment configuration
export const getCurrentConfig = () => {
    if (environment.isDevelopment) {
        return { ...API_CONFIG.development, environment: 'development' };
    } else if (environment.isProduction) {
        return { ...API_CONFIG.production, environment: 'production' };
    } else {
        // Default to production for unknown environments
        return { ...API_CONFIG.production, environment: 'unknown' };
    }
};

// Enhanced BASE_URL with environment detection
export const getBaseURL = () => {
    const config = getCurrentConfig();
    
    console.log('🌍 Environment Configuration:', {
        environment: config.environment,
        baseURL: config.BASE_URL,
        currentOrigin: environment.origin,
        useProxy: config.USE_PROXY
    });
    
    return config.BASE_URL;
};

// Environment information for debugging
export const getEnvironmentInfo = () => {
    const config = getCurrentConfig();
    
    return {
        ...environment,
        config,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        buildInfo: {
            nodeEnv: import.meta.env.NODE_ENV,
            mode: import.meta.env.MODE,
            dev: import.meta.env.DEV,
            prod: import.meta.env.PROD
        }
    };
};

// CORS-aware fetch wrapper
export const corsAwareFetch = async (url, options = {}) => {
    const config = getCurrentConfig();
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${config.TIMEOUT}ms`);
        }
        
        throw error;
    }
};

// Health check function
export const performHealthCheck = async () => {
    const config = getCurrentConfig();
    const healthUrl = `${config.BASE_URL}/health`;
    
    console.log('🏥 Performing health check:', healthUrl);
    
    try {
        const response = await corsAwareFetch(healthUrl, {
            method: 'GET'
        });
        
        const result = {
            success: response.ok,
            status: response.status,
            url: healthUrl,
            timestamp: new Date().toISOString()
        };
        
        console.log('Health check result:', result);
        return result;
    } catch (error) {
        console.error('Health check failed:', error);
        return {
            success: false,
            error: error.message,
            url: healthUrl,
            timestamp: new Date().toISOString()
        };
    }
};

export default {
    API_CONFIG,
    getCurrentConfig,
    getBaseURL,
    getEnvironmentInfo,
    corsAwareFetch,
    performHealthCheck
};

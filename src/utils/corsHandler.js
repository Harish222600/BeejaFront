// CORS Error Handler and Fallback Utilities
export class CORSErrorHandler {
    static isCORSError(error) {
        return (
            error.message?.includes('CORS') ||
            error.message?.includes('Access-Control-Allow-Origin') ||
            error.message?.includes('Cross-Origin Request Blocked') ||
            (error.response === undefined && error.request && !error.code)
        );
    }

    static isNetworkError(error) {
        return (
            error.code === 'NETWORK_ERROR' ||
            error.message?.includes('Network Error') ||
            error.message?.includes('ERR_NETWORK') ||
            error.message?.includes('ERR_FAILED')
        );
    }

    static handleCORSError(error, apiUrl) {
        console.error('🚫 CORS Error Detected:', {
            url: apiUrl,
            error: error.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            origin: window.location.origin
        });

        // Log detailed CORS debugging information
        this.logCORSDebugInfo(apiUrl);

        // Return user-friendly error message
        return {
            success: false,
            error: 'CORS_ERROR',
            message: 'Unable to connect to server. This appears to be a server configuration issue.',
            details: {
                issue: 'CORS Policy Violation',
                frontend: window.location.origin,
                backend: new URL(apiUrl).origin,
                solution: 'Backend needs to allow cross-origin requests from frontend domain'
            }
        };
    }

    static logCORSDebugInfo(apiUrl) {
        const backendUrl = new URL(apiUrl).origin;
        const frontendUrl = window.location.origin;

        console.group('🔍 CORS Debug Information');
        console.log('Frontend Origin:', frontendUrl);
        console.log('Backend Origin:', backendUrl);
        console.log('Request URL:', apiUrl);
        console.log('Time:', new Date().toISOString());
        
        console.log('\n📋 Required Backend CORS Configuration:');
        console.log(`Access-Control-Allow-Origin: ${frontendUrl}`);
        console.log('Access-Control-Allow-Credentials: true');
        console.log('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        console.log('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        console.log('\n🛠️ Backend Framework Examples:');
        console.log('Express.js:', `app.use(cors({ origin: '${frontendUrl}', credentials: true }))`);
        console.log('Django:', `CORS_ALLOWED_ORIGINS = ['${frontendUrl}']`);
        console.log('Spring Boot:', `@CrossOrigin(origins = "${frontendUrl}")`);
        
        console.groupEnd();
    }

    static createFallbackResponse(message = 'Service temporarily unavailable') {
        return {
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message,
            data: null,
            fallback: true
        };
    }

    static async testCORSConnection(baseUrl) {
        console.log('🧪 Testing CORS connection to:', baseUrl);
        
        try {
            const response = await fetch(baseUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include'
            });
            
            console.log('✅ CORS test successful:', {
                status: response.status,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            return true;
        } catch (error) {
            console.error('❌ CORS test failed:', error.message);
            this.logCORSDebugInfo(baseUrl);
            return false;
        }
    }
}

// Enhanced error notification for users
export const showCORSErrorNotification = () => {
    // Create a user-friendly notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Connection Issue</div>
        <div>Unable to connect to server. Please try again later or contact support if the issue persists.</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">Error: CORS Policy Violation</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 10000);
};

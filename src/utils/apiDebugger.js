import { getEnvironmentInfo, getCurrentConfig, performHealthCheck } from '../config/environment.js';
import { CORSErrorHandler } from './corsHandler.js';
import { testAPIConnectivity } from '../services/apiConnector.js';

// Comprehensive API debugging utility
export const debugAPIIssues = async () => {
    console.group('🔍 === COMPREHENSIVE API DEBUG INFORMATION ===');
    
    // 1. Environment Information
    console.group('🌍 Environment Information');
    const envInfo = getEnvironmentInfo();
    console.log('Current Environment:', envInfo.config.environment);
    console.log('Frontend Origin:', envInfo.origin);
    console.log('Backend Base URL:', envInfo.config.BASE_URL);
    console.log('Browser Info:', {
        userAgent: envInfo.userAgent,
        hostname: envInfo.hostname,
        protocol: envInfo.protocol
    });
    console.log('Build Info:', envInfo.buildInfo);
    console.groupEnd();
    
    // 2. Authentication State
    console.group('🔐 Authentication State');
    const authState = JSON.parse(localStorage.getItem('persist:auth') || '{}');
    const token = localStorage.getItem('token');
    console.log('Token present:', !!token);
    if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
        console.log('Token length:', token.length);
    }
    console.log('Redux auth state keys:', Object.keys(authState));
    console.groupEnd();
    
    // 3. CORS Connectivity Test
    console.group('🌐 CORS Connectivity Test');
    const config = getCurrentConfig();
    const corsTestResult = await CORSErrorHandler.testCORSConnection(config.BASE_URL);
    console.log('CORS Test Result:', corsTestResult ? '✅ PASSED' : '❌ FAILED');
    console.groupEnd();
    
    // 4. Health Check
    console.group('🏥 Backend Health Check');
    try {
        const healthResult = await performHealthCheck();
        console.log('Health Check:', healthResult.success ? '✅ HEALTHY' : '❌ UNHEALTHY');
        console.log('Health Details:', healthResult);
    } catch (error) {
        console.error('Health check failed:', error);
    }
    console.groupEnd();
    
    // 5. API Connectivity Test
    console.group('🔌 API Connectivity Test');
    try {
        const apiTest = await testAPIConnectivity();
        console.log('API Test:', apiTest.success ? '✅ CONNECTED' : '❌ FAILED');
        if (!apiTest.success) {
            console.error('API Test Error:', apiTest.error);
        }
    } catch (error) {
        console.error('API connectivity test failed:', error);
    }
    console.groupEnd();
    
    // 6. Network Diagnostics
    console.group('🔧 Network Diagnostics');
    console.log('Online Status:', navigator.onLine ? '✅ ONLINE' : '❌ OFFLINE');
    console.log('Connection Type:', navigator.connection?.effectiveType || 'Unknown');
    console.log('Downlink Speed:', navigator.connection?.downlink || 'Unknown');
    console.groupEnd();
    
    // 7. CORS Configuration Recommendations
    console.group('⚙️ CORS Configuration Recommendations');
    console.log('Required Backend CORS Settings:');
    console.log(`Access-Control-Allow-Origin: ${envInfo.origin}`);
    console.log('Access-Control-Allow-Credentials: true');
    console.log('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    console.log('Access-Control-Allow-Headers: Content-Type, Authorization');
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        environment: envInfo,
        corsTest: corsTestResult,
        timestamp: new Date().toISOString()
    };
};

export const testAdminAPI = async (token) => {
    console.group('🧪 === TESTING ADMIN API ===');
    
    if (!token) {
        console.error('❌ No token provided for API test');
        console.groupEnd();
        return { success: false, error: 'No token provided' };
    }
    
    const config = getCurrentConfig();
    const apiUrl = `${config.BASE_URL}/api/v1/admin/users`;
    
    console.log('🎯 Testing API Endpoint:', apiUrl);
    console.log('🔑 Token Preview:', token.substring(0, 20) + '...');
    console.log('🌍 Environment:', config.environment);
    
    try {
        // Test with enhanced fetch
        console.log('📡 Making API request...');
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        });
        
        console.log('📊 Response Details:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        const responseText = await response.text();
        console.log('📄 Response Body Length:', responseText.length);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ API Test Successful');
                console.log('📋 Response Data:', data);
                console.groupEnd();
                return { success: true, data, status: response.status };
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                console.log('Raw Response:', responseText);
                console.groupEnd();
                return { success: false, error: 'Invalid JSON response', rawResponse: responseText };
            }
        } else {
            console.error('❌ API Request Failed');
            console.error('Status:', response.status, response.statusText);
            console.error('Response:', responseText);
            
            // Check if it's a CORS error
            if (response.status === 0 || responseText === '') {
                console.error('🚫 Likely CORS Error - No response received');
                CORSErrorHandler.logCORSDebugInfo(apiUrl);
            }
            
            console.groupEnd();
            return { 
                success: false, 
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                rawResponse: responseText
            };
        }
        
    } catch (error) {
        console.error('❌ API Test Exception:', error);
        
        // Analyze the error type
        if (CORSErrorHandler.isCORSError(error)) {
            console.error('🚫 CORS Error Detected');
            CORSErrorHandler.logCORSDebugInfo(apiUrl);
        } else if (CORSErrorHandler.isNetworkError(error)) {
            console.error('🌐 Network Error Detected');
        }
        
        console.groupEnd();
        return { success: false, error: error.message, type: error.name };
    }
};

// Quick diagnostic function for production issues
export const quickDiagnostic = async () => {
    console.log('🚀 Quick API Diagnostic Starting...');
    
    const results = {
        timestamp: new Date().toISOString(),
        environment: getCurrentConfig().environment,
        tests: {}
    };
    
    // Test 1: Environment check
    results.tests.environment = {
        passed: true,
        details: getEnvironmentInfo()
    };
    
    // Test 2: CORS test
    try {
        const corsResult = await CORSErrorHandler.testCORSConnection(getCurrentConfig().BASE_URL);
        results.tests.cors = {
            passed: corsResult,
            details: corsResult ? 'CORS connection successful' : 'CORS connection failed'
        };
    } catch (error) {
        results.tests.cors = {
            passed: false,
            details: error.message
        };
    }
    
    // Test 3: API connectivity
    try {
        const apiResult = await testAPIConnectivity();
        results.tests.apiConnectivity = {
            passed: apiResult.success,
            details: apiResult.success ? 'API reachable' : apiResult.error?.message || 'API unreachable'
        };
    } catch (error) {
        results.tests.apiConnectivity = {
            passed: false,
            details: error.message
        };
    }
    
    console.log('📊 Quick Diagnostic Results:', results);
    
    // Summary
    const passedTests = Object.values(results.tests).filter(test => test.passed).length;
    const totalTests = Object.keys(results.tests).length;
    
    console.log(`📈 Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests < totalTests) {
        console.log('⚠️ Issues detected. Run debugAPIIssues() for detailed analysis.');
    }
    
    return results;
};

// Auto-run diagnostic on import in development
if (getCurrentConfig().environment === 'development') {
    console.log('🔧 Development mode detected - Auto-running quick diagnostic...');
    setTimeout(() => quickDiagnostic(), 1000);
}

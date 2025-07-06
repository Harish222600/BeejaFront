import React, { useState, useEffect } from 'react';
import { debugAPIIssues, quickDiagnostic, testAdminAPI } from '../../utils/apiDebugger';
import { getEnvironmentInfo } from '../../config/environment';

const DebugPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [envInfo, setEnvInfo] = useState(null);

    useEffect(() => {
        setEnvInfo(getEnvironmentInfo());
    }, []);

    const runQuickDiagnostic = async () => {
        setIsRunning(true);
        try {
            const results = await quickDiagnostic();
            setDiagnosticResults(results);
        } catch (error) {
            console.error('Diagnostic failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const runFullDebug = async () => {
        setIsRunning(true);
        try {
            await debugAPIIssues();
            console.log('✅ Full debug completed - check console for details');
        } catch (error) {
            console.error('Full debug failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const testAPI = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found for API test');
            return;
        }
        
        setIsRunning(true);
        try {
            const result = await testAdminAPI(token);
            console.log('API Test Result:', result);
        } catch (error) {
            console.error('API test failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    // Only show in development or when there are API issues
    const shouldShow = envInfo?.config?.environment === 'development' || 
                      window.location.search.includes('debug=true');

    if (!shouldShow) return null;

    return (
        <>
            {/* Debug Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 10000,
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="API Debug Panel"
            >
                🔧
            </button>

            {/* Debug Panel */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    width: '400px',
                    maxHeight: '500px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    zIndex: 10000,
                    overflow: 'hidden',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#333',
                        color: 'white',
                        padding: '10px 15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>🔍 API Debug Panel</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {/* Environment Info */}
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Environment</h4>
                            <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                                <div>🌍 {envInfo?.config?.environment || 'Unknown'}</div>
                                <div>🔗 {envInfo?.config?.BASE_URL || 'Unknown'}</div>
                                <div>📍 {envInfo?.origin || 'Unknown'}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Actions</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={runQuickDiagnostic}
                                    disabled={isRunning}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                        opacity: isRunning ? 0.6 : 1
                                    }}
                                >
                                    {isRunning ? '⏳ Running...' : '🚀 Quick Diagnostic'}
                                </button>
                                
                                <button
                                    onClick={runFullDebug}
                                    disabled={isRunning}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                        opacity: isRunning ? 0.6 : 1
                                    }}
                                >
                                    {isRunning ? '⏳ Running...' : '🔍 Full Debug (Console)'}
                                </button>
                                
                                <button
                                    onClick={testAPI}
                                    disabled={isRunning}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#ffc107',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                        opacity: isRunning ? 0.6 : 1
                                    }}
                                >
                                    {isRunning ? '⏳ Running...' : '🧪 Test Admin API'}
                                </button>
                            </div>
                        </div>

                        {/* Diagnostic Results */}
                        {diagnosticResults && (
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Last Diagnostic</h4>
                                <div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Environment:</strong> {diagnosticResults.environment}
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>Timestamp:</strong> {new Date(diagnosticResults.timestamp).toLocaleTimeString()}
                                    </div>
                                    <div>
                                        <strong>Tests:</strong>
                                        {Object.entries(diagnosticResults.tests).map(([test, result]) => (
                                            <div key={test} style={{ marginLeft: '10px' }}>
                                                {result.passed ? '✅' : '❌'} {test}: {result.details}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CORS Help */}
                        <div style={{ marginTop: '15px', fontSize: '11px', color: '#666' }}>
                            <strong>CORS Issue?</strong> The backend needs to allow requests from: <br/>
                            <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>
                                {envInfo?.origin}
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DebugPanel;

// Console Protection for Production
// Prevents token leakage and console exploitation

const isProduction = import.meta.env.PROD;

if (isProduction) {
    // Disable console methods in production
    const noop = () => { };

    // Override console methods
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.warn = noop;

    // Keep console.error for critical errors but sanitize output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalError = console.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = (...args: any[]) => {
        // Filter out any objects that might contain tokens
        const sanitized = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return '[Object]';
            }
            return arg;
        });
        originalError(...sanitized);
    };

    // Detect DevTools and warn (optional - can be annoying for legitimate users)
    // Uncomment if you want to detect DevTools usage
    /*
    let devtoolsOpen = false;
    const threshold = 160;
    
    const detectDevTools = () => {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // You could log this to your backend for security monitoring
                // fetch('/api/security/devtools-detected', { method: 'POST' });
            }
        } else {
            devtoolsOpen = false;
        }
    };
    
    setInterval(detectDevTools, 1000);
    */

    // Prevent access to localStorage/sessionStorage via console
    // Note: This doesn't fully prevent access but makes it harder
    Object.defineProperty(window, 'localStorage', {
        configurable: false,
        writable: false,
    });

    Object.defineProperty(window, 'sessionStorage', {
        configurable: false,
        writable: false,
    });
}

// Sanitize any error objects to remove sensitive headers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeError = (error: any) => {
    if (error?.config?.headers) {
        const sanitized = { ...error };
        sanitized.config = { ...error.config };
        sanitized.config.headers = { ...error.config.headers };
        delete sanitized.config.headers.Authorization;
        delete sanitized.config.headers.authorization;
        return sanitized;
    }
    return error;
};

export default {};

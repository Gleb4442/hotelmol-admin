import { Logger } from './logger';

// Client-side Rate Limiting Simulation
// In production, this runs on Redis/Edge Middleware
const RATE_LIMIT_WINDOW_MS = 10000; 
const MAX_REQUESTS = 60; 
let requestCount = 0;
let windowStart = Date.now();

const checkRateLimit = () => {
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
        requestCount = 0;
        windowStart = now;
    }
    requestCount++;
    if (requestCount > MAX_REQUESTS) {
        throw new Error("429: Too Many Requests. Please try again later.");
    }
}

interface ApiCallOptions {
  skipAuth?: boolean;
}

/**
 * Wraps an async operation with:
 * 1. Rate Limiting Check
 * 2. Secure Logging
 * 3. Auth Check (New in Stage 8)
 * 4. Error Normalization
 */
export async function safeApiCall<T>(
    operation: () => Promise<T>, 
    context: string,
    options: ApiCallOptions = {}
): Promise<T> {
    try {
        checkRateLimit();

        // Stage 8: Auth Guard
        // We simulate server-side middleware by checking the token here.
        if (!options.skipAuth) {
          const token = localStorage.getItem('admin_session');
          if (!token) {
             throw new Error("401 Unauthorized: Session invalid or expired.");
          }
        }

        const result = await operation();
        return result;
    } catch (error: any) {
        // Log detailed error SECURELY on server/console
        Logger.error(`API Failed: ${context}`, error);
        
        // Return sanitized error to UI
        const safeMessage = error.message.includes('429') || error.message.includes('401')
            ? error.message 
            : error.message.replace(/https?:\/\/[^ ]+/g, '[URL]'); // Obfuscate URLs in error messages
            
        throw new Error(safeMessage || "An unexpected system error occurred.");
    }
}
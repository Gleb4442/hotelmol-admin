import { CONFIG } from '../constants';
import { safeApiCall } from '../lib/api';

/**
 * PRODUCTION NOTE:
 * This service simulates the behavior of a server-side API route.
 * In a real Next.js application, the @neondatabase/serverless driver MUST
 * run in a Server Component, API Route, or Server Action.
 * 
 * Accessing the database directly from the browser (Client Component) is insecure
 * and exposes connection credentials.
 */
export const testNeonConnection = async (): Promise<{ success: boolean; message: string; latency: number }> => {
  return safeApiCall(async () => {
      const start = performance.now();
      
      // 1. Verify connection string format (Simulated Validation)
      // In prod, this happens on the server where process.env is available
      if (!CONFIG.DATABASE_URL.includes('neon.tech')) {
          throw new Error("Invalid Neon Hostname");
      }
      if (!CONFIG.DATABASE_URL.startsWith('postgres')) {
          throw new Error("Invalid Protocol");
      }

      // 2. Simulate connection latency to AWS EU-Central-1
      await new Promise(resolve => setTimeout(resolve, 1200));

      const end = performance.now();
      return { 
        success: true, 
        message: "Connection pool active (Authorized)", 
        latency: Math.round(end - start) 
      };
  }, 'testNeonConnection');
};
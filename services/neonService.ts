import { sql } from '../lib/db';
import { safeApiCall } from '../lib/api';

/**
 * Executes a real connection test against Neon DB.
 * Uses the HTTP-based driver safely from the browser (assuming limited credentials).
 */
export const testNeonConnection = async (): Promise<{ success: boolean; message: string; latency: number }> => {
  return safeApiCall(async () => {
    const start = performance.now();

    // Real database query
    await sql`SELECT 1`;

    const end = performance.now();
    return {
      success: true,
      message: "Connected to Neon (Read-Only)",
      latency: Math.round(end - start)
    };
  }, 'testNeonConnection');
};
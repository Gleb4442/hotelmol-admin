import { neon } from '@neondatabase/serverless';
import { CONFIG } from '../constants';

/**
 * CLIENT-SIDE DB CONNECTION
 * 
 * In this VITE SPA architecture, we are connecting directly to Neon from the browser.
 * This utilizes the HTTP-based driver which is firewall-friendly.
 * 
 * Note: Ensure your Neon Database credentials in VITE_DATABASE_URL have
 * restricted permissions (e.g., only access specific tables) if possible.
 */

if (!CONFIG.DATABASE_URL) {
  console.error('CRITICAL: VITE_DATABASE_URL is not defined in .env file.');
}

// Initialize the SQL client
// We use the config from constants which reads from import.meta.env
export const sql = neon(CONFIG.DATABASE_URL);

/*
  Usage:
  const result = await sql`SELECT * FROM my_table`;
*/
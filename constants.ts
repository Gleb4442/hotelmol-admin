import { BlogPost, ContactSubmission, DemoRequest, RoiCalculation, CookieConsent, Service, ChatLog } from "./types/database";
import { Post } from "./types";

/**
 * PRODUCTION CONFIGURATION
 * Now reading from import.meta.env (Vite Environment Variables).
 * 
 * Create a .env file in the root directory with:
 * VITE_DATABASE_URL=postgresql://...
 * VITE_N8N_WEBHOOK_URL=https://...
 * VITE_N8N_WEBHOOK_SECRET=...
 * VITE_ADMIN_USER=admin
 * VITE_ADMIN_PASSWORD=...
 */

const getEnv = (key: string, required = false): string => {
  // @ts-ignore - Vite specific
  const val = import.meta.env[key];
  if (required && !val) {
    console.warn(`Missing Environment Variable: ${key}. App may not function correctly in production.`);
    return '';
  }
  return val ? String(val) : '';
};

export const CONFIG = {
  // @ts-ignore
  DATABASE_URL: getEnv('VITE_DATABASE_URL', true),
  // @ts-ignore
  N8N_BLOG_OPS_URL: getEnv('VITE_N8N_BLOG_OPS_URL') || 'https://n8n.myn8napp.online/webhook/blog-operations',
  // @ts-ignore
  N8N_BLOG_GET_URL: getEnv('VITE_N8N_BLOG_GET_URL') || 'https://n8n.myn8napp.online/webhook/get-blog-data',
  // @ts-ignore
  N8N_DELETE_ITEM_URL: getEnv('VITE_N8N_DELETE_ITEM_URL') || 'https://n8n.myn8napp.online/webhook/delete-item',

  // @ts-ignore
  N8N_CHAT_URL: getEnv('VITE_N8N_CHAT_URL') || 'https://n8n.myn8napp.online/webhook/chat',
  // @ts-ignore
  N8N_CHAT_HISTORY_URL: getEnv('VITE_N8N_CHAT_HISTORY_URL') || 'https://n8n.myn8napp.online/webhook/chat-history',
  // @ts-ignore
  N8N_INGEST_URL: getEnv('VITE_N8N_INGEST_URL') || 'https://n8n.myn8napp.online/webhook/ingest-knowledge',
  // @ts-ignore
  N8N_SERVICES_URL: getEnv('VITE_N8N_SERVICES_URL') || 'https://n8n.myn8napp.online/webhook/services', // For Knowledge Base CRUD


  // @ts-ignore
  N8N_CONTACT_URL: getEnv('VITE_N8N_CONTACT_URL') || 'https://n8n.myn8napp.online/webhook/contact', // Reference
  // @ts-ignore
  N8N_COOKIE_URL: getEnv('VITE_N8N_COOKIE_URL') || 'https://n8n.myn8napp.online/webhook/cookie-consent', // Reference

  // @ts-ignore
  N8N_WEBHOOK_SECRET: getEnv('VITE_N8N_WEBHOOK_SECRET') || 'adminblogwedhooksecret556',

  // @ts-ignore
  N8N_WEBHOOK_SECRET: getEnv('VITE_N8N_WEBHOOK_SECRET') || 'adminblogwedhooksecret556',
  // @ts-ignore
  ADMIN_USER: getEnv('VITE_ADMIN_USER') || 'admin',
  // @ts-ignore
  ADMIN_PASSWORD: getEnv('VITE_ADMIN_PASSWORD') || 'hotelmol_secure_2024',
};

// Fallback Mock Data is kept ONLY for components that fail to fetch real data
// or during the transition period if tables don't exist yet.

// Helper to generate a date relative to today (daysAgo)
const getDate = (daysAgo: number, hoursAgo: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const MOCK_DEMO_REQUESTS: DemoRequest[] = [
  { id: 1, name: 'Example User', email: 'user@example.com', hotel_name: 'Demo Hotel', data_processing_consent: true, marketing_consent: true, created_at: getDate(0, 1), updated_at: getDate(0, 1) },
];

export const MOCK_CONTACTS: ContactSubmission[] = [
  { id: 1, name: 'Contact Lead', email: 'contact@example.com', phone: '123456', position: 'Manager', hotel_name: 'Test Hotel', message: 'Hello', data_processing_consent: true, marketing_consent: true, created_at: getDate(0, 5), updated_at: getDate(0, 5) },
];

export const MOCK_ROI_CALCULATIONS: RoiCalculation[] = [];
export const MOCK_COOKIE_CONSENTS: CookieConsent[] = [];
export const MOCK_INITIAL_POSTS: Post[] = [];
export const MOCK_BLOG_POSTS_FULL: BlogPost[] = [];
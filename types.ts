import { CookieConsent } from "./types/database";

export interface ConnectionStatus {
  service: 'Neon Database' | 'N8N Webhook';
  status: 'pending' | 'connected' | 'error';
  message?: string;
  latency?: number;
}

export interface Post {
  id: number;
  title: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
  date: string;
}

export enum NavItem {
  DASHBOARD = 'dashboard',
  SCHEMA = 'schema', 
  POSTS = 'posts',
  COMPLIANCE = 'compliance', // Stage 5
  SETTINGS = 'settings',
}

// Stage 3: Dashboard Types
export interface UnifiedLead {
  id: number;
  source: 'demo' | 'contact' | 'roi';
  name: string;
  detail: string;
  created_at: string;
  is_new?: boolean;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  blogPostsCount: number;
  cookieConsentsCount: number;
}

export interface DailyLeadCount {
  date: string; // YYYY-MM-DD
  count: number;
}

// Stage 5: Cookie API Types
export interface CookieConsentParams {
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CookieConsentResponse {
  items: CookieConsent[];
  total: number;
}
export interface DemoRequest {
  id: number;
  name: string;
  email: string;
  hotel_name: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  hotel_name: string;
  message: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoiCalculation {
  id: number;
  name: string;
  phone: string;
  hotel_size: number;
  calculated_roi: number;
  monthly_savings: number;
  annual_revenue: number;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CookieConsent {
  id: number;
  user_id: string;
  consent_status: 'granted' | 'denied' | 'partial';
  consent_categories: Record<string, boolean>; // JSONB
  user_agent: string;
  timestamp: string;
  page_url: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  author_id: number;
  status: 'published' | 'draft' | 'archived';
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  featured_image?: string;
  category: string;
  tags: string[]; // JSONB
  created_at: string;
  updated_at: string;
}

export type TableName = 'demo_requests' | 'contact_submissions' | 'roi_calculations' | 'cookie_consents' | 'blog_posts';
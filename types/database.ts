export interface DemoRequest {
  id: number;
  name: string;
  email: string;
  hotel_name: string;
  form_type: string;
  submitted_at: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactForm {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  hotel_name: string;
  subject: string;
  message: string;
  company?: string;
  integration_type?: string;
  responded_at?: string;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoiCalculation {
  id: number;
  name: string;
  email: string;
  phone: string;
  hotel_size: number;
  current_revenue: number;
  calculated_roi: number;
  monthly_savings: number;
  annual_revenue: number;
  submitted_at: string;
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

export interface Author {
  id: number;
  name: string;
  email: string;              // Required per N8N spec
  bio: string | null;
  avatar_url: string | null;  // Renamed from photo_url per spec
  posts_count?: number;       // Computed when joined
  created_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;           // Added per spec
  featured_image_url?: string | null;  // Renamed per spec
  category?: string;          // Blog category/tag
  author_id: number;
  author?: Author;            // For JOIN
  status: 'draft' | 'published' | 'archived';
  views_count?: number;       // Added per spec
  likes_count?: number;       // Added per spec
  created_at: string;
  updated_at: string;
}

export type TableName = 'demo_requests' | 'contact_forms' | 'roi_calculations' | 'cookie_consents' | 'blog_posts' | 'services' | 'chat_logs' | 'knowledge_base' | 'authors';

export interface Service {
  id: number;
  title: string;
  price: string;
  description: string;
  active: boolean;
  updated_at: string;
}

export interface ChatLog {
  id: number;
  session_id: string;
  user_message: string;
  ai_response: string;
  token_usage?: number;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  status?: string;
  error_message?: string;
  created_at: string;
}

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  category?: string;
  content?: string; // Assuming 'description' holds content or is embedded
  description?: string; // Keeping description as per 'Service' but typically KB has 'content'
  embedding?: number[];
  created_at: string;
}

export interface FullLeadData {
  id: number;
  source: 'demo' | 'contact' | 'roi';
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  hotel_size: number | null;
  message: string | null;
  detail: string;
  integration_type: string | null;
  calculated_roi: number | null;
  responded_at: string | null;
  created_at: string;
  is_new?: boolean;
  position?: string | null;
  form_type?: string | null;
  current_revenue?: number | null;
  monthly_savings?: number | null;
  annual_revenue?: number | null;
  data_processing_consent?: boolean;
  marketing_consent?: boolean;
}

export interface LeadFilters {
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  source?: 'all' | 'demo' | 'contact' | 'roi';
  searchTerm?: string;
  sortDir?: 'asc' | 'desc';
  showResponded?: boolean;
}

export interface LeadsResponse {
  items: FullLeadData[];
  total: number;
  page: number;
  pageSize: number;
}
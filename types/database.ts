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

export interface ContactForm {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  hotel_name: string;
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

export interface Author {
  id: number;
  name: string;
  photo_url: string;
  bio: string;
  location: string;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  image_url?: string;
  // Контент (украинский - основной)
  title: string;
  slug: string;
  content: string;
  // Переводы контента
  title_ru?: string;
  content_ru?: string;
  title_en?: string;
  content_en?: string;
  title_pl?: string;
  content_pl?: string;
  // SEO метаданные
  seo_title?: string; // UA (основной)
  seo_description?: string; // UA (основной)
  seo_title_ru?: string;
  seo_description_ru?: string;
  seo_title_en?: string;
  seo_description_en?: string;
  seo_title_pl?: string;
  seo_description_pl?: string;
  // Остальные поля (не менять)
  author_id?: number | null; // Made optional/nullable to handle legacy or "Editorial" fallback
  status: 'published' | 'draft' | 'archived';
  published_at?: string;
  featured_image?: string;
  category: string;
  tags: string[]; // JSONB
  created_at: string;
  updated_at: string;
}

export type TableName = 'demo_requests' | 'contact_forms' | 'roi_calculations' | 'cookie_consents' | 'blog_posts' | 'services' | 'chat_logs' | 'knowledge_base';

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
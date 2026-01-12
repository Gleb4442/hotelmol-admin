import { DashboardStats, DailyLeadCount, UnifiedLead } from '../types';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

// Helper for real stats
const isRecent = (dateString: string, hours: number = 24) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < (hours * 60 * 60 * 1000);
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return safeApiCall(async () => {
    try {
      // Parallelize queries for performance
      // Note: demo_requests and roi_calculations use submitted_at, contact_forms uses created_at
      const [leadsCount, blogCount, cookieCount] = await Promise.all([
        // Combine counts from 3 tables: demo_requests, contact_forms, roi_calculations
        sql`
          SELECT
            (SELECT COUNT(*) FROM demo_requests) +
            (SELECT COUNT(*) FROM contact_forms) +
            (SELECT COUNT(*) FROM roi_calculations) as total_leads,

            (SELECT COUNT(*) FROM demo_requests WHERE submitted_at > NOW() - INTERVAL '24 hours') +
            (SELECT COUNT(*) FROM contact_forms WHERE created_at > NOW() - INTERVAL '24 hours') +
            (SELECT COUNT(*) FROM roi_calculations WHERE submitted_at > NOW() - INTERVAL '24 hours') as new_leads
        `,
        sql`SELECT COUNT(*) FROM blog_posts WHERE status = 'published'`,
        sql`SELECT COUNT(*) FROM cookie_consents`
      ]);

      return {
        totalLeads: Number(leadsCount[0].total_leads),
        newLeads: Number(leadsCount[0].new_leads),
        blogPostsCount: Number(blogCount[0].count),
        cookieConsentsCount: Number(cookieCount[0].count)
      };

    } catch (e) {
      console.warn("DB Stats failed, falling back to mock (ensure tables exist)", e);
      return { totalLeads: 0, newLeads: 0, blogPostsCount: 0, cookieConsentsCount: 0 };
    }
  }, 'fetchDashboardStats');
};

export const fetchLeadsByDay = async (): Promise<DailyLeadCount[]> => {
  return safeApiCall(async () => {
    try {
      // Aggregate leads from all 3 tables by day
      const result = await sql`
        SELECT date, SUM(count) as count FROM (
          SELECT to_char(submitted_at, 'YYYY-MM-DD') as date, COUNT(*) as count
          FROM demo_requests
          WHERE submitted_at > NOW() - INTERVAL '30 days'
          GROUP BY date
          UNION ALL
          SELECT to_char(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
          FROM contact_forms
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY date
          UNION ALL
          SELECT to_char(submitted_at, 'YYYY-MM-DD') as date, COUNT(*) as count
          FROM roi_calculations
          WHERE submitted_at > NOW() - INTERVAL '30 days'
          GROUP BY date
        ) combined
        GROUP BY date
        ORDER BY date ASC
      `;

      return result.map((r: any) => ({ date: r.date, count: Number(r.count) }));
    } catch (e) {
      console.warn("DB LeadsByDay failed", e);
      return [];
    }
  }, 'fetchLeadsByDay');
};

export const fetchLatestLeads = async (): Promise<UnifiedLead[]> => {
  return safeApiCall(async () => {
    try {
      // Union Query to get latest activity
      // Using actual column names from real DB schema:
      // - demo_requests: id, name, email, form_type, submitted_at
      // - contact_forms: id, name, email, company, subject, message, integration_type, created_at
      // - roi_calculations: id, name, email, current_revenue, submitted_at
      const result = await sql`
        (SELECT id, 'demo' as source, name, form_type as detail, NULL as company, NULL as integration_type, submitted_at as created_at FROM demo_requests)
        UNION ALL
        (SELECT id, 'contact' as source, name, subject as detail, company, integration_type, created_at FROM contact_forms)
        UNION ALL
        (SELECT id, 'roi' as source, name, 'ROI: ' || current_revenue::text as detail, NULL as company, NULL as integration_type, submitted_at as created_at FROM roi_calculations)
        ORDER BY created_at DESC
        LIMIT 5
      `;

      return result.map((r: any) => ({
        id: r.id,
        source: r.source,
        name: r.name || 'Anonymous',
        detail: r.detail?.substring(0, 40) || '',
        company: r.company,
        integration_type: r.integration_type,
        created_at: r.created_at,
        is_new: isRecent(r.created_at)
      }));
    } catch (e) {
      console.warn("DB Latest Leads failed", e);
      return [];
    }
  }, 'fetchLatestLeads');
};

export const fetchNewLeadsCount = async (): Promise<{ newLeads: number }> => {
  const stats = await fetchDashboardStats();
  return { newLeads: stats.newLeads };
};
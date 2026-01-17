import { FullLeadData, LeadFilters, LeadsResponse } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

const isRecent = (dateString: string, hours: number = 24) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < (hours * 60 * 60 * 1000);
};

// Helper to safely extract field from any object
const safeGet = (obj: any, field: string, defaultValue: any = null) => {
  return obj && obj[field] !== undefined && obj[field] !== null ? obj[field] : defaultValue;
};

export const fetchAllLeads = async (filters?: LeadFilters): Promise<LeadsResponse> => {
  return safeApiCall(async () => {
    const {
      page = 1,
      pageSize = 20,
      dateFrom,
      dateTo,
      source = 'all',
      searchTerm,
      sortDir = 'desc',
      showResponded = true
    } = filters || {};

    const offset = (page - 1) * pageSize;

    try {
      // Fetch data from each table separately to avoid schema mismatches
      const allLeads: FullLeadData[] = [];

      // Fetch Demo Requests
      if (source === 'all' || source === 'demo') {
        try {
          const demoResults = await sql`SELECT * FROM demo_requests ORDER BY created_at DESC`;
          demoResults.forEach((row: any) => {
            const createdAt = safeGet(row, 'submitted_at') || safeGet(row, 'created_at', new Date().toISOString());
            allLeads.push({
              id: safeGet(row, 'id', 0),
              source: 'demo',
              name: safeGet(row, 'name', 'Anonymous'),
              email: safeGet(row, 'email', ''),
              phone: safeGet(row, 'phone'),
              company: safeGet(row, 'hotel_name') || safeGet(row, 'company'),
              hotel_size: null,
              message: safeGet(row, 'message'),
              detail: safeGet(row, 'form_type', ''),
              integration_type: null,
              calculated_roi: null,
              responded_at: null,
              created_at: createdAt,
              is_new: isRecent(createdAt),
              position: safeGet(row, 'position'),
              form_type: safeGet(row, 'form_type'),
              current_revenue: null,
              monthly_savings: null,
              annual_revenue: null,
              data_processing_consent: safeGet(row, 'data_processing_consent', false),
              marketing_consent: safeGet(row, 'marketing_consent', false)
            });
          });
        } catch (e) {
          console.warn('Failed to fetch demo_requests:', e);
        }
      }

      // Fetch Contact Forms
      if (source === 'all' || source === 'contact') {
        try {
          const contactResults = await sql`SELECT * FROM contact_forms ORDER BY created_at DESC`;
          contactResults.forEach((row: any) => {
            const createdAt = safeGet(row, 'created_at', new Date().toISOString());
            const respondedAt = safeGet(row, 'responded_at');

            // Apply responded filter if needed
            if (!showResponded && respondedAt) {
              return; // Skip responded leads if filter is active
            }

            allLeads.push({
              id: safeGet(row, 'id', 0),
              source: 'contact',
              name: safeGet(row, 'name', 'Anonymous'),
              email: safeGet(row, 'email', ''),
              phone: safeGet(row, 'phone'),
              company: safeGet(row, 'company') || safeGet(row, 'hotel_name'),
              hotel_size: null,
              message: safeGet(row, 'message'),
              detail: safeGet(row, 'subject', ''),
              integration_type: safeGet(row, 'integration_type'),
              calculated_roi: null,
              responded_at: respondedAt,
              created_at: createdAt,
              is_new: isRecent(createdAt),
              position: safeGet(row, 'position'),
              form_type: null,
              current_revenue: null,
              monthly_savings: null,
              annual_revenue: null,
              data_processing_consent: safeGet(row, 'data_processing_consent', false),
              marketing_consent: safeGet(row, 'marketing_consent', false)
            });
          });
        } catch (e) {
          console.warn('Failed to fetch contact_forms:', e);
        }
      }

      // Fetch ROI Calculations
      if (source === 'all' || source === 'roi') {
        try {
          const roiResults = await sql`SELECT * FROM roi_calculations ORDER BY created_at DESC`;
          roiResults.forEach((row: any) => {
            const createdAt = safeGet(row, 'submitted_at') || safeGet(row, 'created_at', new Date().toISOString());
            const currentRevenue = safeGet(row, 'current_revenue', 0);

            allLeads.push({
              id: safeGet(row, 'id', 0),
              source: 'roi',
              name: safeGet(row, 'name', 'Anonymous'),
              email: safeGet(row, 'email', ''),
              phone: safeGet(row, 'phone'),
              company: safeGet(row, 'hotel_name') || safeGet(row, 'company'),
              hotel_size: safeGet(row, 'hotel_size') ? Number(safeGet(row, 'hotel_size')) : null,
              message: null,
              detail: `ROI: ${currentRevenue}`,
              integration_type: null,
              calculated_roi: safeGet(row, 'calculated_roi') ? Number(safeGet(row, 'calculated_roi')) : null,
              responded_at: null,
              created_at: createdAt,
              is_new: isRecent(createdAt),
              position: null,
              form_type: null,
              current_revenue: currentRevenue ? Number(currentRevenue) : null,
              monthly_savings: safeGet(row, 'monthly_savings') ? Number(safeGet(row, 'monthly_savings')) : null,
              annual_revenue: safeGet(row, 'annual_revenue') ? Number(safeGet(row, 'annual_revenue')) : null,
              data_processing_consent: safeGet(row, 'data_processing_consent', false),
              marketing_consent: safeGet(row, 'marketing_consent', false)
            });
          });
        } catch (e) {
          console.warn('Failed to fetch roi_calculations:', e);
        }
      }

      // Apply filters
      let filteredLeads = allLeads;

      // Date range filter
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        filteredLeads = filteredLeads.filter(lead => new Date(lead.created_at).getTime() >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo).getTime();
        filteredLeads = filteredLeads.filter(lead => new Date(lead.created_at).getTime() <= toDate);
      }

      // Search filter
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredLeads = filteredLeads.filter(lead =>
          (lead.name && lead.name.toLowerCase().includes(term)) ||
          (lead.email && lead.email.toLowerCase().includes(term)) ||
          (lead.company && lead.company.toLowerCase().includes(term))
        );
      }

      // Sort
      filteredLeads.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
      });

      // Pagination
      const total = filteredLeads.length;
      const paginatedLeads = filteredLeads.slice(offset, offset + pageSize);

      return { items: paginatedLeads, total, page, pageSize };

    } catch (error: any) {
      console.error('Error fetching leads:', error);
      // Return empty result instead of throwing
      return { items: [], total: 0, page, pageSize };
    }
  }, 'fetchAllLeads');
};

export const markLeadAsResponded = async (leadId: number): Promise<void> => {
  return safeApiCall(async () => {
    try {
      await sql`
        UPDATE contact_forms
        SET responded_at = NOW()
        WHERE id = ${leadId}
      `;
    } catch (error) {
      console.error('Error marking lead as responded:', error);
      throw new Error('Failed to mark lead as responded');
    }
  }, 'markLeadAsResponded');
};

export const deleteLead = async (leadId: number, source: 'demo' | 'contact' | 'roi'): Promise<void> => {
  return safeApiCall(async () => {
    try {
      let tableName = '';
      if (source === 'demo') tableName = 'demo_requests';
      else if (source === 'contact') tableName = 'contact_forms';
      else if (source === 'roi') tableName = 'roi_calculations';
      else throw new Error('Invalid lead source');

      await sql`DELETE FROM ${sql(tableName)} WHERE id = ${leadId}`;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw new Error('Failed to delete lead');
    }
  }, 'deleteLead');
};

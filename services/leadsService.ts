import { FullLeadData, LeadFilters, LeadsResponse } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

const isRecent = (dateString: string, hours: number = 24) => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs < (hours * 60 * 60 * 1000);
  } catch {
    return false;
  }
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
      // Fetch ALL data from lead_submissions table
      console.log('Fetching leads from lead_submissions table...');

      const allResults = await sql`SELECT * FROM lead_submissions ORDER BY created_at DESC`;

      console.log(`Fetched ${allResults.length} leads from database`);

      // Map all data to FullLeadData format
      const allLeads: FullLeadData[] = allResults.map((row: any) => {
        // Determine source type from form_type or other indicators
        let sourceType: 'demo' | 'contact' | 'roi' = 'contact'; // default
        const formType = safeGet(row, 'form_type', '').toLowerCase();

        if (formType.includes('demo')) {
          sourceType = 'demo';
        } else if (formType.includes('roi') || safeGet(row, 'calculated_roi')) {
          sourceType = 'roi';
        }

        // Get created_at timestamp
        const createdAt = safeGet(row, 'created_at') ||
                         safeGet(row, 'submitted_at') ||
                         new Date().toISOString();

        return {
          id: safeGet(row, 'id', 0),
          source: sourceType,
          name: safeGet(row, 'name', 'Anonymous'),
          email: safeGet(row, 'email', ''),
          phone: safeGet(row, 'phone') || safeGet(row, 'phone_number'),
          company: safeGet(row, 'company') ||
                   safeGet(row, 'hotel_name') ||
                   safeGet(row, 'business_name'),
          hotel_size: safeGet(row, 'hotel_size') ||
                     safeGet(row, 'property_size') ?
                     Number(safeGet(row, 'hotel_size') || safeGet(row, 'property_size')) : null,
          message: safeGet(row, 'message') || safeGet(row, 'comments'),
          detail: safeGet(row, 'subject') ||
                 safeGet(row, 'form_type') ||
                 safeGet(row, 'lead_type', ''),
          integration_type: safeGet(row, 'integration_type') ||
                           safeGet(row, 'service_type'),
          calculated_roi: safeGet(row, 'calculated_roi') ?
                         Number(safeGet(row, 'calculated_roi')) : null,
          responded_at: safeGet(row, 'responded_at'),
          created_at: createdAt,
          is_new: isRecent(createdAt),
          position: safeGet(row, 'position') || safeGet(row, 'job_title'),
          form_type: safeGet(row, 'form_type') || safeGet(row, 'lead_type'),
          current_revenue: safeGet(row, 'current_revenue') ?
                          Number(safeGet(row, 'current_revenue')) : null,
          monthly_savings: safeGet(row, 'monthly_savings') ?
                          Number(safeGet(row, 'monthly_savings')) : null,
          annual_revenue: safeGet(row, 'annual_revenue') ?
                         Number(safeGet(row, 'annual_revenue')) : null,
          data_processing_consent: safeGet(row, 'data_processing_consent', false),
          marketing_consent: safeGet(row, 'marketing_consent', false)
        };
      });

      console.log(`Mapped ${allLeads.length} leads to FullLeadData format`);

      // Apply filters
      let filteredLeads = allLeads;

      // Source filter
      if (source !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.source === source);
      }

      // Date range filter
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        filteredLeads = filteredLeads.filter(lead => {
          try {
            return new Date(lead.created_at).getTime() >= fromDate;
          } catch {
            return true;
          }
        });
      }
      if (dateTo) {
        const toDate = new Date(dateTo).getTime();
        filteredLeads = filteredLeads.filter(lead => {
          try {
            return new Date(lead.created_at).getTime() <= toDate;
          } catch {
            return true;
          }
        });
      }

      // Responded filter (only for contact forms)
      if (!showResponded) {
        filteredLeads = filteredLeads.filter(lead =>
          lead.source !== 'contact' || !lead.responded_at
        );
      }

      // Search filter
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredLeads = filteredLeads.filter(lead =>
          (lead.name && lead.name.toLowerCase().includes(term)) ||
          (lead.email && lead.email.toLowerCase().includes(term)) ||
          (lead.company && lead.company.toLowerCase().includes(term)) ||
          (lead.phone && lead.phone.toLowerCase().includes(term)) ||
          (lead.message && lead.message.toLowerCase().includes(term))
        );
      }

      // Sort
      filteredLeads.sort((a, b) => {
        try {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
        } catch {
          return 0;
        }
      });

      // Pagination
      const total = filteredLeads.length;
      const paginatedLeads = filteredLeads.slice(offset, offset + pageSize);

      console.log(`Returning ${paginatedLeads.length} leads (page ${page} of ${Math.ceil(total / pageSize)})`);

      return { items: paginatedLeads, total, page, pageSize };

    } catch (error: any) {
      console.error('Error fetching leads from lead_submissions:', error);
      console.error('Error details:', error.message, error.stack);

      // Try to provide helpful error message
      if (error.message?.includes('relation "lead_submissions" does not exist')) {
        console.warn('Table lead_submissions does not exist. Available tables might be: demo_requests, contact_forms, roi_calculations');
      }

      // Return empty result instead of throwing
      return { items: [], total: 0, page, pageSize };
    }
  }, 'fetchAllLeads');
};

export const markLeadAsResponded = async (leadId: number): Promise<void> => {
  return safeApiCall(async () => {
    try {
      // Try to update in lead_submissions first
      const result = await sql`
        UPDATE lead_submissions
        SET responded_at = NOW()
        WHERE id = ${leadId}
      `;

      if (result.count === 0) {
        // Fallback to contact_forms if lead_submissions doesn't have the record
        await sql`
          UPDATE contact_forms
          SET responded_at = NOW()
          WHERE id = ${leadId}
        `;
      }
    } catch (error) {
      console.error('Error marking lead as responded:', error);
      throw new Error('Failed to mark lead as responded');
    }
  }, 'markLeadAsResponded');
};

export const deleteLead = async (leadId: number, source: 'demo' | 'contact' | 'roi'): Promise<void> => {
  return safeApiCall(async () => {
    try {
      // Try to delete from lead_submissions first
      const result = await sql`DELETE FROM lead_submissions WHERE id = ${leadId}`;

      if (result.count === 0) {
        // Fallback to specific tables if needed
        let tableName = '';
        if (source === 'demo') tableName = 'demo_requests';
        else if (source === 'contact') tableName = 'contact_forms';
        else if (source === 'roi') tableName = 'roi_calculations';

        if (tableName) {
          await sql`DELETE FROM ${sql(tableName)} WHERE id = ${leadId}`;
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw new Error('Failed to delete lead');
    }
  }, 'deleteLead');
};

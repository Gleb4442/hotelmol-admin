import { FullLeadData, LeadFilters, LeadsResponse } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

const isRecent = (dateString: string, hours: number = 24) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < (hours * 60 * 60 * 1000);
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

    // Build base query with UNION ALL
    let whereConditions: string[] = [];
    const params: any[] = [];

    // Date filtering
    if (dateFrom) {
      whereConditions.push(`created_at >= '${dateFrom}'`);
    }
    if (dateTo) {
      whereConditions.push(`created_at <= '${dateTo}'`);
    }

    // Search term filtering (apply to name, email, company)
    let searchFilter = '';
    if (searchTerm && searchTerm.trim()) {
      searchFilter = `
        (LOWER(name) LIKE LOWER('%${searchTerm}%')
        OR LOWER(email) LIKE LOWER('%${searchTerm}%')
        OR LOWER(COALESCE(company, '')) LIKE LOWER('%${searchTerm}%'))
      `;
    }

    // Build UNION query based on source filter
    const buildQuery = (table: 'demo' | 'contact' | 'roi', includeTable: boolean) => {
      if (!includeTable) return '';

      let query = '';
      if (table === 'demo') {
        query = `
          SELECT
            id, 'demo' as source, name, email, NULL as phone,
            hotel_name as company, NULL as hotel_size, NULL as message,
            form_type as detail, NULL as integration_type, NULL as calculated_roi,
            NULL as responded_at, submitted_at as created_at,
            NULL as position, form_type, NULL as current_revenue,
            NULL as monthly_savings, NULL as annual_revenue,
            data_processing_consent, marketing_consent
          FROM demo_requests
        `;
      } else if (table === 'contact') {
        query = `
          SELECT
            id, 'contact' as source, name, email, phone,
            company, NULL as hotel_size, message,
            subject as detail, integration_type, NULL as calculated_roi,
            responded_at, created_at,
            position, NULL as form_type, NULL as current_revenue,
            NULL as monthly_savings, NULL as annual_revenue,
            data_processing_consent, marketing_consent
          FROM contact_forms
        `;
      } else if (table === 'roi') {
        query = `
          SELECT
            id, 'roi' as source, name, email, phone,
            NULL as company, hotel_size, NULL as message,
            'ROI: ' || current_revenue::text as detail, NULL as integration_type,
            calculated_roi, NULL as responded_at, submitted_at as created_at,
            NULL as position, NULL as form_type, current_revenue,
            monthly_savings, annual_revenue,
            data_processing_consent, marketing_consent
          FROM roi_calculations
        `;
      }

      // Add WHERE conditions
      const conditions = [...whereConditions];
      if (searchFilter) conditions.push(searchFilter);

      // For contact forms, add responded filter
      if (table === 'contact' && !showResponded) {
        conditions.push('responded_at IS NULL');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      return query;
    };

    // Determine which tables to include based on source filter
    const includeDemo = source === 'all' || source === 'demo';
    const includeContact = source === 'all' || source === 'contact';
    const includeRoi = source === 'all' || source === 'roi';

    const queries = [
      buildQuery('demo', includeDemo),
      buildQuery('contact', includeContact),
      buildQuery('roi', includeRoi)
    ].filter(q => q !== '');

    if (queries.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    const unionQuery = queries.join(' UNION ALL ');

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM (${sql.unsafe(unionQuery)}) as combined
    `;
    const total = Number(countResult[0]?.total || 0);

    // Get paginated results
    const sortOrder = sortDir === 'asc' ? 'ASC' : 'DESC';
    const result = await sql`
      SELECT * FROM (${sql.unsafe(unionQuery)}) as combined
      ORDER BY created_at ${sql.unsafe(sortOrder)}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const items: FullLeadData[] = result.map((r: any) => ({
      id: r.id,
      source: r.source,
      name: r.name || 'Anonymous',
      email: r.email || '',
      phone: r.phone,
      company: r.company,
      hotel_size: r.hotel_size ? Number(r.hotel_size) : null,
      message: r.message,
      detail: r.detail?.substring(0, 100) || '',
      integration_type: r.integration_type,
      calculated_roi: r.calculated_roi ? Number(r.calculated_roi) : null,
      responded_at: r.responded_at,
      created_at: r.created_at,
      is_new: isRecent(r.created_at),
      position: r.position,
      form_type: r.form_type,
      current_revenue: r.current_revenue ? Number(r.current_revenue) : null,
      monthly_savings: r.monthly_savings ? Number(r.monthly_savings) : null,
      annual_revenue: r.annual_revenue ? Number(r.annual_revenue) : null,
      data_processing_consent: r.data_processing_consent,
      marketing_consent: r.marketing_consent
    }));

    return { items, total, page, pageSize };
  }, 'fetchAllLeads');
};

export const markLeadAsResponded = async (leadId: number): Promise<void> => {
  return safeApiCall(async () => {
    await sql`
      UPDATE contact_forms
      SET responded_at = NOW()
      WHERE id = ${leadId}
    `;
  }, 'markLeadAsResponded');
};

export const deleteLead = async (leadId: number, source: 'demo' | 'contact' | 'roi'): Promise<void> => {
  return safeApiCall(async () => {
    let tableName = '';
    if (source === 'demo') tableName = 'demo_requests';
    else if (source === 'contact') tableName = 'contact_forms';
    else if (source === 'roi') tableName = 'roi_calculations';
    else throw new Error('Invalid lead source');

    await sql`DELETE FROM ${sql(tableName)} WHERE id = ${leadId}`;
  }, 'deleteLead');
};

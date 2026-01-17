import React, { useState, useEffect, useCallback } from 'react';
import { FullLeadData, LeadFilters } from '../types/database';
import { fetchAllLeads, markLeadAsResponded, deleteLead } from '../services/leadsService';
import { exportToCSV } from '../lib/utils';
import {
  Loader2, Eye, Check, Trash2, ChevronLeft, ChevronRight,
  Download, Search, ArrowLeft, ArrowUpDown, X, Filter,
  Mail, Phone, Building, Hash, Calendar, MessageSquare,
  TrendingUp, DollarSign, User, Shield
} from 'lucide-react';

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<FullLeadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedLead, setSelectedLead] = useState<FullLeadData | null>(null);

  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    pageSize: 20,
    source: 'all',
    sortDir: 'desc',
    showResponded: true,
    searchTerm: ''
  });

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAllLeads(filters);
      setLeads(response.items);
      setTotal(response.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleViewDetail = (lead: FullLeadData) => {
    setSelectedLead(lead);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedLead(null);
  };

  const handleMarkResponded = async (leadId: number) => {
    try {
      await markLeadAsResponded(leadId);
      await loadLeads();
      if (selectedLead?.id === leadId) {
        const updatedLead = leads.find(l => l.id === leadId);
        if (updatedLead) setSelectedLead({ ...updatedLead, responded_at: new Date().toISOString() });
      }
    } catch (e: any) {
      alert('Failed to mark as responded: ' + e.message);
    }
  };

  const handleDelete = async (leadId: number, source: 'demo' | 'contact' | 'roi') => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteLead(leadId, source);
      await loadLeads();
      if (view === 'detail') {
        handleBackToList();
      }
    } catch (e: any) {
      alert('Failed to delete lead: ' + e.message);
    }
  };

  const handleExport = () => {
    if (leads.length === 0) {
      alert('No leads to export');
      return;
    }

    const exportData = leads.map(lead => ({
      ID: lead.id,
      Source: lead.source.toUpperCase(),
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone || '',
      Company: lead.company || '',
      'Hotel Size': lead.hotel_size || '',
      'Integration Type': lead.integration_type || '',
      Position: lead.position || '',
      'Form Type': lead.form_type || '',
      Message: lead.message || '',
      'Calculated ROI': lead.calculated_roi || '',
      'Current Revenue': lead.current_revenue || '',
      'Monthly Savings': lead.monthly_savings || '',
      'Annual Revenue': lead.annual_revenue || '',
      'Created At': new Date(lead.created_at).toLocaleString(),
      'Responded At': lead.responded_at ? new Date(lead.responded_at).toLocaleString() : ''
    }));

    exportToCSV(exportData, `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 20,
      source: 'all',
      sortDir: 'desc',
      showResponded: true,
      searchTerm: ''
    });
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  const getSourceBadge = (source: string) => {
    const badges = {
      demo: { text: 'DEMO', class: 'bg-blue-50 text-blue-700 border-blue-200' },
      contact: { text: 'CONTACT', class: 'bg-green-50 text-green-700 border-green-200' },
      roi: { text: 'ROI', class: 'bg-purple-50 text-purple-700 border-purple-200' }
    };
    const badge = badges[source as keyof typeof badges] || badges.contact;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (view === 'detail' && selectedLead) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Leads
          </button>
          <div className="flex gap-2">
            {!selectedLead.responded_at && selectedLead.source === 'contact' && (
              <button
                onClick={() => handleMarkResponded(selectedLead.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check size={16} />
                Mark as Responded
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedLead.id, selectedLead.source)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            {getSourceBadge(selectedLead.source)}
            {selectedLead.is_new && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                NEW
              </span>
            )}
            {selectedLead.responded_at && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                Responded
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedLead.name}</h2>

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-gray-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="text-gray-900 font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail size={14} /> Email
                  </label>
                  <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline font-medium">
                    {selectedLead.email}
                  </a>
                </div>
                {selectedLead.phone && (
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone size={14} /> Phone
                    </label>
                    <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline font-medium">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}
                {selectedLead.position && (
                  <div>
                    <label className="text-sm text-gray-600">Position</label>
                    <p className="text-gray-900 font-medium">{selectedLead.position}</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={20} className="text-gray-600" />
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                {selectedLead.company && (
                  <div>
                    <label className="text-sm text-gray-600">Company/Hotel</label>
                    <p className="text-gray-900 font-medium">{selectedLead.company}</p>
                  </div>
                )}
                {selectedLead.hotel_size !== null && (
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      <Hash size={14} /> Hotel Size
                    </label>
                    <p className="text-gray-900 font-medium">{selectedLead.hotel_size} rooms</p>
                  </div>
                )}
                {selectedLead.integration_type && (
                  <div>
                    <label className="text-sm text-gray-600">Integration Type</label>
                    <p className="text-gray-900 font-medium">{selectedLead.integration_type}</p>
                  </div>
                )}
              </div>
            </section>

            {selectedLead.source === 'contact' && selectedLead.message && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-gray-600" />
                  Message
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedLead.message}</p>
                </div>
              </section>
            )}

            {selectedLead.source === 'demo' && selectedLead.form_type && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Request Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className="text-sm text-gray-600">Form Type</label>
                    <p className="text-gray-900 font-medium">{selectedLead.form_type}</p>
                  </div>
                </div>
              </section>
            )}

            {selectedLead.source === 'roi' && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-gray-600" />
                  ROI Calculation Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  {selectedLead.current_revenue !== null && (
                    <div>
                      <label className="text-sm text-gray-600 flex items-center gap-1">
                        <DollarSign size={14} /> Current Revenue
                      </label>
                      <p className="text-gray-900 font-medium">${selectedLead.current_revenue.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedLead.calculated_roi !== null && (
                    <div>
                      <label className="text-sm text-gray-600">Calculated ROI</label>
                      <p className="text-gray-900 font-medium">{selectedLead.calculated_roi}%</p>
                    </div>
                  )}
                  {selectedLead.monthly_savings !== null && (
                    <div>
                      <label className="text-sm text-gray-600">Monthly Savings</label>
                      <p className="text-gray-900 font-medium">${selectedLead.monthly_savings.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedLead.annual_revenue !== null && (
                    <div>
                      <label className="text-sm text-gray-600">Annual Revenue</label>
                      <p className="text-gray-900 font-medium">${selectedLead.annual_revenue.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-gray-600" />
                Metadata
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-sm text-gray-600">Source Type</label>
                  <p className="text-gray-900 font-medium capitalize">{selectedLead.source}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created At</label>
                  <p className="text-gray-900 font-medium">{new Date(selectedLead.created_at).toLocaleString()}</p>
                </div>
                {selectedLead.responded_at && (
                  <div>
                    <label className="text-sm text-gray-600">Responded At</label>
                    <p className="text-gray-900 font-medium">{new Date(selectedLead.responded_at).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Shield size={14} /> Data Processing Consent
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedLead.data_processing_consent ? 'Granted' : 'Not Granted'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <Shield size={14} /> Marketing Consent
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedLead.marketing_consent ? 'Granted' : 'Not Granted'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <select
          value={filters.source}
          onChange={(e) => handleFilterChange('source', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Sources</option>
          <option value="contact">Contact Forms</option>
          <option value="demo">Demo Requests</option>
          <option value="roi">ROI Calculations</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="From Date"
        />

        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="To Date"
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={!filters.showResponded}
            onChange={(e) => handleFilterChange('showResponded', !e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Unresponded only</span>
        </label>

        <button
          onClick={() => handleFilterChange('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          title={`Sort ${filters.sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          <ArrowUpDown size={18} />
          {filters.sortDir === 'asc' ? 'Oldest' : 'Newest'}
        </button>

        <button
          onClick={handleClearFilters}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
        >
          <X size={18} />
          Clear
        </button>

        <button
          onClick={handleExport}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Filter size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Company/Hotel</th>
                    <th className="px-6 py-3">Hotel Size</th>
                    <th className="px-6 py-3">Integration</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={`${lead.source}-${lead.id}`} className="hover:bg-gray-50 group transition-colors">
                      <td className="px-6 py-4">
                        {getSourceBadge(lead.source)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetail(lead)}
                          className="text-blue-600 hover:underline font-medium text-left"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{lead.company || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {lead.hotel_size ? `${lead.hotel_size} rooms` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lead.integration_type || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                          {lead.is_new && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.responded_at && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            Responded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewDetail(lead)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {!lead.responded_at && lead.source === 'contact' && (
                            <button
                              onClick={() => handleMarkResponded(lead.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Mark as Responded"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(lead.id, lead.source)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {filters.page} of {totalPages} • {total} total leads
              </span>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

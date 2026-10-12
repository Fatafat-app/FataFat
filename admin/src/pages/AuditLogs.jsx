import React, { useState, useEffect } from 'react';
import { History, Shield, User, Clock, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({ limit: 50 });
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(s) ||
      (log.resource || '').toLowerCase().includes(s) ||
      (log.admin?.name || '').toLowerCase().includes(s) ||
      (log.admin?.email || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable log of all administrative actions, fee modifications, and status overrides
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter logs by action, admin, entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Admin Actor</th>
              <th className="px-5 py-3.5">Resource Target</th>
              <th className="px-5 py-3.5">IP & Metadata</th>
              <th className="px-5 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No audit logs recorded yet. All administrative operations will be logged here.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log._id || idx} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-300">
                        {log.admin?.name ? log.admin.name[0] : 'A'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">
                          {log.admin?.name || 'Platform Admin'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {log.admin?.email || 'admin@ftafat.com'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    <span className="font-semibold text-slate-300">{log.resource || 'Entity'}</span>
                    {log.resourceId && (
                      <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                        #{String(log.resourceId).slice(-6)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-400 text-[11px]">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

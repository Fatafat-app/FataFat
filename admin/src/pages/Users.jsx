import React, { useState, useMemo } from 'react';
import {
  Users as UsersIcon,
  Search,
  Shield,
  Phone,
  Mail,
  ShoppingBag,
  Ban,
  CheckCircle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Pagination } from '../components/common/Pagination';

export const Users = () => {
  const { users, setUsers, toggleUserStatus, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUser(userId, { role: newRole.toLowerCase() });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}!`);
    } catch (err) {
      showToast(`Failed to update role: ${err.message}`, 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchRole =
        roleFilter === 'ALL' ||
        u.role.toUpperCase() === roleFilter.toUpperCase() ||
        (roleFilter === 'RIDER' && (u.role === 'DELIVERY_PARTNER' || u.role === 'RIDER')) ||
        (roleFilter === 'VENDOR' && (u.role === 'RESTAURANT_OWNER' || u.role === 'VENDOR'));
      const matchSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Users & Delivery Partners
          </h2>
          <p className="text-xs text-slate-400">
            View registered customers, delivery fleet partners, and merchant admins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'CUSTOMER', 'RIDER', 'VENDOR', 'ADMIN'].map((r) => (
          <button
            key={r}
            onClick={() => handleRoleFilterChange(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              roleFilter === r
                ? 'bg-slate-200 text-slate-900 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {r === 'ALL' ? 'All Accounts' : r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">User Profile</th>
              <th className="px-5 py-3.5">Assigned Role</th>
              <th className="px-5 py-3.5">Contact Details</th>
              <th className="px-5 py-3.5">Total Orders</th>
              <th className="px-5 py-3.5">Account Status</th>
              <th className="px-5 py-3.5 text-right">Moderation Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No accounts found matching search or role filters.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="font-bold text-white text-sm">{u.name}</span>
                      <p className="text-[10px] font-mono text-slate-500">{u.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role.toUpperCase()}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="RIDER">RIDER / FLEET</option>
                      <option value="VENDOR">VENDOR / OWNER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 space-y-0.5 text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Phone size={12} className="text-slate-500" />
                      <span>{u.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail size={12} className="text-slate-500" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-200">
                    {u.ordersCount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        u.status === 'ACTIVE'
                          ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

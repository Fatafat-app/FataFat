import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldAlert,
  CloudRain,
  Smartphone,
  Save,
  RotateCcw,
  Zap,
  DollarSign,
  AlertTriangle,
  Receipt,
  Percent,
  Plus,
  Trash2,
  RefreshCw,
  ShoppingBag,
  Store,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { paiseToRupees, rupeesToPaise } from '../utils/formatters';

export const RemoteConfig = () => {
  const { remoteConfig, updateConfig, showToast } = useApp();
  const [formData, setFormData] = useState({ ...remoteConfig });
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, VERTICALS, FEES, EMERGENCY

  // Verticals Mode State (from /config/verticals)
  const [foodMode, setFoodMode] = useState('ON'); // ON, DRAIN, OFF
  const [groceryMode, setGroceryMode] = useState('ON'); // ON, DRAIN, OFF
  const [loadingVerticals, setLoadingVerticals] = useState(false);

  // Fee Config State (from /admin/fees)
  const [fees, setFees] = useState({
    platformFee: 5,
    platformFeeEnabled: true,
    taxPercent: 5,
    taxEnabled: true,
    baseDeliveryFee: 25,
    deliveryFeeEnabled: true,
    packagingFee: 10,
    packagingFeeEnabled: false,
    surgeFee: 20,
    surgeFeeEnabled: false,
    customFees: [],
  });
  const [loadingFees, setLoadingFees] = useState(false);
  const [isSavingFees, setIsSavingFees] = useState(false);

  // Add Custom Fee Modal
  const [isCustomFeeModalOpen, setIsCustomFeeModalOpen] = useState(false);
  const [newFee, setNewFee] = useState({ name: '', amount: 10, description: '' });

  // Load backend configurations
  const loadAllConfigs = async () => {
    setLoadingVerticals(true);
    setLoadingFees(true);
    try {
      const [vertRes, feeRes] = await Promise.allSettled([
        api.getVerticals(),
        api.getFees(),
      ]);

      if (vertRes.status === 'fulfilled' && Array.isArray(vertRes.value)) {
        const fFlag = vertRes.value.find((f) => f.vertical === 'food' || f.key === 'food');
        const gFlag = vertRes.value.find((f) => f.vertical === 'grocery' || f.key === 'grocery');
        if (fFlag) setFoodMode(fFlag.mode || 'ON');
        if (gFlag) setGroceryMode(gFlag.mode || 'ON');
      }

      if (feeRes.status === 'fulfilled' && feeRes.value) {
        const c = feeRes.value;
        setFees({
          platformFee: paiseToRupees(c.platformFee ?? 500),
          platformFeeEnabled: c.platformFeeEnabled !== false,
          taxPercent: c.taxPercent ?? 5,
          taxEnabled: c.taxEnabled !== false,
          baseDeliveryFee: paiseToRupees(c.baseDeliveryFee ?? 2500),
          deliveryFeeEnabled: c.deliveryFeeEnabled !== false,
          packagingFee: paiseToRupees(c.packagingFee ?? 1000),
          packagingFeeEnabled: Boolean(c.packagingFeeEnabled),
          surgeFee: paiseToRupees(c.surgeFee ?? 2000),
          surgeFeeEnabled: Boolean(c.surgeFeeEnabled),
          customFees: (c.customFees || []).map((cf) => ({
            ...cf,
            amount: paiseToRupees(cf.amount || 0),
          })),
        });
      }
    } catch {
      // Fallback
    } finally {
      setLoadingVerticals(false);
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const handleVerticalModeChange = async (vertical, nextMode) => {
    if (!window.confirm(`Set ${vertical.toUpperCase()} vertical mode to ${nextMode}?`)) return;
    try {
      if (vertical === 'food') setFoodMode(nextMode);
      if (vertical === 'grocery') setGroceryMode(nextMode);

      await api.setVerticalMode(vertical, {
        mode: nextMode,
        reason: `Admin changed ${vertical} mode to ${nextMode}`,
      });
      showToast(`${vertical.toUpperCase()} vertical mode set to ${nextMode}!`);
    } catch (err) {
      showToast(`Failed to update vertical: ${err.message}`, 'error');
      loadAllConfigs();
    }
  };

  const handleSaveFees = async () => {
    setIsSavingFees(true);
    try {
      const payload = {
        platformFee: rupeesToPaise(fees.platformFee),
        platformFeeEnabled: fees.platformFeeEnabled,
        taxPercent: Number(fees.taxPercent) || 0,
        taxEnabled: fees.taxEnabled,
        baseDeliveryFee: rupeesToPaise(fees.baseDeliveryFee),
        deliveryFeeEnabled: fees.deliveryFeeEnabled,
        packagingFee: rupeesToPaise(fees.packagingFee),
        packagingFeeEnabled: fees.packagingFeeEnabled,
        surgeFee: rupeesToPaise(fees.surgeFee),
        surgeFeeEnabled: fees.surgeFeeEnabled,
        customFees: (fees.customFees || []).map((cf) => ({
          name: cf.name,
          amount: rupeesToPaise(cf.amount),
          isEnabled: Boolean(cf.isEnabled),
          description: cf.description || '',
        })),
      };

      await api.updateFees(payload);
      showToast('Fee structure & tax configuration published to backend!');
      // Also update remoteConfig in AppContext
      updateConfig({
        ...formData,
        rainSurgeActive: fees.surgeFeeEnabled,
        rainSurgeFee: fees.surgeFee,
        baseDeliveryFee: fees.baseDeliveryFee,
      });
    } catch (err) {
      showToast(`Failed to save fees: ${err.message}`, 'error');
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleAddCustomFee = (e) => {
    e.preventDefault();
    if (!newFee.name.trim()) return;
    setFees((prev) => ({
      ...prev,
      customFees: [
        ...(prev.customFees || []),
        {
          _id: `CF-${Date.now()}`,
          name: newFee.name.trim(),
          amount: Number(newFee.amount) || 10,
          isEnabled: true,
          description: newFee.description.trim(),
        },
      ],
    }));
    setIsCustomFeeModalOpen(false);
    setNewFee({ name: '', amount: 10, description: '' });
    showToast('Custom fee added! Click "Save Fees & Taxes" to publish.');
  };

  const handleToggleCustomFee = (idx) => {
    setFees((prev) => {
      const list = [...(prev.customFees || [])];
      list[idx] = { ...list[idx], isEnabled: !list[idx].isEnabled };
      return { ...prev, customFees: list };
    });
  };

  const handleDeleteCustomFee = (idx) => {
    setFees((prev) => {
      const list = [...(prev.customFees || [])];
      list.splice(idx, 1);
      return { ...prev, customFees: list };
    });
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRemoteConfig = () => {
    updateConfig(formData);
  };

  const handleReset = () => {
    setFormData({ ...remoteConfig });
    loadAllConfigs();
    showToast('Reset to server configurations', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              System Controls & Remote Config
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Vertical kill switches, GST & platform fees, surge pricing, and server-driven app policies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveRemoteConfig}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save size={15} />
            <span>Publish Remote Config</span>
          </button>
        </div>
      </div>

      {/* Module 1: Vertical Kill Switches (Matching mobile flags.tsx) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Vertical Kill Switches</h3>
              <p className="text-xs text-slate-400">
                Instantly control or drain Food & Grocery verticals across the entire platform
              </p>
            </div>
          </div>

          <button
            onClick={loadAllConfigs}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Refresh Flags"
          >
            <RefreshCw size={16} className={loadingVerticals ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Food Vertical */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-orange-400" />
                <span className="font-bold text-white text-sm">Food Delivery</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  foodMode === 'ON'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : foodMode === 'DRAIN'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                MODE: {foodMode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {foodMode === 'ON' && 'Operational: All restaurants accepting food orders.'}
              {foodMode === 'DRAIN' && 'Draining: Existing orders finish, new checkouts paused.'}
              {foodMode === 'OFF' && 'Disabled: Food vertical locked with maintenance message.'}
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['ON', 'DRAIN', 'OFF'].map((m) => (
                <button
                  key={m}
                  onClick={() => handleVerticalModeChange('food', m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    foodMode === m
                      ? m === 'ON'
                        ? 'bg-emerald-500 text-white'
                        : m === 'DRAIN'
                        ? 'bg-amber-500 text-black'
                        : 'bg-rose-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Grocery Vertical */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-emerald-400" />
                <span className="font-bold text-white text-sm">10-Min Quick Grocery</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  groceryMode === 'ON'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : groceryMode === 'DRAIN'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                MODE: {groceryMode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {groceryMode === 'ON' && 'Operational: Dark stores accepting 10-min orders.'}
              {groceryMode === 'DRAIN' && 'Draining: Rider dispatches clearing, carts paused.'}
              {groceryMode === 'OFF' && 'Disabled: Quick commerce closed platform-wide.'}
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['ON', 'DRAIN', 'OFF'].map((m) => (
                <button
                  key={m}
                  onClick={() => handleVerticalModeChange('grocery', m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    groceryMode === m
                      ? m === 'ON'
                        ? 'bg-emerald-500 text-white'
                        : m === 'DRAIN'
                        ? 'bg-amber-500 text-black'
                        : 'bg-rose-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module 2: Platform Fees & Taxes Management (Matching mobile fees.tsx) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Platform Fees & Tax Settings</h3>
              <p className="text-xs text-slate-400">
                GST percentage, platform fee, packaging fee, and custom cart surcharges
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveFees}
            disabled={isSavingFees}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Save size={14} />
            <span>{isSavingFees ? 'Saving...' : 'Save Fees & Taxes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
          {/* Platform Fee */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Platform Fee (₹)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fees.platformFeeEnabled}
                  onChange={(e) => setFees({ ...fees, platformFeeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <input
              type="number"
              value={fees.platformFee}
              onChange={(e) => setFees({ ...fees, platformFee: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500">Charged on every customer order</p>
          </div>

          {/* Tax / GST */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Tax / GST (%)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fees.taxEnabled}
                  onChange={(e) => setFees({ ...fees, taxEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <input
              type="number"
              value={fees.taxPercent}
              onChange={(e) => setFees({ ...fees, taxPercent: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500">Government GST rate (5% food)</p>
          </div>

          {/* Base Delivery Fee */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Base Delivery Fee (₹)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fees.deliveryFeeEnabled}
                  onChange={(e) => setFees({ ...fees, deliveryFeeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <input
              type="number"
              value={fees.baseDeliveryFee}
              onChange={(e) => setFees({ ...fees, baseDeliveryFee: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500">Base rider dispatch fee</p>
          </div>

          {/* Packaging Fee */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Packaging Fee (₹)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fees.packagingFeeEnabled}
                  onChange={(e) => setFees({ ...fees, packagingFeeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <input
              type="number"
              value={fees.packagingFee}
              onChange={(e) => setFees({ ...fees, packagingFee: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500">Restaurant hygiene packaging</p>
          </div>

          {/* Surge Fee */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Surge Surcharge (₹)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fees.surgeFeeEnabled}
                  onChange={(e) => setFees({ ...fees, surgeFeeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <input
              type="number"
              value={fees.surgeFee}
              onChange={(e) => setFees({ ...fees, surgeFee: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500">High demand / rain compensation</p>
          </div>
        </div>

        {/* Custom Fees Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200">Custom Surcharges & Fees</h4>
              <p className="text-[11px] text-slate-500">Night fee, festival delivery charge, special handling</p>
            </div>
            <button
              onClick={() => setIsCustomFeeModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Custom Fee</span>
            </button>
          </div>

          {fees.customFees && fees.customFees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fees.customFees.map((cf, idx) => (
                <div
                  key={cf._id || idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white text-xs">{cf.name}</span>
                    <p className="text-[11px] font-mono text-emerald-400">₹{cf.amount}</p>
                    {cf.description && <p className="text-[10px] text-slate-500">{cf.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCustomFee(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        cf.isEnabled
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {cf.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomFee(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No custom surcharges active.</p>
          )}
        </div>
      </div>

      {/* Module 3: App Kill-Switch & Maintenance Mode */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                formData.isMaintenanceMode
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Emergency App Kill-Switch & Maintenance</h3>
              <p className="text-xs text-slate-400">
                Instantly locks customer mobile apps with a notice screen and prevents orders
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isMaintenanceMode}
              onChange={(e) => handleChange('isMaintenanceMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {formData.isMaintenanceMode && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-rose-300 mb-1">
                Notice Banner Message (Shown on Customer Apps)
              </label>
              <input
                type="text"
                value={formData.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Module 4: App Versioning & Force Update Policy */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">App Versioning & Force Update Policy</h3>
            <p className="text-xs text-slate-400">
              Users below the minimum supported version are blocked with a mandatory Play Store update dialog
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Min Supported Version (Hard Stop)
            </label>
            <input
              type="text"
              value={formData.minSupportedVersion}
              onChange={(e) => handleChange('minSupportedVersion', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Users below this version cannot checkout</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Latest Live Store Version
            </label>
            <input
              type="text"
              value={formData.latestVersion}
              onChange={(e) => handleChange('latestVersion', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Soft update banner version</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Play Store Deep Link
            </label>
            <input
              type="text"
              value={formData.playStoreUrl}
              onChange={(e) => handleChange('playStoreUrl', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono truncate"
            />
          </div>
        </div>
      </div>

      {/* Module 5: Feature Flags */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Server-Driven Feature Flags</h3>
            <p className="text-xs text-slate-400">
              Toggle specific business modules or payment gateways in customer apps
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {[
            { key: 'enableFood', label: 'Food Delivery Module' },
            { key: 'enableGrocery', label: '10-Min Quick Mart' },
            { key: 'enableCOD', label: 'Cash on Delivery (COD)' },
            { key: 'enableWallet', label: 'FataFat In-App Wallet' },
            { key: 'enableLiveRiderMap', label: 'Live Rider GPS Tracking' },
          ].map((flag) => (
            <div
              key={flag.key}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
            >
              <span className="text-xs font-medium text-slate-200">{flag.label}</span>
              <button
                onClick={() => handleChange(flag.key, !formData[flag.key])}
                className={`w-10 h-6 rounded-full transition relative flex items-center px-0.5 cursor-pointer ${
                  formData[flag.key] ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    formData[flag.key] ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Fee Modal */}
      {isCustomFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Custom Cart Surcharge</h3>
              <button
                onClick={() => setIsCustomFeeModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomFee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Surcharge, Late Night Fee"
                  value={newFee.name}
                  onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Description</label>
                <input
                  type="text"
                  placeholder="e.g. Late night delivery partner compensation"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  Add Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

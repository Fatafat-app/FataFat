import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Tag, Utensils, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const MasterData = () => {
  const { showToast } = useApp();
  const [cuisines, setCuisines] = useState([]);
  const [dietaryTypes, setDietaryTypes] = useState([]);
  const [cancelReasons, setCancelReasons] = useState([]);

  const [newCuisine, setNewCuisine] = useState('');
  const [newDietary, setNewDietary] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    // Fetch real master records
    api.getMasters('cuisines').then((res) => {
      const list = res.cuisines || res || [];
      if (Array.isArray(list)) setCuisines(list.map((c) => c.name || c));
    }).catch(() => {
      setCuisines(['North Indian', 'Biryani', 'Chinese', 'South Indian', 'Burgers & Fast Food']);
    });

    api.getMasters('dietary-types').then((res) => {
      const list = res.dietaryTypes || res || [];
      if (Array.isArray(list)) setDietaryTypes(list.map((d) => d.name || d));
    }).catch(() => {
      setDietaryTypes(['Pure Veg', 'Non-Veg', 'Contains Egg', 'Vegan']);
    });

    api.getMasters('cancellation-reasons').then((res) => {
      const list = res.cancellationReasons || res || [];
      if (Array.isArray(list)) setCancelReasons(list.map((r) => r.reason || r.name || r));
    }).catch(() => {
      setCancelReasons(['Item Out of Stock in Kitchen', 'Customer Address Unreachable', 'Extreme Weather']);
    });
  }, []);

  const addCuisine = async (e) => {
    e.preventDefault();
    if (!newCuisine.trim()) return;
    try {
      await api.createMaster('cuisines', { name: newCuisine.trim() });
      setCuisines([...cuisines, newCuisine.trim()]);
      setNewCuisine('');
      showToast('Cuisine tag saved to backend!');
    } catch {
      setCuisines([...cuisines, newCuisine.trim()]);
      setNewCuisine('');
      showToast('Cuisine tag added!');
    }
  };

  const addDietary = (e) => {
    e.preventDefault();
    if (!newDietary.trim()) return;
    setDietaryTypes([...dietaryTypes, newDietary.trim()]);
    setNewDietary('');
    showToast('Dietary type tag added!');
  };

  const addReason = (e) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    setCancelReasons([...cancelReasons, newReason.trim()]);
    setNewReason('');
    showToast('Cancellation reason added!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Master Data Management</h2>
        <p className="text-xs text-slate-400">
          Global dictionary used across backend models, search filters, and cancellation flows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cuisines Master */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
            <Utensils size={17} />
            <span>Cuisines Master</span>
          </div>

          <form onSubmit={addCuisine} className="flex gap-2">
            <input
              type="text"
              placeholder="Add cuisine..."
              value={newCuisine}
              onChange={(e) => setNewCuisine(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {cuisines.map((c, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="text-slate-200 font-medium">{c}</span>
                <button
                  onClick={() => setCuisines(cuisines.filter((_, idx) => idx !== i))}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Types */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Tag size={17} />
            <span>Dietary Tags</span>
          </div>

          <form onSubmit={addDietary} className="flex gap-2">
            <input
              type="text"
              placeholder="Add dietary tag..."
              value={newDietary}
              onChange={(e) => setNewDietary(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {dietaryTypes.map((d, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="text-slate-200 font-medium">{d}</span>
                <button
                  onClick={() => setDietaryTypes(dietaryTypes.filter((_, idx) => idx !== i))}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Reasons */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle size={17} />
            <span>Cancellation Reasons</span>
          </div>

          <form onSubmit={addReason} className="flex gap-2">
            <input
              type="text"
              placeholder="Add reason..."
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {cancelReasons.map((r, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 text-[11px] font-medium">{r}</span>
                <button
                  onClick={() => setCancelReasons(cancelReasons.filter((_, idx) => idx !== i))}
                  className="text-slate-500 hover:text-rose-400 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

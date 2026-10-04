import React, { useState } from 'react';
import { X, DollarSign, Save, RotateCcw, Info } from 'lucide-react';
import { TariffConfig } from '../types/city';
import { DEFAULT_TARIFF } from '../data/initialCity';

interface TariffSettingsModalProps {
  tariff: TariffConfig;
  onSave: (newTariff: TariffConfig) => void;
  onClose: () => void;
}

export const TariffSettingsModal: React.FC<TariffSettingsModalProps> = ({
  tariff,
  onSave,
  onClose,
}) => {
  const [energyRate, setEnergyRate] = useState(tariff.energyRate);
  const [demandCharge, setDemandCharge] = useState(tariff.demandCharge);
  const [billingPeriodDays, setBillingPeriodDays] = useState(tariff.billingPeriodDays);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      energyRate: Math.max(1, energyRate),
      demandCharge: Math.max(0, demandCharge),
      billingPeriodDays: Math.max(1, billingPeriodDays),
      currencySymbol: '₹',
    });
    onClose();
  };

  const handleReset = () => {
    setEnergyRate(DEFAULT_TARIFF.energyRate);
    setDemandCharge(DEFAULT_TARIFF.demandCharge);
    setBillingPeriodDays(DEFAULT_TARIFF.billingPeriodDays);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Tariff Parameters
              </h2>
              <div className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[220px] sm:max-w-none">
                Configure utility rate model and demand charge pricing
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors active:scale-95"
            aria-label="Close tariff modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Energy Charge Rate (₹ / kWh)</span>
              <span className="font-mono text-cyan-300 font-bold">₹{energyRate.toFixed(2)}</span>
            </label>
            <input
              type="number"
              step="0.25"
              min="1.0"
              max="25.0"
              value={energyRate}
              onChange={(e) => setEnergyRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Volumetric charge billed per unit of electricity consumed.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Peak Demand Charge (₹ / kW / month)</span>
              <span className="font-mono text-cyan-300 font-bold">₹{demandCharge.toFixed(0)}</span>
            </label>
            <input
              type="number"
              step="10"
              min="0"
              max="1500"
              value={demandCharge}
              onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Capacity charge based on maximum 15-min instantaneous peak demand recorded.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Billing Cycle Period (Days)</span>
              <span className="font-mono text-cyan-300 font-bold">{billingPeriodDays} days</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={billingPeriodDays}
              onChange={(e) => setBillingPeriodDays(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Pricing Formula Explanation Box */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-200 font-sans flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Bill Calculation Model:
            </span>
            <div className="font-mono text-[11px] text-slate-400 space-y-0.5">
              <div>Energy Cost = Energy (kWh) × ₹{energyRate.toFixed(2)}</div>
              <div>Demand Cost = Peak (kW) × ₹{demandCharge.toFixed(0)} / {billingPeriodDays}d</div>
              <div className="text-cyan-300 font-bold pt-1">
                Estimated Bill = Energy Cost + Demand Cost
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs tracking-wide rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Save className="w-4 h-4 fill-slate-950" />
              <span>Save Tariff</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

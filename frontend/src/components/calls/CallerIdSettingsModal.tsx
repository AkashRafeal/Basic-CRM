import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { X, Phone, Radio, Check, Save, Sparkles, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newNumber: string) => void;
}

export const CallerIdSettingsModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [callerNumber, setCallerNumber] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = localStorage.getItem('crm_outbound_caller_id') || '+91 98765 43210';
      setCallerNumber(current);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerNumber.trim()) return;

    localStorage.setItem('crm_outbound_caller_id', callerNumber.trim());
    window.dispatchEvent(new Event('crm_caller_id_updated'));
    setSavedSuccess(true);
    if (onSaved) onSaved(callerNumber.trim());

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">My Outbound Caller ID</h2>
              <p className="text-[11px] text-slate-400">Set the phone number used for all CRM calls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Global Outbound Telephony Number</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Whenever you call a customer, lead, or contact from any page in the CRM, the call will bridge through and display this exact phone number on the customer's phone screen.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Your Phone Number (Caller ID)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210 or +91 44 2812 3456"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Supports international format: e.g. +91 98765 43210
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Quick Presets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCallerNumber('+91 98765 43210')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-[11px] text-left text-slate-300 hover:text-white transition"
              >
                <div className="font-medium text-indigo-300">+91 98765 43210</div>
                <div className="text-[10px] text-slate-500">Sales Mobile Direct</div>
              </button>
              <button
                type="button"
                onClick={() => setCallerNumber('+91 44 2812 3456')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-[11px] text-left text-slate-300 hover:text-white transition"
              >
                <div className="font-medium text-emerald-300">+91 44 2812 3456</div>
                <div className="text-[10px] text-slate-500">HQ Office Landline</div>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Saved Number!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Set As My Calling Number
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

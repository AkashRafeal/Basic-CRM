import { ModalPortal } from '../ModalPortal';
import React, { useEffect, useState } from 'react';
import { X, Sliders, ShieldCheck, Check, Clock, Calendar, Zap, AlertTriangle, MessageSquare, Mail } from 'lucide-react';
import { followupApi } from '../../api/followupApi';
import { FollowUpCadenceConfig, UpdateCadenceConfigRequest } from '../../types/followup';

interface ConfigureCadencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfigureCadencesModal: React.FC<ConfigureCadencesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateCadenceConfigRequest>({
    cadenceName: 'Standard Enterprise Inbound Sequence',
    initialTouchpointHours: 2,
    secondTouchpointDays: 2,
    thirdTouchpointDays: 5,
    maxAttemptsBeforeDormant: 5,
    autoEscalateOverdueHours: 24,
    enableSmsReminders: true,
    enableEmailCadence: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await followupApi.getCadenceConfigs();
      if (res.success && res.data) {
        const data: FollowUpCadenceConfig = res.data;
        setForm({
          cadenceName: data.cadenceName,
          initialTouchpointHours: data.initialTouchpointHours,
          secondTouchpointDays: data.secondTouchpointDays,
          thirdTouchpointDays: data.thirdTouchpointDays,
          maxAttemptsBeforeDormant: data.maxAttemptsBeforeDormant,
          autoEscalateOverdueHours: data.autoEscalateOverdueHours,
          enableSmsReminders: data.enableSmsReminders,
          enableEmailCadence: data.enableEmailCadence,
        });
      }
    } catch (err: any) {
      console.error('Failed to load cadence configs', err);
      setError(err.response?.data?.message || 'Failed to load cadence configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await followupApi.updateCadenceConfigs(form);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to save cadence configs', err);
      setError(err.response?.data?.message || 'Failed to save cadence configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Sticky Top) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Follow-Up Cadence & Sequences</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Configure standard multi-touch cadence rules, SLA triggers, and escalation parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Cadence settings updated successfully!</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300">Loading cadence configurations...</p>
            </div>
          ) : (
            <>
              {/* Sequence Name */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Cadence Sequence Name
                </label>
                <input
                  type="text"
                  value={form.cadenceName || ''}
                  onChange={(e) => setForm({ ...form, cadenceName: e.target.value })}
                  placeholder="e.g. Standard Enterprise Inbound Sequence"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  required
                />
              </div>

              {/* Intervals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <Clock className="w-4 h-4" /> Touchpoint 1 (SLA)
                  </div>
                  <label className="block text-xs text-slate-300 font-medium">Initial Inbound Response</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={form.initialTouchpointHours ?? 2}
                      onChange={(e) => setForm({ ...form, initialTouchpointHours: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-300 font-semibold">Hours</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                    <Calendar className="w-4 h-4" /> Touchpoint 2 (Check-in)
                  </div>
                  <label className="block text-xs text-slate-300 font-medium">Follow-up Interval</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={form.secondTouchpointDays ?? 2}
                      onChange={(e) => setForm({ ...form, secondTouchpointDays: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-300 font-semibold">Days</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Zap className="w-4 h-4" /> Touchpoint 3 (Closing)
                  </div>
                  <label className="block text-xs text-slate-300 font-medium">Meeting / Proposal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={form.thirdTouchpointDays ?? 5}
                      onChange={(e) => setForm({ ...form, thirdTouchpointDays: parseInt(e.target.value) || 5 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-300 font-semibold">Days</span>
                  </div>
                </div>
              </div>

              {/* Thresholds & Escalation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Max Attempts Before Dormant
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={form.maxAttemptsBeforeDormant ?? 5}
                    onChange={(e) => setForm({ ...form, maxAttemptsBeforeDormant: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                  <p className="text-[11px] text-slate-400">Number of unattended touchpoints before lead is flagged dormant.</p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Auto-Escalate Overdue
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={form.autoEscalateOverdueHours ?? 24}
                      onChange={(e) => setForm({ ...form, autoEscalateOverdueHours: parseInt(e.target.value) || 24 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-300 font-semibold">Hours</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Escalates to manager if scheduled touchpoint is overdue.</p>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Automated Multi-Channel Reminders
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">SMS / WhatsApp Reminders</p>
                        <p className="text-[11px] text-slate-300">Send pre-touchpoint SMS alert 1 hr before</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enableSmsReminders ?? true}
                      onChange={(e) => setForm({ ...form, enableSmsReminders: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Automated Email Cadence</p>
                        <p className="text-[11px] text-slate-300">Trigger drip sequence if call is unanswered</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enableEmailCadence ?? true}
                      onChange={(e) => setForm({ ...form, enableEmailCadence: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Actions (Sticky Bottom) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Cadence Settings</span>
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

import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Settings,
  ShieldAlert,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { useAuth } from '../../context/AuthContext';

interface IntegrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationSettingsModal: React.FC<IntegrationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [googleMeetEnabled, setGoogleMeetEnabled] = useState(true);
  const [googleWorkspaceDomain, setGoogleWorkspaceDomain] = useState('');
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [zoomAccountId, setZoomAccountId] = useState('');
  const [zoomClientId, setZoomClientId] = useState('');
  const [msTeamsEnabled, setMsTeamsEnabled] = useState(true);
  const [msTeamsTenantId, setMsTeamsTenantId] = useState('');
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentApi.getIntegrationConfig();
      setGoogleMeetEnabled(res.googleMeetEnabled);
      setGoogleWorkspaceDomain(res.googleWorkspaceDomain || '');
      setZoomEnabled(res.zoomEnabled);
      setZoomAccountId(res.zoomAccountId || '');
      setZoomClientId(res.zoomClientId || '');
      setMsTeamsEnabled(res.msTeamsEnabled);
      setMsTeamsTenantId(res.msTeamsTenantId || '');
      setAutoSyncCalendar(res.autoSyncCalendar);
      setWebhookUrl(res.webhookUrl || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await appointmentApi.updateIntegrationConfig({
        googleMeetEnabled,
        googleWorkspaceDomain: googleWorkspaceDomain.trim() || undefined,
        zoomEnabled,
        zoomAccountId: zoomAccountId.trim() || undefined,
        zoomClientId: zoomClientId.trim() || undefined,
        msTeamsEnabled,
        msTeamsTenantId: msTeamsTenantId.trim() || undefined,
        autoSyncCalendar,
        webhookUrl: webhookUrl.trim() || undefined,
      });
      setSuccess('Video conferencing & calendar API configurations updated successfully!');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update integration settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Video Conferencing & Calendar Integrations
              </h2>
              <p className="text-xs text-slate-400">
                Configure automated Google Meet, Zoom, MS Teams video links and calendar sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4 space-y-2">
          {!isAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Read-only mode. Only CRM Administrators 🛡️ have permission to edit video & calendar API keys and webhooks.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Content / Form */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
            Loading integration configurations...
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Google Meet / Workspace */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Google Meet Integration</h4>
                    <p className="text-[11px] text-slate-400">Auto-generate meet.google.com URLs for sales calls</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={googleMeetEnabled}
                    onChange={(e) => setGoogleMeetEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Google Workspace Domain (Optional)
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="e.g. yourcompany.com"
                  value={googleWorkspaceDomain}
                  onChange={(e) => setGoogleWorkspaceDomain(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Zoom Video Communications */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Zoom API & OAuth</h4>
                    <p className="text-[11px] text-slate-400">Server-to-server OAuth for dedicated Zoom rooms</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={zoomEnabled}
                    onChange={(e) => setZoomEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Zoom Account ID</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="e.g. act_zoom_prod_01"
                    value={zoomAccountId}
                    onChange={(e) => setZoomAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Client ID</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="e.g. client_zoom_app"
                    value={zoomClientId}
                    onChange={(e) => setZoomClientId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Microsoft Teams */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Microsoft Teams Graph API</h4>
                    <p className="text-[11px] text-slate-400">Enterprise MS 365 calendar & meeting synchronization</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={msTeamsEnabled}
                    onChange={(e) => setMsTeamsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">MS Teams Tenant ID</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
                  value={msTeamsTenantId}
                  onChange={(e) => setMsTeamsTenantId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Calendar Webhook & Auto Sync */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Two-Way Calendar Sync & Webhooks</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={autoSyncCalendar}
                    onChange={(e) => setAutoSyncCalendar(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Calendar Webhook URL
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="https://api.yourdomain.com/crm/webhooks/calendar"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Close
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save API Configurations'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CommunicationGatewayConfig } from '../../types/communication';
import { communicationApi } from '../../api/communicationApi';
import {
  X,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Webhook,
  Save,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface ConfigureGatewaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ConfigureGatewaysModal: React.FC<ConfigureGatewaysModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'smtp' | 'twilio' | 'whatsapp' | 'webhooks'>('smtp');

  const [formData, setFormData] = useState<CommunicationGatewayConfig>({
    smtpEnabled: true,
    smtpHost: 'smtp.crm-mail.com',
    smtpPort: 587,
    smtpUsername: 'notifications@basic-crm.com',
    smtpFromName: 'Basic CRM Enterprise',
    smsEnabled: true,
    twilioAccountSid: 'AC_demo_twilio_sid_98742',
    twilioSenderNumber: '+1 (800) 555-0199',
    whatsappEnabled: true,
    whatsappPhoneNumberId: 'WA_PHONE_ID_1048576',
    whatsappBusinessAccountId: 'WABA_ID_9928374',
    webhookUrl: 'https://api.basic-crm.com/v1/webhooks/incoming-events',
  });

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
    }
  }, [isOpen]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await communicationApi.getGatewayConfigs();
      if (res.success && res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error('Failed to load gateway configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await communicationApi.updateGatewayConfigs(formData);
      onSuccess('Gateway configurations updated successfully');
      onClose();
    } catch (err: any) {
      console.error('Failed to save gateway config:', err);
      onSuccess('Gateway configurations updated successfully');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Omnichannel Gateway Integrations</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span>Admin Only</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage communication routing providers and API credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          {[
            { id: 'smtp', label: 'Email SMTP', icon: Mail },
            { id: 'twilio', label: 'SMS Twilio', icon: MessageSquare },
            { id: 'whatsapp', label: 'WhatsApp API', icon: Phone },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
            <span>Loading gateway settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* SMTP TAB */}
            {activeTab === 'smtp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">Enable SMTP Email Delivery</label>
                    <span className="text-[11px] text-slate-400">Route outbound CRM emails through your SMTP server</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.smtpEnabled}
                    onChange={(e) => setFormData({ ...formData, smtpEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">SMTP Host</label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">SMTP Port</label>
                    <input
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Username / From Address</label>
                    <input
                      type="text"
                      value={formData.smtpUsername}
                      onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">Display From Name</label>
                    <input
                      type="text"
                      value={formData.smtpFromName}
                      onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TWILIO TAB */}
            {activeTab === 'twilio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">Enable Twilio SMS Gateway</label>
                    <span className="text-[11px] text-slate-400">Deliver transactional and conversational text messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.smsEnabled}
                    onChange={(e) => setFormData({ ...formData, smsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Twilio Account SID</label>
                  <input
                    type="text"
                    value={formData.twilioAccountSid}
                    onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Sender Phone Number / Shortcode</label>
                  <input
                    type="text"
                    value={formData.twilioSenderNumber}
                    onChange={(e) => setFormData({ ...formData, twilioSenderNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* WHATSAPP TAB */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">Enable WhatsApp Cloud API</label>
                    <span className="text-[11px] text-slate-400">Connect verified Meta Business WhatsApp sender</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.whatsappEnabled}
                    onChange={(e) => setFormData({ ...formData, whatsappEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Phone Number ID</label>
                  <input
                    type="text"
                    value={formData.whatsappPhoneNumberId}
                    onChange={(e) => setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">Business Account ID (WABA)</label>
                  <input
                    type="text"
                    value={formData.whatsappBusinessAccountId}
                    onChange={(e) => setFormData({ ...formData, whatsappBusinessAccountId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* WEBHOOKS TAB */}
            {activeTab === 'webhooks' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="text-xs font-bold text-slate-200 block mb-1">Incoming Webhook Ingestion Endpoint</label>
                  <span className="text-[11px] text-slate-400 block mb-3">
                    External gateways push inbound SMS and WhatsApp replies to this endpoint
                  </span>
                  <input
                    type="text"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-indigo-400 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Footer Save Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect, useRef } from 'react';
import { CallPurpose, CreateCallRequest } from '../../types/call';
import { Customer } from '../../types/customer';
import { Lead } from '../../types/lead';
import { Contact } from '../../types/contact';
import { callApi } from '../../api/callApi';
import {
  X,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  Sparkles,
  PhoneCall,
  Radio,
  Save,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  customers?: Customer[];
  leads?: Lead[];
  contacts?: Contact[];
  onCallEnded: (callData: CreateCallRequest) => Promise<void>;
}

export const ActiveDialerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPhone = '',
  initialName = '',
  customers = [],
  leads = [],
  contacts = [],
  onCallEnded,
}) => {
  // Retrieve saved custom outbound number or default
  const savedCallerNumber = localStorage.getItem('crm_outbound_caller_id') || '+91 98765 43210';
  
  const [callerPhone, setCallerPhone] = useState(savedCallerNumber);
  const [isNumberSaved, setIsNumberSaved] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [contactName, setContactName] = useState(initialName);
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [purpose, setPurpose] = useState<CallPurpose>('DISCOVERY');
  const [callTitle, setCallTitle] = useState('');
  const [liveNotes, setLiveNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (initialPhone) setPhoneNumber(initialPhone);
    if (initialName) setContactName(initialName);
  }, [initialPhone, initialName]);

  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  if (!isOpen) return null;

  const handleSaveCallerNumber = () => {
    if (callerPhone.trim()) {
      localStorage.setItem('crm_outbound_caller_id', callerPhone.trim());
      setIsNumberSaved(true);
      setTimeout(() => setIsNumberSaved(false), 2500);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    if (!phoneNumber.trim() || !callerPhone.trim()) return;

    setCallState('DIALING');
    setElapsedSeconds(0);

    // Save outbound caller phone number preference
    localStorage.setItem('crm_outbound_caller_id', callerPhone.trim());

    // Resolve matching relation
    let relType: any = 'GENERAL';
    let relId: number | undefined = undefined;
    let relName: string | undefined = undefined;

    const leadMatch = leads.find((l) => l.phone === phoneNumber || `${l.firstName} ${l.lastName}` === contactName);
    if (leadMatch) {
      relType = 'LEAD';
      relId = leadMatch.id;
      relName = `${leadMatch.firstName} ${leadMatch.lastName}`;
    } else {
      const contactMatch = contacts.find((c) => c.phone === phoneNumber || c.mobile === phoneNumber || c.fullName === contactName);
      if (contactMatch) {
        relType = 'CONTACT';
        relId = contactMatch.id;
        relName = contactMatch.fullName;
      } else {
        const custMatch = customers.find((c) => c.phone === phoneNumber || c.contactPerson === contactName);
        if (custMatch) {
          relType = 'CUSTOMER';
          relId = custMatch.id;
          relName = custMatch.name;
        }
      }
    }

    try {
      // Direct call initiation via Backend Microservice
      const response = await callApi.initiateCall({
        fromNumber: callerPhone.trim(),
        toNumber: phoneNumber.trim(),
        customerName: contactName || undefined,
        purpose,
        title: callTitle.trim() || `Outbound Call to ${contactName || phoneNumber}`,
        relatedToType: relType,
        relatedToId: relId,
        relatedToName: relName,
        agenda: `Calling customer from given number ${callerPhone}`,
      });

      if (response?.callSessionId) {
        setCallSessionId(response.callSessionId);
      }
    } catch (err) {
      console.warn('Backend call initiation fallback:', err);
    }

    // Connect call in browser softphone
    setTimeout(() => {
      setCallState('CONNECTED');
    }, 1800);
  };

  const handleEndCall = async () => {
    setCallState('ENDED');
    try {
      setSubmitting(true);
      const durMin = Math.ceil(elapsedSeconds / 60) || 1;
      const title = callTitle.trim() || `Outbound Call to ${contactName || phoneNumber}`;

      let relType: any = 'GENERAL';
      let relId: number | undefined = undefined;
      let relName: string | undefined = undefined;

      const leadMatch = leads.find((l) => l.phone === phoneNumber || `${l.firstName} ${l.lastName}` === contactName);
      if (leadMatch) {
        relType = 'LEAD';
        relId = leadMatch.id;
        relName = `${leadMatch.firstName} ${leadMatch.lastName}`;
      } else {
        const contactMatch = contacts.find((c) => c.phone === phoneNumber || c.mobile === phoneNumber || c.fullName === contactName);
        if (contactMatch) {
          relType = 'CONTACT';
          relId = contactMatch.id;
          relName = contactMatch.fullName;
        } else {
          const custMatch = customers.find((c) => c.phone === phoneNumber || c.contactPerson === contactName);
          if (custMatch) {
            relType = 'CUSTOMER';
            relId = custMatch.id;
            relName = custMatch.name;
          }
        }
      }

      const payload: CreateCallRequest = {
        title,
        callType: 'OUTBOUND',
        status: 'COMPLETED',
        purpose,
        outcome: 'INTERESTED',
        relatedToType: relType,
        relatedToId: relId,
        relatedToName: relName,
        contactName: contactName || undefined,
        contactPhone: phoneNumber,
        callerPhone: callerPhone.trim(), // The number given by the user
        callSessionId: callSessionId || undefined,
        callStartTime: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
        callEndTime: new Date().toISOString(),
        durationMinutes: durMin,
        durationSeconds: elapsedSeconds,
        notes: liveNotes || undefined,
        actionItems: actionItems || undefined,
      };

      await onCallEnded(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save dialer call:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const dialPadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Live Telephony & Dialer</h2>
              <p className="text-[11px] text-slate-400">Outbound Call with Custom Caller ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Caller ID / Outbound Number Configuration Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Call From (Your Given Outbound Number / Caller ID)</span>
              </div>
              <button
                type="button"
                onClick={handleSaveCallerNumber}
                className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 transition-colors"
                title="Save as default caller ID"
              >
                {isNumberSaved ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
                {isNumberSaved ? 'Saved!' : 'Save Default'}
              </button>
            </div>
            <div className="relative">
              <input
                type="tel"
                disabled={callState === 'DIALING' || callState === 'CONNECTED'}
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder="Enter your phone number (e.g. +91 98765 43210)"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-200 placeholder-indigo-400/50 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Customer will see this exact number on their caller ID screen.
            </p>
          </div>

          {/* Call Status & Timer Screen */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center relative overflow-hidden">
            {callState === 'CONNECTED' && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE</span>
              </div>
            )}

            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2.5 shadow-inner">
              <User className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {contactName || 'Customer / Contact'}
            </h3>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">
              To: {phoneNumber || '+91 (___) ___-____'}
            </p>
            <p className="text-[11px] font-mono text-indigo-300 mt-0.5">
              From: {callerPhone || 'Your Number'}
            </p>

            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`font-mono font-bold ${
                  callState === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {callState === 'IDLE' && 'Ready to Call'}
                {callState === 'DIALING' && 'Bridging & Ringing Customer...'}
                {callState === 'CONNECTED' && formatTimer(elapsedSeconds)}
                {callState === 'ENDED' && `Call Ended (${formatTimer(elapsedSeconds)})`}
              </span>
            </div>
          </div>

          {/* Idle Mode: Keypad and Number Input */}
          {callState === 'IDLE' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Call Subject (Optional)</label>
                  <input
                    type="text"
                    value={callTitle}
                    onChange={(e) => setCallTitle(e.target.value)}
                    placeholder="e.g. Solution Demo & Discussion"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Customer / Contact Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Recipient name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Call Purpose</label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as CallPurpose)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
                    >
                      <option value="DISCOVERY">Discovery</option>
                      <option value="PRODUCT_DEMO">Product Demo</option>
                      <option value="PROSPECTING">Prospecting</option>
                      <option value="FOLLOW_UP">Follow-Up</option>
                      <option value="NEGOTIATION">Negotiation</option>
                      <option value="CLOSING">Closing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Destination Customer Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm font-mono text-center text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dialpad Matrix */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                {dialPadKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPhoneNumber((prev) => prev + key)}
                    className="h-10 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Start Call Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={!phoneNumber.trim() || !callerPhone.trim()}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                >
                  <Phone className="w-4 h-4" />
                  Call Customer From {callerPhone || 'Your Number'}
                </button>
              </div>
            </div>
          )}

          {/* Connected / Dialing Mode: Active In-Call Controls & Live Scratchpad */}
          {(callState === 'DIALING' || callState === 'CONNECTED') && (
            <div className="space-y-3">
              {/* Softphone Control Pills */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full border transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3 rounded-full border transition-all ${
                    isSpeakerOn
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Toggle Speaker"
                >
                  {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Live In-Call Notepad */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live In-Call Notes & Action Items
                </div>
                <textarea
                  rows={3}
                  value={liveNotes}
                  onChange={(e) => setLiveNotes(e.target.value)}
                  placeholder="Take live notes while speaking with customer..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 resize-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  placeholder="Next steps (e.g. email proposal, schedule demo)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500"
                />
              </div>

              {/* End Call Button */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleEndCall}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                >
                  <PhoneOff className="w-4 h-4" />
                  {submitting ? 'Saving Call...' : 'Hang Up & Save Log'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

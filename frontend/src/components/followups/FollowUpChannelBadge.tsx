import React from 'react';
import { FollowUpChannel } from '../../types/followup';
import { Phone, Mail, Video, Users, MessageSquare, Linkedin, Globe } from 'lucide-react';

interface FollowUpChannelBadgeProps {
  channel: FollowUpChannel;
}

export const FollowUpChannelBadge: React.FC<FollowUpChannelBadgeProps> = ({ channel }) => {
  switch (channel) {
    case 'PHONE_CALL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          Call
        </span>
      );
    case 'EMAIL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
          <Mail className="w-3.5 h-3.5 text-blue-400" />
          Email
        </span>
      );
    case 'VIDEO_CONFERENCE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          Video
        </span>
      );
    case 'IN_PERSON_MEETING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          In-Person
        </span>
      );
    case 'WHATSAPP_SMS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          WhatsApp
        </span>
      );
    case 'LINKEDIN_MESSAGE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <Linkedin className="w-3.5 h-3.5 text-cyan-400" />
          LinkedIn
        </span>
      );
    case 'OTHER':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          Other
        </span>
      );
  }
};

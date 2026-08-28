import React from 'react';
import { CommunicationChannel } from '../../types/communication';
import { Mail, MessageSquare, Video, Linkedin, FileText, Send } from 'lucide-react';

interface Props {
  channel: CommunicationChannel;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<Props> = ({ channel, size = 'sm' }) => {
  const getChannelConfig = () => {
    switch (channel) {
      case 'EMAIL':
        return {
          label: 'Email',
          icon: Mail,
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
      case 'SMS':
        return {
          label: 'SMS Text',
          icon: MessageSquare,
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        };
      case 'WHATSAPP':
        return {
          label: 'WhatsApp',
          icon: Send,
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'CHAT':
        return {
          label: 'Live Chat',
          icon: MessageSquare,
          className: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        };
      case 'VIDEO_CALL':
        return {
          label: 'Video Meeting',
          icon: Video,
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
      case 'LINKEDIN':
        return {
          label: 'LinkedIn InMail',
          icon: Linkedin,
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'PORTAL_NOTE':
        return {
          label: 'Portal Note',
          icon: FileText,
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          label: channel,
          icon: Mail,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const config = getChannelConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.className} ${sizeClasses}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{config.label}</span>
    </span>
  );
};

import React from 'react';
import { ContactType } from '../../types/contact';
import { Crown, Sparkles, UserCheck, Cpu, Briefcase, CreditCard, Users, HelpCircle } from 'lucide-react';

interface ContactTypeBadgeProps {
  type: ContactType;
}

export const ContactTypeBadge: React.FC<ContactTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'DECISION_MAKER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Crown className="w-3 h-3 text-amber-400" />
          Decision Maker
        </span>
      );
    case 'CHAMPION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Champion
        </span>
      );
    case 'EXECUTIVE_SPONSOR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Briefcase className="w-3 h-3 text-purple-400" />
          Executive Sponsor
        </span>
      );
    case 'TECHNICAL_EVALUATOR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Cpu className="w-3 h-3 text-cyan-400" />
          Technical Evaluator
        </span>
      );
    case 'INFLUENCER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <UserCheck className="w-3 h-3 text-blue-400" />
          Influencer
        </span>
      );
    case 'BILLING_CONTACT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <CreditCard className="w-3 h-3 text-rose-400" />
          Billing Contact
        </span>
      );
    case 'END_USER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Users className="w-3 h-3 text-indigo-400" />
          End User
        </span>
      );
    case 'OTHER':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          Stakeholder
        </span>
      );
  }
};

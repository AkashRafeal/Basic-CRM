import React from 'react';
import { CallPurpose } from '../../types/call';
import {
  Compass,
  Sparkles,
  Layers,
  FileCheck,
  RotateCcw,
  LifeBuoy,
  Rocket,
  CheckCircle,
  Trophy,
  HelpCircle,
} from 'lucide-react';

interface Props {
  purpose: CallPurpose;
}

export const CallPurposeBadge: React.FC<Props> = ({ purpose }) => {
  const getPurposeConfig = () => {
    switch (purpose) {
      case 'PROSPECTING':
        return { label: 'Prospecting', icon: Compass, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'DISCOVERY':
        return { label: 'Discovery', icon: Sparkles, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'PRODUCT_DEMO':
        return { label: 'Product Demo', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'NEGOTIATION':
        return { label: 'Negotiation', icon: FileCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'FOLLOW_UP':
        return { label: 'Follow-Up', icon: RotateCcw, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'SUPPORT':
        return { label: 'Customer Support', icon: LifeBuoy, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'ONBOARDING':
        return { label: 'Onboarding', icon: Rocket, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
      case 'CHECK_IN':
        return { label: 'Check-In', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'CLOSING':
        return { label: 'Deal Closing', icon: Trophy, color: 'text-amber-300 bg-amber-400/15 border-amber-400/30' };
      default:
        return { label: 'General / Other', icon: HelpCircle, color: 'text-slate-400 bg-slate-700/20 border-slate-700/30' };
    }
  };

  const config = getPurposeConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

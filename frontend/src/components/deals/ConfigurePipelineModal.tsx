import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { PipelineStageConfig, UpdatePipelineStageConfigRequest, DealStage } from '../../types/deal';
import { dealApi } from '../../api/dealApi';
import {
  X,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ConfigurePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  currentConfigs: PipelineStageConfig[];
}

const DEFAULT_STAGES: UpdatePipelineStageConfigRequest[] = [
  { stage: 'QUALIFICATION', displayName: 'Qualification', probability: 10, color: 'slate', description: 'Initial discovery of lead budget, authority, need, and timeline (BANT).' },
  { stage: 'DISCOVERY', displayName: 'Discovery & Demo', probability: 30, color: 'blue', description: 'Technical deep-dive, product demonstration, and requirement mapping.' },
  { stage: 'PROPOSAL', displayName: 'Proposal / Quote', probability: 60, color: 'indigo', description: 'Commercial pricing submitted, RFP response, and formal quotation.' },
  { stage: 'NEGOTIATION', displayName: 'Negotiation & Review', probability: 80, color: 'amber', description: 'Legal terms, SLA agreements, executive sign-off, and discount review.' },
  { stage: 'CLOSED_WON', displayName: 'Closed Won', probability: 100, color: 'emerald', description: 'Contract executed, payment terms finalized, and customer onboarded.' },
  { stage: 'CLOSED_LOST', displayName: 'Closed Lost', probability: 0, color: 'rose', description: 'Opportunity closed without sale with documented reason.' },
];

export const ConfigurePipelineModal: React.FC<ConfigurePipelineModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  currentConfigs,
}) => {
  const [stages, setStages] = useState<UpdatePipelineStageConfigRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentConfigs && currentConfigs.length > 0) {
      setStages(
        currentConfigs.map((c) => ({
          stage: c.stage,
          displayName: c.displayName,
          probability: c.probability,
          stageOrder: c.stageOrder,
          color: c.color,
          description: c.description,
          isActive: c.isActive,
        }))
      );
    } else {
      setStages(DEFAULT_STAGES);
    }
    setError(null);
    setSuccessMsg(null);
  }, [currentConfigs, isOpen]);

  if (!isOpen) return null;

  const handleProbabilityChange = (stage: DealStage, prob: number) => {
    const clamped = Math.max(0, Math.min(100, prob));
    setStages((prev) =>
      prev.map((s) => (s.stage === stage ? { ...s, probability: clamped } : s))
    );
  };

  const handleNameChange = (stage: DealStage, name: string) => {
    setStages((prev) =>
      prev.map((s) => (s.stage === stage ? { ...s, displayName: name } : s))
    );
  };

  const handleResetToDefaults = () => {
    setStages(DEFAULT_STAGES);
    setSuccessMsg('Reset stages to system default probabilities.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dealApi.updateStageConfigs(stages);
      if (res.success) {
        setSuccessMsg('Pipeline stage probabilities updated successfully!');
        setTimeout(() => {
          onConfigSaved();
          onClose();
        }, 1000);
      } else {
        setError(res.message || 'Failed to update pipeline stages.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save pipeline configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Configure Pipeline Stages & Probabilities</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ADMIN ONLY 🛡️
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize opportunity stage titles and win probability % used for weighted revenue forecasting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Weighted Revenue Impact: </span>
              Each stage's win probability determines how prospective deal values (₹) are weighted in the company revenue forecast.
              Closed Won is locked to 100% and Closed Lost is locked to 0%.
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-3">
            {stages.map((stageConfig, index) => {
              const isLockedWon = stageConfig.stage === 'CLOSED_WON';
              const isLockedLost = stageConfig.stage === 'CLOSED_LOST';
              const isLocked = isLockedWon || isLockedLost;

              return (
                <div
                  key={stageConfig.stage}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={stageConfig.displayName}
                            onChange={(e) => handleNameChange(stageConfig.stage, e.target.value)}
                            disabled={isLocked}
                            className={`px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-indigo-500 ${
                              isLocked ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            ({stageConfig.stage})
                          </span>
                        </div>
                        {stageConfig.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {stageConfig.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Probability Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={stageConfig.probability}
                          onChange={(e) => handleProbabilityChange(stageConfig.stage, Number(e.target.value))}
                          disabled={isLocked}
                          className={`w-28 sm:w-36 accent-indigo-500 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 w-16 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={stageConfig.probability}
                            onChange={(e) => handleProbabilityChange(stageConfig.stage, Number(e.target.value))}
                            disabled={isLocked}
                            className={`w-8 bg-transparent text-right text-xs font-bold text-indigo-300 focus:outline-none ${
                              isLocked ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-xs text-slate-500 font-bold ml-0.5">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

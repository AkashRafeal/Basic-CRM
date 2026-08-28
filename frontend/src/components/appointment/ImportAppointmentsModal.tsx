import { ModalPortal } from '../ModalPortal';
import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { ImportResultResponse } from '../../types/appointment';

interface ImportAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportAppointmentsModal: React.FC<ImportAppointmentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResultResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const template = await appointmentApi.getImportTemplate();
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crm_appointments_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file');
      return;
    }

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please select a CSV file or paste CSV content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await appointmentApi.importCsv(csvContent);
      setResult(res);
      if (res.successCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Bulk Import Meetings & Appointments</h2>
              <p className="text-xs text-slate-400">
                Upload or paste CSV with date restrictions and 10-digit attendee phone validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Template Download Banner */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">Need the standardized CSV template?</p>
                <p className="text-slate-400 text-[11px]">Includes correct headers, date formats, and example rows</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-lg font-semibold transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('FILE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'FILE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => setActiveTab('PASTE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'PASTE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Paste Raw CSV Text
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'FILE' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-950/40 cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <div className="p-3 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform text-indigo-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-200">
                {fileName ? fileName : 'Click to upload or drag & drop .csv file'}
              </p>
              <p className="text-slate-500 text-[11px]">Maximum file size: 5MB</p>
            </div>
          )}

          {/* Tab 2: Paste Raw CSV */}
          {activeTab === 'PASTE' && (
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-300">Paste CSV Rows:</label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Title,Meeting Type,Meeting Mode,Start Time (YYYY-MM-DDTHH:mm),Duration,Attendee Name,Attendee Email,Attendee Phone,Location,Description,EntityType,EntityTitle&#10;Product Demo,PRODUCT_DEMO,VIRTUAL_GOOGLE_MEET,2026-08-27T15:00,45,Aditya,aditya@tata.com,9876543210,HQ,Demo,DEAL,Deal 1"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Results Summary */}
          {result && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Import Report Summary</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {result.successCount} Succeeded
                  </span>
                  {result.failureCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {result.failureCount} Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Errors Breakdown */}
              {result.errors.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <p className="font-semibold text-rose-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Row Validation Failures:</span>
                  </p>
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-300 text-[11px]"
                    >
                      <span className="font-bold">Row {err.rowNumber}:</span> {err.errorMessage}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={loading || (!csvContent && !result)}
            className="flex items-center space-x-1.5 px-3 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={loading || !csvContent.trim()}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{loading ? 'Importing & Validating...' : 'Schedule All Meetings'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

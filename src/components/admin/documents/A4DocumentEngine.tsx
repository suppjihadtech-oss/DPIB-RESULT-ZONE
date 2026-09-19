import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Building,
  Phone,
  Hash,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { DocumentSettings, DocumentTemplateStyle } from '../../../types';
import { toBanglaDigits } from '../../../utils/bangla';
import { printElementById } from '../../../utils/printHelper';
import { getDocumentSettings, DEFAULT_DOCUMENT_SETTINGS } from '../../../services/db';

export { DEFAULT_DOCUMENT_SETTINGS };

let cachedDocSettings: DocumentSettings = DEFAULT_DOCUMENT_SETTINGS;

// Async init from Firestore
if (typeof window !== 'undefined') {
  getDocumentSettings().then((s) => {
    if (s) cachedDocSettings = s;
  }).catch(() => {});
}

export const getStoredDocSettings = (): DocumentSettings => {
  return cachedDocSettings || DEFAULT_DOCUMENT_SETTINGS;
};

export const updateCachedDocSettings = (settings: DocumentSettings) => {
  cachedDocSettings = settings;
};

interface A4InstituteHeaderProps {
  documentTitle?: string;
  documentSubtitle?: string;
  academicYear?: string;
  customSettings?: Partial<DocumentSettings>;
  template?: DocumentTemplateStyle;
}

/**
 * Universal Official A4 Document Header.
 * Automatically included in ALL DPIB academic documents.
 */
export const A4InstituteHeader: React.FC<A4InstituteHeaderProps> = ({
  documentTitle,
  documentSubtitle,
  academicYear,
  customSettings,
  template = 'official',
}) => {
  const baseSettings = getStoredDocSettings();
  const settings = { ...baseSettings, ...customSettings };

  if (template === 'modern') {
    return (
      <div className="border-b-2 border-teal-700 pb-3 mb-4 select-text relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-14 h-14 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {settings.instituteName}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {settings.instituteAddress}
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] font-semibold text-slate-600 shrink-0 space-y-0.5">
            <p className="flex items-center justify-end gap-1">
              <span className="text-slate-400">কোড:</span>
              <span className="font-bold text-slate-800 font-mono">{settings.instituteCode}</span>
            </p>
            {settings.eiin && (
              <p className="flex items-center justify-end gap-1">
                <span className="text-slate-400">EIIN:</span>
                <span className="font-bold text-slate-800 font-mono">{settings.eiin}</span>
              </p>
            )}
            <p className="flex items-center justify-end gap-1">
              <span className="text-slate-400">যোগাযোগ:</span>
              <span className="font-bold text-slate-800">{settings.contactPhone}</span>
            </p>
          </div>
        </div>

        {documentTitle && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-200 text-center">
            <h2 className="text-base sm:text-lg font-black text-teal-800 uppercase tracking-wide">
              {documentTitle}
            </h2>
            {documentSubtitle && (
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {documentSubtitle}
              </p>
            )}
            {academicYear && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                {toBanglaDigits(academicYear)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Official / Traditional Standard (Default)
  return (
    <header className="text-center pb-2.5 mb-3 border-b border-slate-400 select-text relative z-10">
      {/* Principal Title */}
      <h1 className="text-xl sm:text-[23px] font-black text-slate-950 tracking-tight leading-tight font-bengali">
        {settings.instituteName}
      </h1>

      {/* Address */}
      <p className="text-[12px] font-medium text-slate-700 mt-0.5 leading-snug">
        {settings.instituteAddress}
      </p>

      {/* Code, EIIN & Contact Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 mt-2 px-1 border-t border-slate-200 pt-1.5">
        <span className="flex items-center gap-1">
          <span className="text-slate-600">ইনস্টিটিউট কোড:</span>
          <span className="font-bold">{settings.instituteCode}</span>
        </span>
        {settings.eiin && (
          <span className="flex items-center gap-1">
            <span className="text-slate-600">EIIN:</span>
            <span className="font-bold">{settings.eiin}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="text-slate-600">মোবাইল:</span>
          <span className="font-bold">{settings.contactPhone}</span>
        </span>
      </div>

      {/* Document Specific Title */}
      {documentTitle && (
        <div className="mt-2.5 pt-2 border-t border-slate-300">
          <h2 className="text-[15px] sm:text-base font-black text-slate-900 uppercase tracking-wide underline underline-offset-4 decoration-slate-400">
            {documentTitle}
          </h2>
          {documentSubtitle && (
            <p className="text-[12px] font-semibold text-slate-700 mt-1">
              {documentSubtitle}
            </p>
          )}
          {academicYear && (
            <p className="text-[12px] font-bold text-slate-800 mt-0.5">
              {toBanglaDigits(academicYear)}
            </p>
          )}
        </div>
      )}
    </header>
  );
};

interface A4SignaturesFooterProps {
  leftTitle?: string;
  middleTitle?: string;
  rightTitle?: string;
  leftName?: string;
  rightName?: string;
  dateText?: string;
  showSeal?: boolean;
}

/**
 * Standard A4 Official Signatures Footer Block
 */
export const A4SignaturesFooter: React.FC<A4SignaturesFooterProps> = ({
  leftTitle,
  middleTitle,
  rightTitle,
  leftName,
  rightName,
  dateText,
  showSeal = true,
}) => {
  const docSettings = getStoredDocSettings();
  const effectiveLeftTitle = leftTitle || 'প্রস্তুতকারী / শিক্ষক';
  const effectiveMiddleTitle = middleTitle || docSettings.headOfDeptTitle || 'যাচাইকারী / বিভাগীয় প্রধান';
  const effectiveRightTitle = rightTitle || docSettings.principalTitle || 'অধ্যক্ষ';
  const effectiveRightName = rightName ?? docSettings.principalName;
  const effectiveLeftName = leftName ?? docSettings.examControllerName;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 print-avoid-break select-text">
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Left Signature */}
        <div className="flex flex-col items-center">
          <div className="w-32 sm:w-40 border-b border-dashed border-slate-500 mb-1.5 h-7" />
          <p className="text-[11px] font-bold text-slate-900">{effectiveLeftTitle}</p>
          {effectiveLeftName && <p className="text-[10px] text-slate-600 font-medium">{effectiveLeftName}</p>}
        </div>

        {/* Middle Signature */}
        <div className="flex flex-col items-center">
          <div className="w-32 sm:w-40 border-b border-dashed border-slate-500 mb-1.5 h-7" />
          <p className="text-[11px] font-bold text-slate-900">{effectiveMiddleTitle}</p>
          {dateText && <p className="text-[10px] text-slate-500">তারিখ: {dateText}</p>}
        </div>

        {/* Right Signature / Principal */}
        <div className="flex flex-col items-center relative">
          <div className="w-32 sm:w-40 border-b border-dashed border-slate-500 mb-1.5 h-7" />
          <p className="text-[11px] font-bold text-slate-900">{effectiveRightTitle}</p>
          {effectiveRightName && <p className="text-[10px] font-bold text-slate-700">{effectiveRightName}</p>}
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
        <span>সফটওয়্যার জেনারেটেড অফিসিয়াল ডকুমেন্ট • DPIB RESULT ZONE</span>
        <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
      </div>
    </div>
  );
};

interface A4DocumentEngineProps {
  documentTitle: string;
  documentSubtitle?: string;
  academicYear?: string;
  children: React.ReactNode;
  showSignatures?: boolean;
  signaturesConfig?: A4SignaturesFooterProps;
  customSettings?: Partial<DocumentSettings>;
  availableTemplates?: DocumentTemplateStyle[];
  defaultTemplate?: DocumentTemplateStyle;
  onTemplateChange?: (tpl: DocumentTemplateStyle) => void;
  actionButtons?: React.ReactNode;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  hideDefaultHeader?: boolean;
  onBeforePrint?: (proceed: () => void) => void;
  onBeforeDownloadPdf?: (proceed: () => void) => void;
}

/**
 * Universal Centralized A4 Document Engine.
 * Provides live zoom preview, PDF generation via html2canvas+jsPDF, and direct A4 print layout.
 */
export const A4DocumentEngine: React.FC<A4DocumentEngineProps> = ({
  documentTitle,
  documentSubtitle,
  academicYear,
  children,
  showSignatures = true,
  signaturesConfig,
  customSettings,
  availableTemplates = ['official', 'modern', 'compact'] as DocumentTemplateStyle[],
  defaultTemplate = 'official',
  onTemplateChange,
  actionButtons,
  fileName = 'dpib-document',
  orientation = 'portrait',
  hideDefaultHeader = false,
  onBeforePrint,
  onBeforeDownloadPdf,
}) => {
  const [template, setTemplate] = useState<DocumentTemplateStyle>(defaultTemplate);
  const [zoom, setZoom] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);
  const settings = { ...DEFAULT_DOCUMENT_SETTINGS, ...customSettings };

  const handleTemplateSelect = (tpl: DocumentTemplateStyle) => {
    setTemplate(tpl);
    if (onTemplateChange) onTemplateChange(tpl);
  };

  const executePrint = () => {
    printElementById('printable-a4-document', {
      title: fileName || documentTitle || 'DPIB Document',
      orientation: orientation as 'portrait' | 'landscape',
      onStart: () => setIsPrinting(true),
      onComplete: () => {
        setIsPrinting(false);
      },
      onError: (err) => {
        console.error('Print trigger failed:', err);
        setIsPrinting(false);
      },
    });
  };

  const handlePrint = () => {
    if (onBeforePrint) {
      onBeforePrint(() => executePrint());
    } else {
      executePrint();
    }
  };

  const executeDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('printable-a4-document');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const imgWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`${fileName}-${Date.now()}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('পিডিএফ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    handlePrint();
  };

  const isLandscape = orientation === 'landscape';

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
        {/* Template Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-teal-700" />
            টেমপ্লেট:
          </span>
          {availableTemplates.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTemplateSelect(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                template === t
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t === 'official' && 'অফিসিয়াল স্ট্যান্ডার্ড'}
              {t === 'modern' && 'মডার্ন ক্লিন'}
              {t === 'compact' && 'কমপ্যাক্ট শিট'}
            </button>
          ))}
        </div>

        {/* Zoom & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="জুম আউট"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold font-mono px-1 text-slate-700">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(130, prev + 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="জুম ইন"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(isLandscape ? 75 : 85)}
              className="px-2 py-0.5 text-[10px] font-bold text-teal-700 hover:text-teal-900 rounded hover:bg-white transition-colors cursor-pointer"
              title="স্ক্রিন ফিট"
            >
              ফিট
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 rounded hover:bg-white transition-colors cursor-pointer"
              title="১০০%"
            >
              ১০০%
            </button>
          </div>

          {actionButtons}

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>{isGeneratingPdf ? 'পিডিএফ প্রস্তুত হচ্ছে...' : 'পিডিএফ ডাউনলোড'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-wait"
          >
            <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-bounce' : ''}`} />
            <span>{isPrinting ? 'প্রিন্ট ডায়ালগ ওপেন হচ্ছে...' : 'প্রিন্ট করুন'}</span>
          </button>
        </div>
      </div>

      {pdfSuccess && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>পিডিএফ ফাইলটি সফলভাবে ডাউনলোড করা হয়েছে।</span>
        </div>
      )}

      {/* A4 Canvas Container with Full Scrollable Responsive Preview */}
      <div className="w-full overflow-x-auto pb-12 pt-2 custom-scrollbar">
        <div className="min-w-fit mx-auto flex justify-center px-2">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              marginBottom: zoom > 100 ? `${(zoom - 100) * 8}px` : undefined,
            }}
            className="transition-transform duration-200"
          >
            {/* The Printable A4 Sheet */}
            <div
              id="printable-a4-document"
              ref={documentRef}
              className={`${
                isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
              } bg-white mx-auto text-slate-950 font-bengali p-[12mm] sm:p-[14mm] border border-slate-300 shadow-xl print:shadow-none print:border-none relative flex flex-col justify-between select-text ${
                template === 'compact' ? 'text-[11px] p-[8mm] sm:p-[10mm]' : 'text-[12px]'
              }`}
            >
            {/* Content Container */}
            <div className="w-full">
              {/* Header (unless explicitly hidden) */}
              {!hideDefaultHeader && (
                <A4InstituteHeader
                  documentTitle={documentTitle}
                  documentSubtitle={documentSubtitle}
                  academicYear={academicYear}
                  customSettings={customSettings}
                  template={template}
                />
              )}

              {/* Document Dynamic Content */}
              <div className={!hideDefaultHeader ? 'mt-3' : ''}>{children}</div>
            </div>

            {/* Footer Signatures */}
            {showSignatures && (
              <div className="w-full">
                <A4SignaturesFooter {...signaturesConfig} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Layers,
  Upload,
  Check,
  AlertCircle,
  Eye,
  RefreshCw,
  Plus,
  ArrowLeft,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import {
  ReusableCustomizerTemplate,
  CustomizerPrintArea,
  validatePrintArea,
  validateAssetUrl,
  getFrontBodyAsset,
  getFrontTrimAsset,
  getBackBodyAsset,
  getBackTrimAsset,
  getFrontPrintArea,
  getBackPrintArea,
  normalizeLayersFromFlatAssets,
  REUSABLE_TEMPLATES,
} from '@/lib/customizerTemplates';

export default function CustomizerTemplatesAdminPage() {
  const [templates, setTemplates] = useState<ReusableCustomizerTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('polo-v1');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for currently selected template
  const [formName, setFormName] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formActive, setFormActive] = useState(true);
  const [formSupportsBack, setFormSupportsBack] = useState(true);
  const [formFrontBodyUrl, setFormFrontBodyUrl] = useState('');
  const [formFrontTrimUrl, setFormFrontTrimUrl] = useState('');
  const [formBackBodyUrl, setFormBackBodyUrl] = useState('');
  const [formBackTrimUrl, setFormBackTrimUrl] = useState('');

  // Front Print Area
  const [frontPrintX, setFrontPrintX] = useState<number>(0.29);
  const [frontPrintY, setFrontPrintY] = useState<number>(0.224);
  const [frontPrintW, setFrontPrintW] = useState<number>(0.42);
  const [frontPrintH, setFrontPrintH] = useState<number>(0.52);

  // Back Print Area
  const [backPrintX, setBackPrintX] = useState<number>(0.29);
  const [backPrintY, setBackPrintY] = useState<number>(0.224);
  const [backPrintW, setBackPrintW] = useState<number>(0.42);
  const [backPrintH, setBackPrintH] = useState<number>(0.52);

  // File input refs
  const frontBodyFileRef = useRef<HTMLInputElement>(null);
  const frontTrimFileRef = useRef<HTMLInputElement>(null);
  const backBodyFileRef = useRef<HTMLInputElement>(null);
  const backTrimFileRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;

  // Fetch templates from API on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products/customizer-templates?all=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setTemplates(data.data);
        loadTemplateIntoForm(data.data.find((t: any) => t.id === selectedId) || data.data[0]);
      } else {
        // Fallback to built-in templates
        const defaultList = Object.values(REUSABLE_TEMPLATES);
        setTemplates(defaultList);
        loadTemplateIntoForm(defaultList.find((t) => t.id === selectedId) || defaultList[0]);
      }
    } catch {
      const defaultList = Object.values(REUSABLE_TEMPLATES);
      setTemplates(defaultList);
      loadTemplateIntoForm(defaultList.find((t) => t.id === selectedId) || defaultList[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateIntoForm = (template: ReusableCustomizerTemplate) => {
    setSelectedId(template.id);
    setFormName(template.name);
    setFormVersion(template.version || '1.0');
    setFormActive(template.active !== false);
    setFormSupportsBack(template.supportsBack !== false);

    const fBody = getFrontBodyAsset(template);
    const fTrim = getFrontTrimAsset(template);
    const bBody = getBackBodyAsset(template);
    const bTrim = getBackTrimAsset(template);

    setFormFrontBodyUrl(fBody?.assetUrl || '');
    setFormFrontTrimUrl(fTrim?.assetUrl || '');
    setFormBackBodyUrl(bBody?.assetUrl || '');
    setFormBackTrimUrl(bTrim?.assetUrl || '');

    const fArea = getFrontPrintArea(template);
    if (fArea) {
      setFrontPrintX(fArea.x);
      setFrontPrintY(fArea.y);
      setFrontPrintW(fArea.width <= 1 ? fArea.width : fArea.width / 500);
      setFrontPrintH(fArea.height <= 1 ? fArea.height : fArea.height / 500);
    }

    const bArea = getBackPrintArea(template);
    if (bArea) {
      setBackPrintX(bArea.x);
      setBackPrintY(bArea.y);
      setBackPrintW(bArea.width <= 1 ? bArea.width : bArea.width / 500);
      setBackPrintH(bArea.height <= 1 ? bArea.height : bArea.height / 500);
    }

    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectTemplate = (id: string) => {
    const t = templates.find((item) => item.id === id);
    if (t) {
      loadTemplateIntoForm(t);
    }
  };

  // Upload handler for transparent PNG mockup layers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'frontBody' | 'frontTrim' | 'backBody' | 'backTrim') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      setErrorMessage('Template mockup assets must be transparent PNG files.');
      return;
    }

    setUploadingField(field);
    setErrorMessage(null);

    try {
      const url = await uploadToCloudinary(file);
      const urlCheck = validateAssetUrl(url);
      if (!urlCheck.valid) {
        throw new Error(urlCheck.error);
      }

      if (field === 'frontBody') setFormFrontBodyUrl(url);
      if (field === 'frontTrim') setFormFrontTrimUrl(url);
      if (field === 'backBody') setFormBackBodyUrl(url);
      if (field === 'backTrim') setFormBackTrimUrl(url);

      setSuccessMessage('Mockup asset uploaded to Cloudinary successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload asset.');
    } finally {
      setUploadingField(null);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  // Save template handler
  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      // Validate URLs
      const urls = [
        { label: 'Front Body', url: formFrontBodyUrl },
        { label: 'Front Trim', url: formFrontTrimUrl },
        { label: 'Back Body', url: formBackBodyUrl },
        { label: 'Back Trim', url: formBackTrimUrl },
      ];
      for (const item of urls) {
        const check = validateAssetUrl(item.url);
        if (!check.valid) {
          throw new Error(`${item.label}: ${check.error}`);
        }
      }

      // Validate Print Areas
      const frontAreaDef: CustomizerPrintArea = {
        templateId: selectedId,
        side: 'front',
        x: frontPrintX,
        y: frontPrintY,
        width: frontPrintW,
        height: frontPrintH,
        top: `${(frontPrintY * 100).toFixed(1)}%`,
        left: `${(frontPrintX * 100).toFixed(1)}%`,
        styleWidth: `${(frontPrintW * 100).toFixed(1)}%`,
        styleHeight: `${(frontPrintH * 100).toFixed(1)}%`,
        label: `Print Area (${Math.round(frontPrintW * 100)}% × ${Math.round(frontPrintH * 100)}%)`,
        guideText: 'Add your logo or artwork',
      };
      const frontCheck = validatePrintArea(frontAreaDef);
      if (!frontCheck.valid) {
        throw new Error(`Front Print Area Error: ${frontCheck.error}`);
      }

      const printAreas: CustomizerPrintArea[] = [frontAreaDef];

      if (formSupportsBack) {
        const backAreaDef: CustomizerPrintArea = {
          templateId: selectedId,
          side: 'back',
          x: backPrintX,
          y: backPrintY,
          width: backPrintW,
          height: backPrintH,
          top: `${(backPrintY * 100).toFixed(1)}%`,
          left: `${(backPrintX * 100).toFixed(1)}%`,
          styleWidth: `${(backPrintW * 100).toFixed(1)}%`,
          styleHeight: `${(backPrintH * 100).toFixed(1)}%`,
          label: `Back Print Area (${Math.round(backPrintW * 100)}% × ${Math.round(backPrintH * 100)}%)`,
          guideText: 'Add your rear artwork',
        };
        const backCheck = validatePrintArea(backAreaDef);
        if (!backCheck.valid) {
          throw new Error(`Back Print Area Error: ${backCheck.error}`);
        }
        printAreas.push(backAreaDef);
      }

      const layers = normalizeLayersFromFlatAssets(selectedId, {
        frontBodyUrl: formFrontBodyUrl,
        frontTrimUrl: formFrontTrimUrl,
        backBodyUrl: formBackBodyUrl,
        backTrimUrl: formBackTrimUrl,
        supportsBack: formSupportsBack,
      });

      const payload = {
        name: formName.trim(),
        version: formVersion.trim(),
        active: formActive,
        supportsBack: formSupportsBack,
        layers,
        printAreas,
      };

      const res = await fetch(`${API_URL}/products/customizer-templates/${selectedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save template');
      }

      setSuccessMessage('Template saved successfully!');
      // Update local state
      setTemplates((prev) => prev.map((t) => (t.id === selectedId ? data.data : t)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Create new version handler (e.g. Polo v2)
  const handleCreateVersion = async () => {
    const nextVer = (parseFloat(formVersion) || 1.0) + 1.0;
    const nextVerStr = nextVer.toFixed(1);
    const baseId = selectedId.replace(/-v\d+(\.\d+)?$/, '');
    const newId = `${baseId}-v${Math.floor(nextVer)}`;

    const promptId = window.prompt(`Enter unique ID for new version:`, newId);
    if (!promptId || !promptId.trim()) return;

    setLoading(true);
    try {
      const payload = {
        id: promptId.trim(),
        name: `${formName} (v${nextVerStr})`,
        version: nextVerStr,
        active: true,
        supportsBack: formSupportsBack,
        layers: normalizeLayersFromFlatAssets(promptId.trim(), {
          frontBodyUrl: formFrontBodyUrl,
          frontTrimUrl: formFrontTrimUrl,
          backBodyUrl: formBackBodyUrl,
          backTrimUrl: formBackTrimUrl,
          supportsBack: formSupportsBack,
        }),
        printAreas: [
          {
            templateId: promptId.trim(),
            side: 'front',
            x: frontPrintX,
            y: frontPrintY,
            width: frontPrintW,
            height: frontPrintH,
          },
          ...(formSupportsBack
            ? [
                {
                  templateId: promptId.trim(),
                  side: 'back',
                  x: backPrintX,
                  y: backPrintY,
                  width: backPrintW,
                  height: backPrintH,
                },
              ]
            : []),
        ],
      };

      const res = await fetch(`${API_URL}/products/customizer-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create template version');
      }

      setTemplates((prev) => [...prev, data.data]);
      loadTemplateIntoForm(data.data);
      setSuccessMessage(`Version ${nextVerStr} created with ID '${data.data.id}'! Previous version remains intact.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create new version');
    } finally {
      setLoading(false);
    }
  };

  // Preview layer URLs and print area for active preview side
  const activeBodyUrl = previewSide === 'front' ? formFrontBodyUrl : formBackBodyUrl;
  const activeTrimUrl = previewSide === 'front' ? formFrontTrimUrl : formBackTrimUrl;
  const activeX = previewSide === 'front' ? frontPrintX : backPrintX;
  const activeY = previewSide === 'front' ? frontPrintY : backPrintY;
  const activeW = previewSide === 'front' ? frontPrintW : backPrintW;
  const activeH = previewSide === 'front' ? frontPrintH : backPrintH;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/products"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-teal" /> Customizer Template Assets
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phase 2 Reusable Foundation: Configure transparent PNG mockup layers, trim masks, and normalized print areas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTemplates}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleCreateVersion}
            data-cy="create-version-btn"
            className="px-3.5 py-2 text-xs font-semibold text-brand-teal bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Version
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-cy="save-template-btn"
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Template
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {errorMessage && (
        <div
          data-cy="template-error-message"
          className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div
          data-cy="template-success-message"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Template Selector Bar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex-shrink-0">
            Selected Template:
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            data-cy="template-select"
            className="w-full md:w-72 text-sm font-semibold border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-slate-50 py-1.5"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id}) — v{t.version || '1.0'} {t.active ? '● Active' : '○ Inactive'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              data-cy="template-active-toggle"
              className="w-4 h-4 text-brand-teal rounded border-slate-300 focus:ring-teal-500"
            />
            Template Active
          </label>
          <span className="text-xs text-slate-400">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Version:</span>
            <input
              type="text"
              value={formVersion}
              onChange={(e) => setFormVersion(e.target.value)}
              data-cy="template-version-input"
              className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-slate-50 font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Configuration Form (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Transparent PNG Requirement Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent PNG Requirement:</span> Template mockup assets must be transparent PNGs. Do NOT use opaque background photos or standard product gallery photos.
            </div>
          </div>

          {/* FRONT ASSETS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> FRONT ASSETS
              </h2>
              <span className="text-xs text-slate-400">Side: FRONT</span>
            </div>

            {/* Front Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Front Body Mockup (Transparent PNG)</span>
                {formFrontBodyUrl && (
                  <button
                    type="button"
                    onClick={() => setFormFrontBodyUrl('')}
                    className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formFrontBodyUrl}
                  onChange={(e) => setFormFrontBodyUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../front-body.png"
                  data-cy="front-body-url"
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                />
                <input
                  type="file"
                  ref={frontBodyFileRef}
                  accept="image/png"
                  onChange={(e) => handleFileUpload(e, 'frontBody')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontBodyFileRef.current?.click()}
                  disabled={uploadingField === 'frontBody'}
                  data-cy="front-body-upload"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingField === 'frontBody' ? 'Uploading...' : formFrontBodyUrl ? 'Replace' : 'Upload PNG'}
                </button>
              </div>
            </div>

            {/* Front Trim */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Front Collar / Rib / Trim Mask (Transparent PNG)</span>
                {formFrontTrimUrl && (
                  <button
                    type="button"
                    onClick={() => setFormFrontTrimUrl('')}
                    className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formFrontTrimUrl}
                  onChange={(e) => setFormFrontTrimUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../front-trim.png"
                  data-cy="front-trim-url"
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                />
                <input
                  type="file"
                  ref={frontTrimFileRef}
                  accept="image/png"
                  onChange={(e) => handleFileUpload(e, 'frontTrim')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontTrimFileRef.current?.click()}
                  disabled={uploadingField === 'frontTrim'}
                  data-cy="front-trim-upload"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingField === 'frontTrim' ? 'Uploading...' : formFrontTrimUrl ? 'Replace' : 'Upload PNG'}
                </button>
              </div>
            </div>
          </div>

          {/* BACK ASSETS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">BACK ASSETS</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSupportsBack}
                  onChange={(e) => setFormSupportsBack(e.target.checked)}
                  data-cy="back-enabled-toggle"
                  className="w-4 h-4 text-brand-teal rounded border-slate-300 focus:ring-teal-500"
                />
                Enable Back Customization
              </label>
            </div>

            {formSupportsBack ? (
              <>
                {/* Back Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Back Body Mockup (Transparent PNG)</span>
                    {formBackBodyUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBackBodyUrl('')}
                        className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formBackBodyUrl}
                      onChange={(e) => setFormBackBodyUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../back-body.png"
                      data-cy="back-body-url"
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                    />
                    <input
                      type="file"
                      ref={backBodyFileRef}
                      accept="image/png"
                      onChange={(e) => handleFileUpload(e, 'backBody')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backBodyFileRef.current?.click()}
                      disabled={uploadingField === 'backBody'}
                      data-cy="back-body-upload"
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === 'backBody' ? 'Uploading...' : formBackBodyUrl ? 'Replace' : 'Upload PNG'}
                    </button>
                  </div>
                </div>

                {/* Back Trim */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Back Collar / Rib / Trim Mask (Transparent PNG)</span>
                    {formBackTrimUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBackTrimUrl('')}
                        className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formBackTrimUrl}
                      onChange={(e) => setFormBackTrimUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../back-trim.png"
                      data-cy="back-trim-url"
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                    />
                    <input
                      type="file"
                      ref={backTrimFileRef}
                      accept="image/png"
                      onChange={(e) => handleFileUpload(e, 'backTrim')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backTrimFileRef.current?.click()}
                      disabled={uploadingField === 'backTrim'}
                      data-cy="back-trim-upload"
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === 'backTrim' ? 'Uploading...' : formBackTrimUrl ? 'Replace' : 'Upload PNG'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                Back customization is disabled for this template. Only the Front view is active.
              </p>
            )}
          </div>

          {/* PRINT AREAS (NORMALIZED 0..1) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                PRINT AREAS (NORMALIZED 0..1 COORDINATES)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Coordinates must be numbers between 0 and 1. Do not use fixed pixel values.
              </p>
            </div>

            {/* Front Print Area Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Front Printable Area</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Left: {(frontPrintX * 100).toFixed(1)}% | Top: {(frontPrintY * 100).toFixed(1)}% | Width: {(frontPrintW * 100).toFixed(1)}% | Height: {(frontPrintH * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">X (0..1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={frontPrintX}
                    onChange={(e) => setFrontPrintX(parseFloat(e.target.value) || 0)}
                    data-cy="front-print-x"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Y (0..1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={frontPrintY}
                    onChange={(e) => setFrontPrintY(parseFloat(e.target.value) || 0)}
                    data-cy="front-print-y"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Width (0..1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1"
                    value={frontPrintW}
                    onChange={(e) => setFrontPrintW(parseFloat(e.target.value) || 0)}
                    data-cy="front-print-w"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Height (0..1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1"
                    value={frontPrintH}
                    onChange={(e) => setFrontPrintH(parseFloat(e.target.value) || 0)}
                    data-cy="front-print-h"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Back Print Area Controls */}
            {formSupportsBack && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Back Printable Area</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Left: {(backPrintX * 100).toFixed(1)}% | Top: {(backPrintY * 100).toFixed(1)}% | Width: {(backPrintW * 100).toFixed(1)}% | Height: {(backPrintH * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">X (0..1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={backPrintX}
                      onChange={(e) => setBackPrintX(parseFloat(e.target.value) || 0)}
                      data-cy="back-print-x"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Y (0..1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={backPrintY}
                      onChange={(e) => setBackPrintY(parseFloat(e.target.value) || 0)}
                      data-cy="back-print-y"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Width (0..1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1"
                      value={backPrintW}
                      onChange={(e) => setBackPrintW(parseFloat(e.target.value) || 0)}
                      data-cy="back-print-w"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Height (0..1)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1"
                      value={backPrintH}
                      onChange={(e) => setBackPrintH(parseFloat(e.target.value) || 0)}
                      data-cy="back-print-h"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Live Admin Asset Preview (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand-teal" /> ADMIN ASSET PREVIEW
              </h2>
              {/* Preview Side Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewSide('front')}
                  data-cy="preview-tab-front"
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    previewSide === 'front'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Front
                </button>
                {formSupportsBack && (
                  <button
                    type="button"
                    onClick={() => setPreviewSide('back')}
                    data-cy="preview-tab-back"
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      previewSide === 'back'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Stage */}
            <div
              data-cy="admin-template-preview"
              className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                  linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                  linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Layer 1: Body PNG */}
              {activeBodyUrl ? (
                <img
                  src={activeBodyUrl}
                  alt={`${previewSide} body layer`}
                  data-cy="preview-body-layer"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ zIndex: 1 }}
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No {previewSide} body mockup uploaded
                </div>
              )}

              {/* Layer 2: Trim PNG */}
              {activeTrimUrl && (
                <img
                  src={activeTrimUrl}
                  alt={`${previewSide} trim layer`}
                  data-cy="preview-trim-layer"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ zIndex: 2 }}
                />
              )}

              {/* Layer 3: Printable Area Guide Overlay */}
              <div
                data-cy="preview-print-area"
                className="absolute border-2 border-dashed border-cyan-500 bg-cyan-500/15 flex items-center justify-center text-center rounded pointer-events-none transition-all duration-150"
                style={{
                  left: `${(activeX * 100).toFixed(2)}%`,
                  top: `${(activeY * 100).toFixed(2)}%`,
                  width: `${(activeW * 100).toFixed(2)}%`,
                  height: `${(activeH * 100).toFixed(2)}%`,
                  zIndex: 10,
                }}
              >
                <div className="bg-slate-900/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                  Printable Area ({(activeW * 100).toFixed(0)}% × {(activeH * 100).toFixed(0)}%)
                </div>
              </div>
            </div>

            {/* Helper note */}
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>
                <strong>Layer Stack:</strong> Body Layer (Z-1) &rarr; Trim / Rib Mask (Z-2) &rarr; Printable Area (Z-10).
              </p>
              <p className="text-slate-400">
                This is a configuration preview only. Customer color tinting will be rendered in Phase 3.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

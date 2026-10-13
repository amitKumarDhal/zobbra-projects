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
  Moon,
  Sun,
  Grid,
  Palette,
  Sparkles,
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import {
  ReusableCustomizerTemplate,
  CustomizerPrintArea,
  validatePrintArea,
  validateAssetUrl,
  getFrontBaseAsset,
  getFrontBodyAsset,
  getFrontTrimAsset,
  getBackBaseAsset,
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
  const [formFrontBaseUrl, setFormFrontBaseUrl] = useState('');
  const [formFrontBodyUrl, setFormFrontBodyUrl] = useState('');
  const [formFrontTrimUrl, setFormFrontTrimUrl] = useState('');
  const [formBackBaseUrl, setFormBackBaseUrl] = useState('');
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

  // Canvas Preview Options (high-contrast defaults for white garments)
  const [bgMode, setBgMode] = useState<'dark-grid' | 'light-grid' | 'dark' | 'studio'>('dark-grid');
  const [testTint, setTestTint] = useState<string>('#FFFFFF');
  const [inspectMode, setInspectMode] = useState<'composite' | 'xray'>('composite');

  // File input refs
  const frontBaseFileRef = useRef<HTMLInputElement>(null);
  const frontBodyFileRef = useRef<HTMLInputElement>(null);
  const frontTrimFileRef = useRef<HTMLInputElement>(null);
  const backBaseFileRef = useRef<HTMLInputElement>(null);
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

    const fBase = getFrontBaseAsset(template);
    const fBody = getFrontBodyAsset(template);
    const fTrim = getFrontTrimAsset(template);
    const bBase = getBackBaseAsset(template);
    const bBody = getBackBodyAsset(template);
    const bTrim = getBackTrimAsset(template);

    setFormFrontBaseUrl(fBase?.assetUrl || '');
    setFormFrontBodyUrl(fBody?.assetUrl || '');
    setFormFrontTrimUrl(fTrim?.assetUrl || '');
    setFormBackBaseUrl(bBase?.assetUrl || '');
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

  // Upload handler for template mockup and base photo layers
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'frontBase' | 'frontBody' | 'frontTrim' | 'backBase' | 'backBody' | 'backTrim'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('webp')) {
      setErrorMessage('Template assets must be PNG, JPEG, or WebP files.');
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

      if (field === 'frontBase') setFormFrontBaseUrl(url);
      if (field === 'frontBody') setFormFrontBodyUrl(url);
      if (field === 'frontTrim') setFormFrontTrimUrl(url);
      if (field === 'backBase') setFormBackBaseUrl(url);
      if (field === 'backBody') setFormBackBodyUrl(url);
      if (field === 'backTrim') setFormBackTrimUrl(url);

      setSuccessMessage('Mockup asset uploaded successfully.');
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
        { label: 'Front Base', url: formFrontBaseUrl },
        { label: 'Front Body', url: formFrontBodyUrl },
        { label: 'Front Trim', url: formFrontTrimUrl },
        { label: 'Back Base', url: formBackBaseUrl },
        { label: 'Back Body', url: formBackBodyUrl },
        { label: 'Back Trim', url: formBackTrimUrl },
      ];
      for (const item of urls) {
        if (!item.url) continue;
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
        frontBaseUrl: formFrontBaseUrl,
        frontBodyUrl: formFrontBodyUrl,
        frontTrimUrl: formFrontTrimUrl,
        backBaseUrl: formBackBaseUrl,
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
  const activeBaseUrl = previewSide === 'front' ? formFrontBaseUrl : formBackBaseUrl;
  const activeBodyUrl = previewSide === 'front' ? formFrontBodyUrl : formBackBodyUrl;
  const activeTrimUrl = previewSide === 'front' ? formFrontTrimUrl : formBackTrimUrl;
  const activeX = previewSide === 'front' ? frontPrintX : backPrintX;
  const activeY = previewSide === 'front' ? frontPrintY : backPrintY;
  const activeW = previewSide === 'front' ? frontPrintW : backPrintW;
  const activeH = previewSide === 'front' ? frontPrintH : backPrintH;

  const [baseImgFailed, setBaseImgFailed] = useState(false);
  const [bodyImgFailed, setBodyImgFailed] = useState(false);
  const [trimImgFailed, setTrimImgFailed] = useState(false);

  useEffect(() => {
    setBaseImgFailed(false);
    setBodyImgFailed(false);
    setTrimImgFailed(false);
  }, [activeBaseUrl, activeBodyUrl, activeTrimUrl, previewSide]);

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

            {/* Front Base Garment Photo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Z-0 BASE</span>
                  Front Base Garment Photo (Realistic Mockup / Canvas)
                </span>
                {formFrontBaseUrl && (
                  <button
                    type="button"
                    onClick={() => setFormFrontBaseUrl('')}
                    className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formFrontBaseUrl}
                  onChange={(e) => setFormFrontBaseUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../front-base.png or /images/templates/..."
                  data-cy="front-base-url"
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                />
                <input
                  type="file"
                  ref={frontBaseFileRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, 'frontBase')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontBaseFileRef.current?.click()}
                  disabled={uploadingField === 'frontBase'}
                  data-cy="front-base-upload"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingField === 'frontBase' ? 'Uploading...' : formFrontBaseUrl ? 'Replace' : 'Upload Image'}
                </button>
              </div>
            </div>

            {/* Front Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">Z-1 BODY</span>
                  Front Body Mockup / Mask (Transparent PNG)
                </span>
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
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Z-2 TRIM</span>
                  Front Collar / Rib / Trim Mask (Transparent PNG)
                </span>
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
                {/* Back Base Garment Photo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Z-0 BASE</span>
                      Back Base Garment Photo (Realistic Mockup / Canvas)
                    </span>
                    {formBackBaseUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBackBaseUrl('')}
                        className="text-rose-600 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formBackBaseUrl}
                      onChange={(e) => setFormBackBaseUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../back-base.png or /images/templates/..."
                      data-cy="back-base-url"
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                    />
                    <input
                      type="file"
                      ref={backBaseFileRef}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'backBase')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backBaseFileRef.current?.click()}
                      disabled={uploadingField === 'backBase'}
                      data-cy="back-base-upload"
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === 'backBase' ? 'Uploading...' : formBackBaseUrl ? 'Replace' : 'Upload Image'}
                    </button>
                  </div>
                </div>

                {/* Back Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">Z-1 BODY</span>
                      Back Body Mockup / Mask (Transparent PNG)
                    </span>
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
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Z-2 TRIM</span>
                      Back Collar / Rib / Trim Mask (Transparent PNG)
                    </span>
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
            {/* Header: Title, Mode & Side Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand-teal" /> ADMIN ASSET PREVIEW
              </h2>

              <div className="flex items-center gap-2">
                {/* Inspection Mode (Composite vs X-Ray) */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setInspectMode('composite')}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      inspectMode === 'composite'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Garment
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectMode('xray')}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      inspectMode === 'xray'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    X-Ray Masks
                  </button>
                </div>

                {/* Preview Side Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewSide('front')}
                    data-cy="preview-tab-front"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
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
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
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
            </div>

            {/* Stage Backdrop Contrast Bar */}
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-slate-500" /> Canvas Backdrop:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBgMode('dark-grid')}
                  title="Dark Checkerboard (High contrast for white garments)"
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 ${
                    bgMode === 'dark-grid'
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Moon className="w-3 h-3" /> Dark Grid
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('light-grid')}
                  title="Light Checkerboard"
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 ${
                    bgMode === 'light-grid'
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Grid className="w-3 h-3" /> Light Grid
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('dark')}
                  title="Solid Dark Stage"
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 ${
                    bgMode === 'dark'
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('studio')}
                  title="Studio Neutral Gray"
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 ${
                    bgMode === 'studio'
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sun className="w-3 h-3" /> Studio
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div
              data-cy="admin-template-preview"
              className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-400/40 shadow-inner flex items-center justify-center transition-colors duration-200"
              style={
                bgMode === 'dark-grid'
                  ? {
                      backgroundColor: '#0f172a',
                      backgroundImage: `
                        linear-gradient(45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1e293b 75%),
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                      `,
                      backgroundSize: '24px 24px',
                      backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
                    }
                  : bgMode === 'light-grid'
                    ? {
                        backgroundColor: '#ffffff',
                        backgroundImage: `
                          linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
                          linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
                          linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)
                        `,
                        backgroundSize: '24px 24px',
                        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
                      }
                    : bgMode === 'dark'
                      ? {
                          backgroundColor: '#090d16',
                          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #090d16 100%)',
                        }
                      : {
                          backgroundColor: '#f1f5f9',
                          backgroundImage: 'radial-gradient(circle at 50% 35%, #ffffff 0%, #cbd5e1 100%)',
                        }
              }
            >
              {/* X-Ray Mask Inspection Mode */}
              {inspectMode === 'xray' ? (
                <>
                  {/* Subtle Base garment outline in background */}
                  {activeBaseUrl && !baseImgFailed && (
                    <img
                      src={activeBaseUrl}
                      alt={`${previewSide} base reference`}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-25"
                      style={{ zIndex: 1 }}
                    />
                  )}

                  {/* Body Mask in highlighted cyan overlay */}
                  {activeBodyUrl && !bodyImgFailed ? (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{
                        backgroundColor: '#06b6d4',
                        WebkitMaskImage: `url(${activeBodyUrl})`,
                        maskImage: `url(${activeBodyUrl})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        opacity: 0.85,
                        zIndex: 2,
                      }}
                    />
                  ) : null}

                  {/* Trim Mask in highlighted amber overlay */}
                  {activeTrimUrl && !trimImgFailed ? (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{
                        backgroundColor: '#f59e0b',
                        WebkitMaskImage: `url(${activeTrimUrl})`,
                        maskImage: `url(${activeTrimUrl})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        opacity: 0.9,
                        zIndex: 3,
                      }}
                    />
                  ) : null}
                </>
              ) : (
                /* Composite Garment Preview Mode */
                <>
                  {/* Layer 0: Photorealistic Base Garment Photo */}
                  {activeBaseUrl && !baseImgFailed ? (
                    <img
                      src={activeBaseUrl}
                      alt={`${previewSide} base layer`}
                      data-cy="preview-base-layer"
                      onError={() => setBaseImgFailed(true)}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xl"
                      style={{ zIndex: 1 }}
                    />
                  ) : null}

                  {/* Layer 1: Body Tint Recolor Overlay (Multiply blend over base) */}
                  {activeBaseUrl && !baseImgFailed && activeBodyUrl && !bodyImgFailed && testTint !== '#FFFFFF' ? (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{
                        backgroundColor: testTint,
                        WebkitMaskImage: `url(${activeBodyUrl})`,
                        maskImage: `url(${activeBodyUrl})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        mixBlendMode: 'multiply',
                        opacity: 0.92,
                        zIndex: 2,
                      }}
                    />
                  ) : null}

                  {/* Fallback when NO base photo exists: Render Body Mockup directly with drop shadow */}
                  {(!activeBaseUrl || baseImgFailed) && activeBodyUrl && !bodyImgFailed ? (
                    <img
                      src={activeBodyUrl}
                      alt={`${previewSide} body layer`}
                      data-cy="preview-body-layer"
                      onError={() => setBodyImgFailed(true)}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                      style={{ zIndex: 1 }}
                    />
                  ) : null}

                  {/* Layer 2: Trim PNG Overlay */}
                  {activeTrimUrl && !trimImgFailed && (
                    <img
                      src={activeTrimUrl}
                      alt={`${previewSide} trim layer`}
                      data-cy="preview-trim-layer"
                      onError={() => setTrimImgFailed(true)}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ zIndex: 3 }}
                    />
                  )}

                  {/* Empty state warning if no images loaded */}
                  {!activeBaseUrl && !activeBodyUrl && (
                    <div className="text-center p-6 text-slate-400 text-xs z-[1]">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {`No ${previewSide} mockup or base image uploaded yet`}
                    </div>
                  )}
                </>
              )}

              {/* Layer 3: Printable Area Guide Overlay */}
              <div
                data-cy="preview-print-area"
                className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/20 flex items-center justify-center text-center rounded pointer-events-none transition-all duration-150 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                style={{
                  left: `${(activeX * 100).toFixed(2)}%`,
                  top: `${(activeY * 100).toFixed(2)}%`,
                  width: `${(activeW * 100).toFixed(2)}%`,
                  height: `${(activeH * 100).toFixed(2)}%`,
                  zIndex: 10,
                }}
              >
                <div className="bg-slate-900/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Printable Area ({(activeW * 100).toFixed(0)}% × {(activeH * 100).toFixed(0)}%)
                </div>
              </div>
            </div>

            {/* Test Garment Color Swatches */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-teal" /> Test Garment Color:
                </span>
                <span className="font-mono text-[11px] text-slate-500">{testTint}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { name: 'White (Original)', hex: '#FFFFFF', isWhite: true },
                  { name: 'Navy Blue', hex: '#1E3A8A' },
                  { name: 'Charcoal Black', hex: '#1F2937' },
                  { name: 'Crimson Red', hex: '#DC2626' },
                  { name: 'Royal Blue', hex: '#2563EB' },
                  { name: 'Emerald Green', hex: '#16A34A' },
                  { name: 'Gold Amber', hex: '#D97706' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setTestTint(c.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      testTint === c.hex
                        ? 'ring-2 ring-brand-teal ring-offset-2 scale-110 border-white'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Layer Stack Status & Legend */}
            <div className="text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wide block text-[10px]">
                Active Preview Layers:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeBaseUrl && !baseImgFailed ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  ></span>
                  <span className="text-slate-600">
                    Z-0 Base Photo: <strong>{activeBaseUrl && !baseImgFailed ? 'Loaded' : 'None'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeBodyUrl && !bodyImgFailed ? 'bg-cyan-500' : 'bg-slate-300'
                    }`}
                  ></span>
                  <span className="text-slate-600">
                    Z-1 Body Mask: <strong>{activeBodyUrl && !bodyImgFailed ? 'Loaded' : 'None'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeTrimUrl && !trimImgFailed ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  ></span>
                  <span className="text-slate-600">
                    Z-2 Trim Mask: <strong>{activeTrimUrl && !trimImgFailed ? 'Loaded' : 'None'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-600">
                    Z-10 Print Area: <strong>Active</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

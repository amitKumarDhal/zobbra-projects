'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Trash2 } from 'lucide-react';
import { GarmentBackdrop, getBackdropImage, getColorHex, isLightColor } from './GarmentBackdrop';
import { getCustomizerTemplate, CustomizerTemplate, PrintableAreaConfig } from '../../lib/customizerTemplates';
import { uploadDataUrlToCloudinary, uploadToCloudinary } from '@/lib/upload';
import {
  STAGE_CANVAS_HEIGHT,
  STAGE_CANVAS_WIDTH,
  composeOverPhoto,
  getCustomizerSideImage,
  getCustomizerViews,
  getSideRecolor,
} from '@/lib/customizerViews';
import { renderRecolored } from '@/lib/photoRecolor';
import { getProductColors, getProductCollarColors } from '@/lib/productConfig';

export interface CustomizerCanvasRef {
  addText: (text: string, options?: { fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }) => void;
  addImage: (file: File) => Promise<string>;
  updateActiveObject: (updates: any) => void;
  deleteActiveObject: () => void;
  centerActiveH: () => void;
  centerActiveV: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  clearSide: () => void;
  switchSide: (side: 'front' | 'back') => void;
  getOriginalArtworkUrl: () => string | null;
  setOriginalArtworkUrl: (url: string | null) => void;
  isUploadingArtwork: () => boolean;
  waitForArtworkUpload: () => Promise<string | null>;
  exportPreviews: () => Promise<{
    frontDataUrl?: string;
    backDataUrl?: string;
    frontCanvasJson: string;
    backCanvasJson: string;
    hasFront: boolean;
    hasBack: boolean;
    frontCloudinaryUrl?: string;
    backCloudinaryUrl?: string;
  }>;
  getCanvasState: () => {
    frontJson: string;
    backJson: string;
    hasFront: boolean;
    hasBack: boolean;
  };
  loadDraftState: (frontJson?: string, backJson?: string, artworkUrl?: string) => void;
}

export interface CustomizerCanvasProps {
  selectedColor: string;
  collarColor?: string;
  category?: string;
  activeSide: 'front' | 'back';
  template?: CustomizerTemplate;
  product?: any;
  /** False when the admin turned the back off: the back can't be opened and never holds a design. */
  backEnabled?: boolean;
  onSideChange?: (side: 'front' | 'back') => void;
  onDesignChange?: (info: { hasFront: boolean; hasBack: boolean; activeSide: 'front' | 'back' }) => void;
  onSelectionChange?: (selectedObj: any) => void;
  onUploadStatusChange?: (status: { isUploading: boolean; error: string | null }) => void;
  initialFrontJson?: string;
  initialBackJson?: string;
  initialArtworkUrl?: string;
  innerRef?: any;
}

const EMPTY_CANVAS_JSON = JSON.stringify({ version: '5.3.0', objects: [] });

/**
 * Free placement: the Fabric canvas covers the whole product stage (the padding box of the 540px stage),
 * not just the legacy printable box. Stored object coordinates are unchanged - they stay relative to the
 * legacy box origin - and a viewport translation places that origin exactly where the box used to render.
 * Existing drafts/quotes therefore load and render as before with no migration.
 * (Stage size: STAGE_CANVAS_WIDTH x STAGE_CANVAS_HEIGHT from lib/customizerViews.)
 */

/** Where the legacy box's top-left sits inside the stage canvas (matches the old centered overlay). */
function legacyBoxOrigin(area: PrintableAreaConfig): { x: number; y: number } {
  const pct = (v: string) => parseFloat(v) / 100;
  return {
    x: (pct(area.left) + pct(area.styleWidth) / 2) * STAGE_CANVAS_WIDTH - area.width / 2,
    y: (pct(area.top) + pct(area.styleHeight) / 2) * STAGE_CANVAS_HEIGHT - area.height / 2,
  };
}

function applyStageGeometry(cvs: any, area: PrintableAreaConfig) {
  const origin = legacyBoxOrigin(area);
  cvs.setDimensions({ width: STAGE_CANVAS_WIDTH, height: STAGE_CANVAS_HEIGHT });
  cvs.setViewportTransform([1, 0, 0, 1, origin.x, origin.y]);
}

/**
 * Export crop in canvas pixels. Equals the legacy box exactly (identical output to before) unless an
 * object was moved outside it, in which case the crop grows to include it so nothing is silently cut.
 */
function previewCrop(cvs: any, area: PrintableAreaConfig) {
  const origin = legacyBoxOrigin(area);
  let minX = 0;
  let minY = 0;
  let maxX = area.width;
  let maxY = area.height;
  for (const obj of cvs.getObjects()) {
    const r = obj.getBoundingRect(true, true);
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.left + r.width);
    maxY = Math.max(maxY, r.top + r.height);
  }
  const TOLERANCE = 0.5;
  const insideBox =
    minX >= -TOLERANCE && minY >= -TOLERANCE && maxX <= area.width + TOLERANCE && maxY <= area.height + TOLERANCE;
  if (insideBox) {
    return { left: origin.x, top: origin.y, width: area.width, height: area.height };
  }
  const left = Math.max(0, Math.floor(origin.x + minX));
  const top = Math.max(0, Math.floor(origin.y + minY));
  const right = Math.min(STAGE_CANVAS_WIDTH, Math.ceil(origin.x + maxX));
  const bottom = Math.min(STAGE_CANVAS_HEIGHT, Math.ceil(origin.y + maxY));
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * Safely exports canvas to data URL, catching any browser SecurityError (e.g. tainted canvas)
 * and throwing a controlled user-friendly error instead of crashing React.
 */
export function safeExportCanvas(
  canvas: any,
  options: { format?: string; multiplier?: number; left?: number; top?: number; width?: number; height?: number } = { format: 'png', multiplier: 2 }
): string {
  if (!canvas) return '';
  try {
    canvas.renderAll();
    return canvas.toDataURL(options);
  } catch (err: any) {
    console.error('[CustomizerCanvas] Canvas export error:', err);
    if (err?.name === 'SecurityError' || (err?.message && err.message.toLowerCase().includes('tainted'))) {
      throw new Error('Unable to export the design preview. Please retry the artwork upload.');
    }
    throw err;
  }
}

/**
 * Normalizes canvas JSON to ensure all remote image objects have crossOrigin = 'anonymous'.
 * Also scrubs any residual data:image/ URIs if a valid CDN artwork URL is provided.
 */
export function normalizeCanvasJsonForCORS(jsonInput: string | any, cdnArtworkUrl?: string | null): any {
  if (!jsonInput) return jsonInput;
  try {
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : JSON.parse(JSON.stringify(jsonInput));
    const validCdn = (cdnArtworkUrl && !cdnArtworkUrl.startsWith('data:image/')) ? cdnArtworkUrl : '';

    const walk = (objs: any[]) => {
      for (const obj of objs) {
        if (!obj || typeof obj !== 'object') continue;
        if (obj.type === 'image' || obj.src !== undefined) {
          if (!obj.src || typeof obj.src !== 'string' || obj.src.startsWith('data:image/')) {
            if (validCdn) obj.src = validCdn;
          }
          // Enforce CORS crossOrigin on all image objects
          obj.crossOrigin = 'anonymous';
        }
        if (Array.isArray(obj.objects)) {
          walk(obj.objects);
        }
      }
    };

    if (Array.isArray(data.objects)) {
      walk(data.objects);
    }
    return data;
  } catch {
    return jsonInput;
  }
}

/**
 * Sanitizes canvas JSON to ensure NO image object contains a data:image/... base64 src.
 * Enforces crossOrigin = 'anonymous' on every image object for CORS-safe canvas rehydration.
 * If cdnArtworkUrl is provided, it replaces the base64 src with the CDN URL.
 */
export function sanitizeCanvasJson(jsonStr: string, cdnArtworkUrl?: string | null): string {
  if (!jsonStr) return jsonStr;
  try {
    const normalized = normalizeCanvasJsonForCORS(jsonStr, cdnArtworkUrl);
    const validCdn = (cdnArtworkUrl && !cdnArtworkUrl.startsWith('data:image/')) ? cdnArtworkUrl : '';

    let stringified = JSON.stringify(normalized);
    // Extra safety guard: replace any remaining data:image strings in the serialized output
    if (stringified.includes('data:image/')) {
      stringified = stringified.replace(/"data:image\/[^"]+"/g, JSON.stringify(validCdn));
    }
    return stringified;
  } catch (err) {
    console.warn('[CustomizerCanvas] sanitizeCanvasJson error:', err);
  }
  let fallback = typeof jsonStr === 'string' ? jsonStr : JSON.stringify(jsonStr);
  if (fallback.includes('data:image/')) {
    const validCdn = (cdnArtworkUrl && !cdnArtworkUrl.startsWith('data:image/')) ? cdnArtworkUrl : '';
    fallback = fallback.replace(/"data:image\/[^"]+"/g, JSON.stringify(validCdn));
  }
  return fallback;
}

export const CustomizerCanvas = forwardRef<CustomizerCanvasRef, CustomizerCanvasProps>(({
  selectedColor,
  collarColor,
  category,
  activeSide,
  template,
  product,
  backEnabled = true,
  onSideChange,
  onDesignChange,
  onSelectionChange,
  onUploadStatusChange,
  initialFrontJson,
  initialBackJson,
  initialArtworkUrl,
  innerRef,
}, ref) => {
  const resolvedRef = (ref as any) || innerRef;
  const resolvedTemplate = template || getCustomizerTemplate(product || { category: { name: category, slug: category } });
  const currentArea = activeSide === 'back' && resolvedTemplate.backPrintableArea
    ? resolvedTemplate.backPrintableArea
    : resolvedTemplate.frontPrintableArea;
  // Guide line/label contrast against the product body color.
  const guideOnLight = isLightColor(getColorHex(selectedColor));
  // A product photo has no known body colour, so its guide is white with a dark outline to read on any photo.
  const guideOverPhoto = Boolean(getBackdropImage(product, activeSide));

  const [fabricInstance, setFabricInstance] = useState<any>(null);
  const [canvas, setCanvas] = useState<any>(null);
  const [hasCurrentObjects, setHasCurrentObjects] = useState<boolean>(false);
  const isUploadingArtworkRef = useRef<boolean>(false);
  const artworkUploadPromiseRef = useRef<Promise<string> | null>(null);

  const fabricCanvasRef = useRef<any>(null);
  const fabricInstanceRef = useRef<any>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // Guarantee clean empty canvas state by default - zero pre-populated elements
  const frontJsonRef = useRef<string>(initialFrontJson || EMPTY_CANVAS_JSON);
  // A disabled back never carries a design, even one left in an older draft.
  const backJsonRef = useRef<string>((backEnabled && initialBackJson) || EMPTY_CANVAS_JSON);
  const backEnabledRef = useRef<boolean>(backEnabled);
  backEnabledRef.current = backEnabled;
  // Track the original uploaded artwork Cloudinary URL (first user image upload)
  const originalArtworkUrlRef = useRef<string | null>(initialArtworkUrl || null);

  const activeSideRef = useRef<'front' | 'back'>(activeSide);
  useEffect(() => {
    activeSideRef.current = activeSide;
  }, [activeSide]);
  const isSwitchingSideRef = useRef<boolean>(false);
  // Latest side requested while a switch (or export) was still loading; applied once it finishes.
  const pendingSideRef = useRef<'front' | 'back' | null>(null);

  // Initialize Fabric.js dynamically on client only
  useEffect(() => {
    let isMounted = true;

    async function initFabric() {
      if (typeof window === 'undefined' || !canvasElRef.current) return;
      try {
        const fabricMod = await import('fabric');
        const fabric = (fabricMod as any).fabric || fabricMod;
        if (!isMounted) return;

        // Configure CORS-safe image loading on Fabric.js 5.3.0
        if (fabric.Image && fabric.Image.prototype) {
          fabric.Image.prototype.crossOrigin = 'anonymous';
        }

        // Defensive patch: Guarantee fabric.Image.fromObject enforces crossOrigin = 'anonymous' for remote URLs
        if (fabric.Image && !(fabric.Image as any)._corsPatched) {
          (fabric.Image as any)._corsPatched = true;
          const originalFromObject = fabric.Image.fromObject;
          fabric.Image.fromObject = function(object: any, callback: any) {
            if (object && object.src && typeof object.src === 'string' && !object.src.startsWith('data:')) {
              object.crossOrigin = 'anonymous';
            }
            return originalFromObject.call(fabric.Image, object, callback);
          };
        }

        // Defensive patch: Default fabric.Image.fromURL to crossOrigin = 'anonymous' for remote URLs
        if (fabric.Image && !(fabric.Image as any)._fromUrlPatched) {
          (fabric.Image as any)._fromUrlPatched = true;
          const originalFromURL = fabric.Image.fromURL;
          fabric.Image.fromURL = function(url: string, callback: any, imgOptions: any) {
            const opts = { ...imgOptions };
            if (url && typeof url === 'string' && !url.startsWith('data:')) {
              opts.crossOrigin = 'anonymous';
            }
            return originalFromURL.call(fabric.Image, url, callback, opts);
          };
        }

        fabricInstanceRef.current = fabric;
        setFabricInstance(fabric);

        const newCanvas = new fabric.Canvas(canvasElRef.current, {
          width: STAGE_CANVAS_WIDTH,
          height: STAGE_CANVAS_HEIGHT,
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = newCanvas;
        applyStageGeometry(newCanvas, currentArea);

        // Object selection listeners
        newCanvas.on('selection:created', (e: any) => {
          if (onSelectionChange) onSelectionChange(e.selected?.[0] || null);
        });
        newCanvas.on('selection:updated', (e: any) => {
          if (onSelectionChange) onSelectionChange(e.selected?.[0] || null);
        });
        newCanvas.on('selection:cleared', () => {
          if (onSelectionChange) onSelectionChange(null);
        });

        const notifyState = () => {
          if (isSwitchingSideRef.current) return;
          saveCurrentState(newCanvas);
          const objs = newCanvas.getObjects();
          setHasCurrentObjects(objs.length > 0);
        };

        newCanvas.on('object:modified', notifyState);
        newCanvas.on('object:added', notifyState);
        newCanvas.on('object:removed', notifyState);

        setCanvas(newCanvas);

        // Load initial front design ONLY if explicit JSON with objects was provided (e.g. from ?resume=1)
        if (initialFrontJson && checkHasObjects(initialFrontJson)) {
          try {
            const parsed = normalizeCanvasJsonForCORS(initialFrontJson, initialArtworkUrl);
            newCanvas.loadFromJSON(parsed, () => {
              newCanvas.renderAll();
              saveCurrentState(newCanvas);
              setHasCurrentObjects(newCanvas.getObjects().length > 0);
            });
          } catch (e) {
            console.error('Failed loading initial front json', e);
          }
        } else {
          newCanvas.clear();
          newCanvas.renderAll();
          setHasCurrentObjects(false);
        }
      } catch (err) {
        console.error('Failed to initialize Fabric.js canvas:', err);
      }
    }

    initFabric();

    return () => {
      isMounted = false;
      if (canvas) {
        canvas.dispose();
      }
    };
  }, []);

  // Update canvas dimensions when template or activeSide printable area changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      applyStageGeometry(fabricCanvasRef.current, currentArea);
      fabricCanvasRef.current.renderAll();
    }
  }, [currentArea]);

  const checkHasObjects = (jsonStr: string): boolean => {
    if (!jsonStr) return false;
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed.objects) && parsed.objects.length > 0;
    } catch {
      return false;
    }
  };

  const saveCurrentState = (cvs = canvas) => {
    if (!cvs || isSwitchingSideRef.current) return;
    const cdnUrl = originalArtworkUrlRef.current;
    const jsonStr = sanitizeCanvasJson(JSON.stringify(cvs.toJSON()), cdnUrl);
    const currentSide = activeSideRef.current;
    if (currentSide === 'front') {
      frontJsonRef.current = jsonStr;
    } else {
      backJsonRef.current = jsonStr;
    }

    const hasFront = checkHasObjects(frontJsonRef.current);
    const hasBack = checkHasObjects(backJsonRef.current);

    if (onDesignChange) {
      onDesignChange({ hasFront, hasBack, activeSide: currentSide });
    }
  };

  // Switch between Front and Back sides
  // Apply a side request that arrived while the previous switch was loading.
  const flushPendingSide = () => {
    const next = pendingSideRef.current;
    pendingSideRef.current = null;
    if (next && next !== activeSideRef.current) switchSide(next);
  };

  const switchSide = (newSide: 'front' | 'back') => {
    if (newSide === 'back' && !backEnabledRef.current) return;
    if (!canvas) {
      // Fabric not initialised yet: nothing to save or load, just track the requested side.
      if (newSide !== activeSideRef.current) {
        activeSideRef.current = newSide;
        if (onSideChange) onSideChange(newSide);
      }
      return;
    }

    // Re-entrancy guard: while a previous switch is still loading, the canvas is cleared or only
    // partially rehydrated. Serializing it now would overwrite the other side with an empty/partial
    // design, so defer the request until the in-flight load completes.
    if (isSwitchingSideRef.current) {
      pendingSideRef.current = newSide;
      return;
    }
    pendingSideRef.current = null;
    if (newSide === activeSideRef.current) return;

    isSwitchingSideRef.current = true;

    // Save current active side JSON (sanitized) before clearing canvas
    const currentSide = activeSideRef.current;
    const cdnUrl = originalArtworkUrlRef.current;
    const currentJson = sanitizeCanvasJson(JSON.stringify(canvas.toJSON()), cdnUrl);
    if (currentSide === 'front') {
      frontJsonRef.current = currentJson;
    } else {
      backJsonRef.current = currentJson;
    }

    activeSideRef.current = newSide;
    if (onSideChange) onSideChange(newSide);

    // Update canvas dimensions for target side
    const targetArea = newSide === 'back' && resolvedTemplate.backPrintableArea
      ? resolvedTemplate.backPrintableArea
      : resolvedTemplate.frontPrintableArea;
    applyStageGeometry(canvas, targetArea);

    // Load target side JSON with CORS normalization
    canvas.clear();
    const targetJson = newSide === 'front' ? frontJsonRef.current : backJsonRef.current;
    if (targetJson && checkHasObjects(targetJson)) {
      try {
        const parsed = normalizeCanvasJsonForCORS(targetJson, cdnUrl);
        canvas.loadFromJSON(parsed, () => {
          canvas.renderAll();
          isSwitchingSideRef.current = false;
          setHasCurrentObjects(canvas.getObjects().length > 0);
          if (onSelectionChange) onSelectionChange(null);
          const hasFront = checkHasObjects(frontJsonRef.current);
          const hasBack = checkHasObjects(backJsonRef.current);
          if (onDesignChange) onDesignChange({ hasFront, hasBack, activeSide: newSide });
          flushPendingSide();
        });
      } catch (err) {
        console.error('Failed loading side json', err);
        canvas.renderAll();
        isSwitchingSideRef.current = false;
        setHasCurrentObjects(false);
        flushPendingSide();
      }
    } else {
      canvas.renderAll();
      isSwitchingSideRef.current = false;
      setHasCurrentObjects(false);
      if (onSelectionChange) onSelectionChange(null);
      const hasFront = checkHasObjects(frontJsonRef.current);
      const hasBack = checkHasObjects(backJsonRef.current);
      if (onDesignChange) onDesignChange({ hasFront, hasBack, activeSide: newSide });
      flushPendingSide();
    }
  };

  useEffect(() => {
    if (activeSide !== activeSideRef.current) {
      switchSide(activeSide);
    }
  }, [activeSide]);

  const sideArea = () =>
    activeSideRef.current === 'back' && resolvedTemplate.backPrintableArea
      ? resolvedTemplate.backPrintableArea
      : resolvedTemplate.frontPrintableArea;

  // Add custom text to canvas
  const handleAddText = (
    textString: string,
    options?: { fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }
  ) => {
    if (!canvas || !fabricInstance) return;
    const centerX = currentArea.width / 2;
    const centerY = currentArea.height / 2;
    const defaultFontSize = resolvedTemplate.type === 'cap' ? 16 : 24;

    const cleanText = textString?.trim() || 'Custom Text';
    const text = new fabricInstance.IText(cleanText, {
      left: centerX,
      top: centerY,
      fontFamily: options?.fontFamily || 'Outfit',
      fontSize: options?.fontSize || defaultFontSize,
      fill: options?.fill || '#FFFFFF',
      fontWeight: options?.fontWeight || 'bold',
      fontStyle: options?.fontStyle || 'normal',
      originX: 'center',
      originY: 'center',
      textAlign: options?.textAlign || 'center',
      cornerColor: '#3B6FEB',
      cornerSize: 8,
      transparentCorners: false,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    if (onSelectionChange) onSelectionChange(text);
    saveCurrentState();
    setHasCurrentObjects(true);
  };

  // Add uploaded image to canvas, wait for Cloudinary upload, and update object src with CDN URL
  const handleAddImage = async (file: File): Promise<string> => {
    let activeCanvas = fabricCanvasRef.current || canvas;
    let activeFabric = fabricInstanceRef.current || fabricInstance;

    if (!activeCanvas || !activeFabric) {
      // Wait up to 3 seconds for dynamic import/mount to complete
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        activeCanvas = fabricCanvasRef.current || canvas;
        activeFabric = fabricInstanceRef.current || fabricInstance;
        if (activeCanvas && activeFabric) break;
      }
    }

    if (!activeCanvas || !activeFabric) {
      console.error('[CustomizerCanvas] canvas or fabricInstance is null!', { activeCanvas: !!activeCanvas, activeFabric: !!activeFabric });
      throw new Error('Canvas studio is not ready yet. Please try again.');
    }

    // 1. Read file as local Data URL for immediate, lag-free canvas placement
    const localDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed reading selected image file.'));
      reader.readAsDataURL(file);
    });

    let placedImg: any = null;

    // 2. Render image on canvas immediately with transient localDataUrl
    await new Promise<void>((resolve, reject) => {
      activeFabric.Image.fromURL(
        localDataUrl,
        (img: any, isError: boolean) => {
          if (!img || isError) {
            reject(new Error('Failed decoding image from file. Please ensure it is a valid PNG, JPG, or SVG.'));
            return;
          }

          placedImg = img;

          // Constrain image nicely within printable area
          const centerX = currentArea.width / 2;
          const centerY = currentArea.height / 2;
          const maxWidth = Math.round(currentArea.width * 0.8);
          const maxHeight = Math.round(currentArea.height * 0.8);
          const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1), 1);

          img.set({
            left: centerX,
            top: centerY,
            originX: 'center',
            originY: 'center',
            scaleX: scale,
            scaleY: scale,
            cornerColor: '#3B6FEB',
            cornerSize: 8,
            transparentCorners: false,
          });

          activeCanvas.add(img);
          activeCanvas.setActiveObject(img);
          activeCanvas.renderAll();
          if (onSelectionChange) onSelectionChange(img);
          saveCurrentState(activeCanvas);
          setHasCurrentObjects(true);
          resolve();
        }
      );
    });

    // 3. Upload to Cloudinary and WAIT for upload completion before finalizing
    isUploadingArtworkRef.current = true;
    if (onUploadStatusChange) {
      onUploadStatusChange({ isUploading: true, error: null });
    }

    const uploadPromise = (async () => {
      const secureUrl = await uploadToCloudinary(file);
      originalArtworkUrlRef.current = secureUrl;

      // 4. Replace Fabric image object src with Cloudinary secure_url using crossOrigin='anonymous'
      if (placedImg) {
        const prevProps = {
          left: placedImg.left,
          top: placedImg.top,
          scaleX: placedImg.scaleX,
          scaleY: placedImg.scaleY,
          angle: placedImg.angle,
          originX: placedImg.originX,
          originY: placedImg.originY,
        };

        // Load image via setSrc with crossOrigin='anonymous'
        await new Promise<void>((resolve) => {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          }, 8000); // 8s safety timeout

          try {
            placedImg.setSrc(
              secureUrl,
              (updatedImg: any, isError: boolean) => {
                clearTimeout(timer);
                if (!resolved) {
                  resolved = true;
                  if (!isError && updatedImg) {
                    updatedImg.set(prevProps);
                    updatedImg.setCoords();
                  }
                  if (placedImg._element) {
                    placedImg._element.crossOrigin = 'anonymous';
                  }
                  if (placedImg._originalElement) {
                    placedImg._originalElement.crossOrigin = 'anonymous';
                  }
                  placedImg.crossOrigin = 'anonymous';
                  placedImg.src = secureUrl;
                  activeCanvas.renderAll();
                  resolve();
                }
              },
              { crossOrigin: 'anonymous' }
            );
          } catch {
            clearTimeout(timer);
            if (!resolved) {
              resolved = true;
              resolve();
            }
          }
        });

        // Ensure toObject serializes CDN URL and crossOrigin='anonymous'
        const origToObject = placedImg.toObject.bind(placedImg);
        placedImg.toObject = function(propertiesToInclude: any) {
          const obj = origToObject(propertiesToInclude);
          obj.src = secureUrl;
          obj.crossOrigin = 'anonymous';
          return obj;
        };

        activeCanvas.renderAll();
      }

      // Re-save and sanitize canvas state with CDN URL
      saveCurrentState(activeCanvas);
      frontJsonRef.current = sanitizeCanvasJson(frontJsonRef.current, secureUrl);
      backJsonRef.current = sanitizeCanvasJson(backJsonRef.current, secureUrl);

      return secureUrl;
    })();

    artworkUploadPromiseRef.current = uploadPromise;

    try {
      const resultUrl = await uploadPromise;
      isUploadingArtworkRef.current = false;
      if (onUploadStatusChange) {
        onUploadStatusChange({ isUploading: false, error: null });
      }
      return resultUrl;
    } catch (err: any) {
      console.error('[CustomizerCanvas] Cloudinary upload failed:', err);
      isUploadingArtworkRef.current = false;
      originalArtworkUrlRef.current = null;
      if (onUploadStatusChange) {
        onUploadStatusChange({ isUploading: false, error: err?.message || 'Failed to upload artwork to cloud storage' });
      }
      throw new Error(err?.message || 'Failed to upload artwork to cloud storage. Please try again.');
    }
  };

  // Expose methods via ref for parent to control
  useImperativeHandle(resolvedRef, () => ({
    addText: handleAddText,
    addImage: handleAddImage,
    switchSide,
    isUploadingArtwork: () => isUploadingArtworkRef.current,
    waitForArtworkUpload: async () => {
      if (artworkUploadPromiseRef.current) {
        try {
          return await artworkUploadPromiseRef.current;
        } catch {
          return null;
        }
      }
      return originalArtworkUrlRef.current;
    },
    getOriginalArtworkUrl: () => {
      if (originalArtworkUrlRef.current && !originalArtworkUrlRef.current.startsWith('data:image/')) {
        return originalArtworkUrlRef.current;
      }
      // Fallback: search for non-base64 image object in canvas
      if (canvas) {
        const objs = canvas.getObjects();
        const imgObj = objs.find((o: any) => o.type === 'image' && (o.getSrc?.() || o._element?.src || o.src));
        if (imgObj) {
          const src = imgObj.getSrc ? imgObj.getSrc() : (imgObj._element?.src || imgObj.src);
          if (src && typeof src === 'string' && !src.startsWith('data:image/')) return src;
        }
      }
      // Fallback: search in saved JSON states
      for (const jsonStr of [frontJsonRef.current, backJsonRef.current]) {
        try {
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            const img = parsed.objects?.find((o: any) => o.type === 'image' && o.src);
            if (img?.src && typeof img.src === 'string' && !img.src.startsWith('data:image/')) return img.src;
          }
        } catch {
          // Ignore invalid JSON state
        }
      }
      return null;
    },
    setOriginalArtworkUrl: (url: string | null) => {
      originalArtworkUrlRef.current = url;
    },
    updateActiveObject: (updates: any) => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      active.set(updates);
      canvas.renderAll();
      saveCurrentState();
    },
    deleteActiveObject: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.remove(active);
      if (onSelectionChange) onSelectionChange(null);
      canvas.renderAll();
      saveCurrentState();
      setHasCurrentObjects(canvas.getObjects().length > 0);
    },
    centerActiveH: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      const area = sideArea();
      active.setPositionByOrigin(new fabricInstanceRef.current.Point(area.width / 2, active.getCenterPoint().y), 'center', 'center');
      active.setCoords();
      canvas.renderAll();
      saveCurrentState();
    },
    centerActiveV: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      const area = sideArea();
      active.setPositionByOrigin(new fabricInstanceRef.current.Point(active.getCenterPoint().x, area.height / 2), 'center', 'center');
      active.setCoords();
      canvas.renderAll();
      saveCurrentState();
    },
    bringForward: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.bringForward(active);
      canvas.renderAll();
      saveCurrentState();
    },
    sendBackward: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.sendBackwards(active);
      canvas.renderAll();
      saveCurrentState();
    },
    clearSide: () => {
      if (!canvas) return;
      canvas.clear();
      if (onSelectionChange) onSelectionChange(null);
      canvas.renderAll();
      saveCurrentState();
      setHasCurrentObjects(false);
    },
    getCanvasState: () => {
      // While a side switch is loading, the canvas is empty or partly rehydrated: the stored JSON
      // is the truth then, so it must not be overwritten (same guard as switchSide/saveCurrentState).
      if (canvas && !isSwitchingSideRef.current) {
        const cdnUrl = originalArtworkUrlRef.current;
        const curJson = sanitizeCanvasJson(JSON.stringify(canvas.toJSON()), cdnUrl);
        if (activeSideRef.current === 'front') frontJsonRef.current = curJson;
        else backJsonRef.current = curJson;
      }
      const cdnUrl = originalArtworkUrlRef.current;
      return {
        frontJson: sanitizeCanvasJson(frontJsonRef.current, cdnUrl),
        backJson: sanitizeCanvasJson(backJsonRef.current, cdnUrl),
        hasFront: checkHasObjects(frontJsonRef.current),
        hasBack: checkHasObjects(backJsonRef.current),
      };
    },
    loadDraftState: (frontJson?: string, backJson?: string, artworkUrl?: string) => {
      if (artworkUrl) originalArtworkUrlRef.current = artworkUrl;
      const cdnUrl = originalArtworkUrlRef.current;
      if (frontJson) frontJsonRef.current = sanitizeCanvasJson(frontJson, cdnUrl);
      if (backJson && backEnabledRef.current) backJsonRef.current = sanitizeCanvasJson(backJson, cdnUrl);
      if (canvas) {
        const target = activeSideRef.current === 'front' ? frontJsonRef.current : backJsonRef.current;
        if (target && checkHasObjects(target)) {
          const parsed = normalizeCanvasJsonForCORS(target, cdnUrl);
          canvas.loadFromJSON(parsed, () => {
            canvas.renderAll();
            setHasCurrentObjects(canvas.getObjects().length > 0);
          });
        } else {
          canvas.clear();
          canvas.renderAll();
          setHasCurrentObjects(false);
        }
      }
    },
    exportPreviews: async () => {
      const activeCanvas = fabricCanvasRef.current || canvas;
      if (!activeCanvas) {
        throw new Error('Canvas not ready');
      }

      // If an artwork upload is still in progress, wait for it
      if (isUploadingArtworkRef.current && artworkUploadPromiseRef.current) {
        try {
          await artworkUploadPromiseRef.current;
        } catch (e) {
          console.warn('[CustomizerCanvas] Artwork upload failed prior to preview export', e);
        }
      }

      // A side switch still loading leaves the canvas partly rehydrated: let it finish first.
      for (let i = 0; i < 100 && isSwitchingSideRef.current; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }

      // Save active side ONLY if activeCanvas has objects
      const currentSide = activeSideRef.current;
      const currentJson = JSON.stringify(activeCanvas.toJSON());
      const cdnUrl = originalArtworkUrlRef.current;
      if (checkHasObjects(currentJson)) {
        const sanitized = sanitizeCanvasJson(currentJson, cdnUrl);
        if (currentSide === 'front') frontJsonRef.current = sanitized;
        else backJsonRef.current = sanitized;
      }

      if (!backEnabledRef.current) backJsonRef.current = EMPTY_CANVAS_JSON;
      frontJsonRef.current = sanitizeCanvasJson(frontJsonRef.current, cdnUrl);
      backJsonRef.current = sanitizeCanvasJson(backJsonRef.current, cdnUrl);

      // Products with admin-chosen view photos or reusable templates get a composite preview (photo/mockup + design); the
      // design-only crop is kept as the fallback and stays the preview for older products without photos or templates.
      const views = getCustomizerViews(product);
      const hasBackdrop = Boolean(views || getCustomizerSideImage(product, 'front'));
      const exportLayers = (area: PrintableAreaConfig) => ({
        crop: safeExportCanvas(activeCanvas, { format: 'png', multiplier: 2, ...previewCrop(activeCanvas, area) }),
        full: hasBackdrop
          ? safeExportCanvas(activeCanvas, { format: 'png', multiplier: 2, left: 0, top: 0, width: STAGE_CANVAS_WIDTH, height: STAGE_CANVAS_HEIGHT })
          : '',
      });
      type SideLayers = ReturnType<typeof exportLayers>;
      const NO_LAYERS: SideLayers = { crop: '', full: '' };

      const productColors = getProductColors(product);
      const productCollarColors = getProductCollarColors(product);
      const bodyHex =
        productColors.find((c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase())?.hex ||
        getColorHex(selectedColor);
      const trimHex =
        collarColor
          ? productCollarColors.find((c) => c.name.toLowerCase() === collarColor.toLowerCase())?.hex ||
            getColorHex(collarColor)
          : bodyHex;

      const composeSide = async (side: 'front' | 'back', layers: SideLayers): Promise<string> => {
        const photo = getCustomizerSideImage(product, side);
        if (!layers.crop || !layers.full || !photo) return layers.crop;
        // The same recolouring the canvas background shows, so the preview matches the screen.
        const recolor = getSideRecolor(product, side);
        let photoSource: string | HTMLCanvasElement = photo;
        if (recolor) {
          try {
            photoSource = await renderRecolored(recolor, bodyHex, trimHex);
          } catch (err) {
            console.warn(`[CustomizerCanvas] ${side} recolouring failed; using the plain photo.`, err);
          }
        }
        try {
          return await composeOverPhoto(photoSource, layers.full);
        } catch (err) {
          console.warn(`[CustomizerCanvas] ${side} photo composite failed; using the design-only preview.`, err);
          return layers.crop;
        }
      };

      const renderSideToDataUrl = async (side: 'front' | 'back'): Promise<SideLayers> => {
        // If requesting the currently active side, render directly from activeCanvas
        if (side === currentSide) {
          return checkHasObjects(side === 'front' ? frontJsonRef.current : backJsonRef.current)
            ? exportLayers(currentArea)
            : NO_LAYERS;
        }

        const targetJson = side === 'front' ? frontJsonRef.current : backJsonRef.current;
        if (!targetJson || !checkHasObjects(targetJson)) {
          return NO_LAYERS;
        }

        const targetArea = side === 'back' && resolvedTemplate.backPrintableArea
          ? resolvedTemplate.backPrintableArea
          : resolvedTemplate.frontPrintableArea;
        applyStageGeometry(activeCanvas, targetArea);

        const parsed = normalizeCanvasJsonForCORS(targetJson, cdnUrl);

        return new Promise((resolve, reject) => {
          isSwitchingSideRef.current = true;
          activeCanvas.loadFromJSON(parsed, () => {
            let data: SideLayers = NO_LAYERS;
            try {
              data = exportLayers(targetArea);
            } catch (exportErr) {
              console.error('[CustomizerCanvas] Error exporting target side:', exportErr);
              applyStageGeometry(activeCanvas, currentArea);
              isSwitchingSideRef.current = false;
              reject(exportErr);
              return;
            }

            // Restore active side immediately
            const restoreJson = currentSide === 'front' ? frontJsonRef.current : backJsonRef.current;
            applyStageGeometry(activeCanvas, currentArea);
            if (restoreJson && checkHasObjects(restoreJson)) {
              const restoreParsed = normalizeCanvasJsonForCORS(restoreJson, cdnUrl);
              activeCanvas.loadFromJSON(restoreParsed, () => {
                activeCanvas.renderAll();
                isSwitchingSideRef.current = false;
                setHasCurrentObjects(activeCanvas.getObjects().length > 0);
                resolve(data);
              });
            } else {
              activeCanvas.clear();
              activeCanvas.renderAll();
              isSwitchingSideRef.current = false;
              setHasCurrentObjects(false);
              resolve(data);
            }
          });
        });
      };

      const frontLayers = await renderSideToDataUrl('front');
      const backLayers = await renderSideToDataUrl('back');
      const frontDataUrl = await composeSide('front', frontLayers);
      const backDataUrl = await composeSide('back', backLayers);

      const hasFront = checkHasObjects(frontJsonRef.current);
      const hasBack = checkHasObjects(backJsonRef.current);

      let frontCloudinaryUrl: string | undefined;
      let backCloudinaryUrl: string | undefined;

      if (hasFront && frontDataUrl) {
        try {
          const url = await uploadDataUrlToCloudinary(frontDataUrl);
          if (url && !url.startsWith('data:image/')) {
            frontCloudinaryUrl = url;
          } else {
            throw new Error('Cloudinary returned invalid preview URL');
          }
        } catch (e) {
          console.error('[CustomizerCanvas] Failed Cloudinary upload for front preview:', e);
          throw new Error('Failed to upload front preview to cloud storage. Please try again.');
        }
      }

      if (hasBack && backDataUrl) {
        try {
          const url = await uploadDataUrlToCloudinary(backDataUrl);
          if (url && !url.startsWith('data:image/')) {
            backCloudinaryUrl = url;
          } else {
            throw new Error('Cloudinary returned invalid preview URL');
          }
        } catch (e) {
          console.error('[CustomizerCanvas] Failed Cloudinary upload for back preview:', e);
          throw new Error('Failed to upload back preview to cloud storage. Please try again.');
        }
      }

      // Re-sanitize both states to guarantee no base64
      const sanitizedFront = sanitizeCanvasJson(frontJsonRef.current, cdnUrl);
      const sanitizedBack = sanitizeCanvasJson(backJsonRef.current, cdnUrl);

      return {
        frontCanvasJson: sanitizedFront,
        backCanvasJson: sanitizedBack,
        hasFront,
        hasBack,
        frontCloudinaryUrl,
        backCloudinaryUrl,
      };
    }
  }));

  return (
    // The 1px transparent border is load-bearing: it keeps the padding box at exactly
    // STAGE_CANVAS_WIDTH x STAGE_CANVAS_HEIGHT so the guide and the Fabric canvas line up.
    <div
      data-cy="customizer-canvas-container"
      className="relative w-full max-w-[540px] aspect-[500/580] border border-transparent p-2 flex items-center justify-center overflow-hidden group select-none rounded-3xl bg-[radial-gradient(ellipse_at_50%_35%,#FFFFFF_0%,#F3F6FC_55%,#E3E9F8_100%)] shadow-[0_24px_60px_-28px_rgba(30,58,138,0.35)] ring-1 ring-white/70"
    >
      {/* Dynamic Product Silhouette SVG or Media Backdrop */}
      <GarmentBackdrop
        color={selectedColor}
        collarColor={collarColor}
        side={activeSide}
        category={category}
        template={resolvedTemplate}
        product={product}
      />

      <span className="absolute top-3 inset-x-0 mx-auto w-max z-20 pointer-events-none rounded-md bg-[#94A3B8] px-2.5 py-0.5 text-[11px] font-medium lowercase text-white shadow-xs">
        {activeSide}
      </span>

      {/*
        Design-area guide: purely visual and rendered BELOW the Fabric layer, so it never intercepts
        pointer events, never clips objects (placement stays free), and is not part of any export.
      */}
      <div
        id="customizer-design-guide"
        aria-hidden="true"
        className={`absolute z-[5] pointer-events-none flex flex-col items-center justify-center text-center border-[1.5px] border-dashed ${
          guideOverPhoto
            ? 'border-white/90 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]'
            : guideOnLight
              ? 'border-black/25 text-black/45'
              : 'border-white/70 text-white/85'
        }`}
        style={{
          top: currentArea.top,
          left: currentArea.left,
          width: currentArea.styleWidth,
          height: currentArea.styleHeight,
        }}
      >
        {!hasCurrentObjects && (
          <div className="px-3">
            <p className="text-[13px] font-medium leading-snug">
              {currentArea.guideText || (
                <>
                  Design area
                  <br />
                  use tools to add
                </>
              )}
            </p>
            {currentArea.subGuideText && (
              <p className="text-[11px] opacity-80 mt-0.5 leading-tight">
                {currentArea.subGuideText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Interactive Fabric canvas covering the whole stage (free placement) */}
      <div
        id="customizer-canvas-wrapper"
        data-canvas-ready={Boolean(canvas && fabricInstance)}
        className="absolute inset-0 z-10"
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* Subtle clear button on canvas bottom right */}
      {hasCurrentObjects && (
        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="button"
            onClick={() => {
              if (canvas) {
                canvas.clear();
                canvas.renderAll();
                saveCurrentState();
                setHasCurrentObjects(false);
                if (onSelectionChange) onSelectionChange(null);
              }
            }}
            className="px-2.5 py-1 bg-white/90 hover:bg-white text-[11px] font-bold text-gray-600 hover:text-red-600 rounded-lg shadow-sm border border-gray-200 transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Clear Side
          </button>
        </div>
      )}
    </div>
  );
});

CustomizerCanvas.displayName = 'CustomizerCanvas';

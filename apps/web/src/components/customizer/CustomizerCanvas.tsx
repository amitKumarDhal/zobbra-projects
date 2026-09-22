'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { GarmentBackdrop } from './GarmentBackdrop';
import { uploadDataUrlToCloudinary, uploadToCloudinary } from '@/lib/upload';

export interface CustomizerCanvasRef {
  addText: (text: string, options?: { fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }) => void;
  addImage: (file: File) => Promise<void>;
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
  exportPreviews: () => Promise<{
    frontDataUrl: string;
    backDataUrl: string;
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
  onSideChange?: (side: 'front' | 'back') => void;
  onDesignChange?: (info: { hasFront: boolean; hasBack: boolean; activeSide: 'front' | 'back' }) => void;
  onSelectionChange?: (selectedObj: any) => void;
  initialFrontJson?: string;
  initialBackJson?: string;
  initialArtworkUrl?: string;
  innerRef?: any;
}

const EMPTY_CANVAS_JSON = JSON.stringify({ version: '5.3.0', objects: [] });

export const CustomizerCanvas = forwardRef<CustomizerCanvasRef, CustomizerCanvasProps>(({
  selectedColor,
  collarColor,
  category,
  activeSide,
  onSideChange,
  onDesignChange,
  onSelectionChange,
  initialFrontJson,
  initialBackJson,
  initialArtworkUrl,
  innerRef,
}, ref) => {
  const resolvedRef = (ref as any) || innerRef;
  const [fabricInstance, setFabricInstance] = useState<any>(null);
  const [canvas, setCanvas] = useState<any>(null);
  const [hasCurrentObjects, setHasCurrentObjects] = useState<boolean>(false);

  const fabricCanvasRef = useRef<any>(null);
  const fabricInstanceRef = useRef<any>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // Guarantee clean empty canvas state by default - zero pre-populated elements
  const frontJsonRef = useRef<string>(initialFrontJson || EMPTY_CANVAS_JSON);
  const backJsonRef = useRef<string>(initialBackJson || EMPTY_CANVAS_JSON);
  // Track the original uploaded artwork Cloudinary URL (first user image upload)
  const originalArtworkUrlRef = useRef<string | null>(initialArtworkUrl || null);

  // Initialize Fabric.js dynamically on client only
  useEffect(() => {
    let isMounted = true;

    async function initFabric() {
      if (typeof window === 'undefined' || !canvasElRef.current) return;
      try {
        const fabricMod = await import('fabric');
        const fabric = (fabricMod as any).fabric || fabricMod;
        if (!isMounted) return;

        fabricInstanceRef.current = fabric;
        setFabricInstance(fabric);

        const isCap = category?.toLowerCase().includes('cap');
        const canvasWidth = isCap ? 200 : 210;
        const canvasHeight = isCap ? 115 : 300;

        const newCanvas = new fabric.Canvas(canvasElRef.current, {
          width: canvasWidth,
          height: canvasHeight,
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = newCanvas;

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
            newCanvas.loadFromJSON(JSON.parse(initialFrontJson), () => {
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

  // Update canvas dimensions when product category changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const isCap = category?.toLowerCase().includes('cap');
      const width = isCap ? 200 : 210;
      const height = isCap ? 115 : 300;
      fabricCanvasRef.current.setDimensions({ width, height });
      fabricCanvasRef.current.renderAll();
    }
  }, [category]);

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
    if (!cvs) return;
    const jsonStr = JSON.stringify(cvs.toJSON());
    if (activeSide === 'front') {
      frontJsonRef.current = jsonStr;
    } else {
      backJsonRef.current = jsonStr;
    }

    const hasFront = checkHasObjects(frontJsonRef.current);
    const hasBack = checkHasObjects(backJsonRef.current);

    if (onDesignChange) {
      onDesignChange({ hasFront, hasBack, activeSide });
    }
  };

  // Switch between Front and Back sides
  const switchSide = (newSide: 'front' | 'back') => {
    if (!canvas || newSide === activeSide) return;

    // Save current active side JSON
    const currentJson = JSON.stringify(canvas.toJSON());
    if (activeSide === 'front') {
      frontJsonRef.current = currentJson;
    } else {
      backJsonRef.current = currentJson;
    }

    if (onSideChange) onSideChange(newSide);

    // Load target side JSON
    canvas.clear();
    const targetJson = newSide === 'front' ? frontJsonRef.current : backJsonRef.current;
    if (targetJson && checkHasObjects(targetJson)) {
      try {
        canvas.loadFromJSON(JSON.parse(targetJson), () => {
          canvas.renderAll();
          setHasCurrentObjects(canvas.getObjects().length > 0);
          if (onSelectionChange) onSelectionChange(null);
          const hasFront = checkHasObjects(frontJsonRef.current);
          const hasBack = checkHasObjects(backJsonRef.current);
          if (onDesignChange) onDesignChange({ hasFront, hasBack, activeSide: newSide });
        });
      } catch (err) {
        console.error('Failed loading side json', err);
        canvas.renderAll();
        setHasCurrentObjects(false);
      }
    } else {
      canvas.renderAll();
      setHasCurrentObjects(false);
      if (onSelectionChange) onSelectionChange(null);
      const hasFront = checkHasObjects(frontJsonRef.current);
      const hasBack = checkHasObjects(backJsonRef.current);
      if (onDesignChange) onDesignChange({ hasFront, hasBack, activeSide: newSide });
    }
  };

  // Add custom text to canvas
  const handleAddText = (
    textString: string,
    options?: { fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }
  ) => {
    if (!canvas || !fabricInstance) return;
    const isCap = category?.toLowerCase().includes('cap');
    const centerX = isCap ? 100 : 105;
    const centerY = isCap ? 57.5 : 140;
    const defaultFontSize = isCap ? 16 : 24;

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

  // Add uploaded image to canvas
  const handleAddImage = async (file: File): Promise<void> => {
    const activeCanvas = fabricCanvasRef.current || canvas;
    const activeFabric = fabricInstanceRef.current || fabricInstance;

    if (!activeCanvas || !activeFabric) {
      console.error('[CustomizerCanvas] canvas or fabricInstance is null!', { activeCanvas: !!activeCanvas, activeFabric: !!activeFabric });
      return;
    }

    // 1. Upload to Cloudinary using guest signature
    console.log('[CustomizerCanvas] starting uploadToCloudinary with file:', file.name, file.size);
    const secureUrl = await uploadToCloudinary(file);
    console.log('[CustomizerCanvas] uploadToCloudinary completed, secureUrl:', secureUrl);

    // Track the first artwork URL (original customer asset)
    if (!originalArtworkUrlRef.current) {
      originalArtworkUrlRef.current = secureUrl;
    }

    return new Promise((resolve, reject) => {
      activeFabric.Image.fromURL(
        secureUrl,
        (img: any, isError: boolean) => {
          console.log('[CustomizerCanvas] fabric.Image.fromURL callback:', { hasImg: !!img, isError });
          if (!img || isError) {
            reject(new Error('Failed decoding image from Cloudinary'));
            return;
          }

          // Constrain image nicely within printable area
          const isCap = category?.toLowerCase().includes('cap');
          const centerX = isCap ? 100 : 105;
          const centerY = isCap ? 57.5 : 140;
          const maxWidth = isCap ? 160 : 150;
          const maxHeight = isCap ? 85 : 150;
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
        },
        { crossOrigin: 'anonymous' }
      );
    });
  };

  // Expose methods via ref for parent to control
  useImperativeHandle(resolvedRef, () => ({
    addText: handleAddText,
    addImage: handleAddImage,
    switchSide,
    getOriginalArtworkUrl: () => {
      if (originalArtworkUrlRef.current) return originalArtworkUrlRef.current;
      // Fallback: search for image object in canvas
      if (canvas) {
        const objs = canvas.getObjects();
        const imgObj = objs.find((o: any) => o.type === 'image' && (o.getSrc?.() || o._element?.src || o.src));
        if (imgObj) {
          const src = imgObj.getSrc ? imgObj.getSrc() : (imgObj._element?.src || imgObj.src);
          if (src && typeof src === 'string' && !src.startsWith('data:')) return src;
        }
      }
      // Fallback: search in saved JSON states
      for (const jsonStr of [frontJsonRef.current, backJsonRef.current]) {
        try {
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            const img = parsed.objects?.find((o: any) => o.type === 'image' && o.src);
            if (img?.src && typeof img.src === 'string' && !img.src.startsWith('data:')) return img.src;
          }
        } catch (_err) {
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
      canvas.centerObjectH(active);
      canvas.renderAll();
      saveCurrentState();
    },
    centerActiveV: () => {
      const active = canvas?.getActiveObject();
      if (!active) return;
      canvas.centerObjectV(active);
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
      if (canvas) {
        const curJson = JSON.stringify(canvas.toJSON());
        if (activeSide === 'front') frontJsonRef.current = curJson;
        else backJsonRef.current = curJson;
      }
      return {
        frontJson: frontJsonRef.current,
        backJson: backJsonRef.current,
        hasFront: checkHasObjects(frontJsonRef.current),
        hasBack: checkHasObjects(backJsonRef.current),
      };
    },
    loadDraftState: (frontJson?: string, backJson?: string, artworkUrl?: string) => {
      if (artworkUrl) originalArtworkUrlRef.current = artworkUrl;
      if (frontJson) frontJsonRef.current = frontJson;
      if (backJson) backJsonRef.current = backJson;
      if (canvas) {
        const target = activeSide === 'front' ? frontJsonRef.current : backJsonRef.current;
        if (target && checkHasObjects(target)) {
          canvas.loadFromJSON(JSON.parse(target), () => {
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
      if (!canvas) {
        throw new Error('Canvas not ready');
      }

      // Save active side
      const currentJson = JSON.stringify(canvas.toJSON());
      if (activeSide === 'front') frontJsonRef.current = currentJson;
      else backJsonRef.current = currentJson;

      const renderSideToDataUrl = async (side: 'front' | 'back'): Promise<string> => {
        const targetJson = side === 'front' ? frontJsonRef.current : backJsonRef.current;
        return new Promise((resolve) => {
          if (!targetJson || !checkHasObjects(targetJson)) {
            resolve('');
            return;
          }
          canvas.loadFromJSON(JSON.parse(targetJson), () => {
            canvas.renderAll();
            const data = canvas.toDataURL({ format: 'png', multiplier: 2 });
            resolve(data);
          });
        });
      };

      const frontDataUrl = await renderSideToDataUrl('front');
      const backDataUrl = await renderSideToDataUrl('back');

      // Restore active side
      const restoreJson = activeSide === 'front' ? frontJsonRef.current : backJsonRef.current;
      if (restoreJson && checkHasObjects(restoreJson)) {
        canvas.loadFromJSON(JSON.parse(restoreJson), () => {
          canvas.renderAll();
          setHasCurrentObjects(canvas.getObjects().length > 0);
        });
      } else {
        canvas.clear();
        canvas.renderAll();
        setHasCurrentObjects(false);
      }

      const hasFront = checkHasObjects(frontJsonRef.current);
      const hasBack = checkHasObjects(backJsonRef.current);

      let frontCloudinaryUrl = '';
      let backCloudinaryUrl = '';

      try {
        if (frontDataUrl) {
          frontCloudinaryUrl = await uploadDataUrlToCloudinary(frontDataUrl);
        }
      } catch (e) {
        console.warn('Failed Cloudinary upload for front preview, using dataUrl', e);
      }

      try {
        if (backDataUrl) {
          backCloudinaryUrl = await uploadDataUrlToCloudinary(backDataUrl);
        }
      } catch (e) {
        console.warn('Failed Cloudinary upload for back preview, using dataUrl', e);
      }

      return {
        frontDataUrl,
        backDataUrl,
        frontCanvasJson: frontJsonRef.current,
        backCanvasJson: backJsonRef.current,
        hasFront,
        hasBack,
        frontCloudinaryUrl: frontCloudinaryUrl || frontDataUrl,
        backCloudinaryUrl: backCloudinaryUrl || backDataUrl,
      };
    }
  }));

  const isCap = category?.toLowerCase().includes('cap');

  return (
    <div className="relative w-full max-w-[540px] aspect-[500/580] bg-[#FAFAFA] rounded-2xl border border-[#E5E7EB] p-2 flex items-center justify-center overflow-hidden shadow-inner group select-none">
      {/* Dynamic Garment Silhouette SVG */}
      <GarmentBackdrop color={selectedColor} collarColor={collarColor} side={activeSide} category={category} />

      {/* Interactive Fabric Canvas overlay exactly over printable area */}
      <div 
        className="absolute z-10 flex items-center justify-center"
        style={
          isCap
            ? {
                top: '32.8%',
                left: '34%',
                width: '32%',
                height: '19.8%',
              }
            : {
                top: '22.4%',
                left: '29%',
                width: '42%',
                height: '52%',
              }
        }
      >
        <canvas ref={canvasElRef} className="rounded" />

        {/* Clean, Non-Intrusive Empty Canvas Guide Overlay (UI only - NOT a canvas object!) */}
        {!hasCurrentObjects && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
            <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-[#3B6FEB] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] font-bold text-gray-700">
              {isCap ? 'Add your logo or text' : 'Add your logo, text or artwork'}
            </p>
            <p className="text-[9px] text-gray-400 max-w-[150px] leading-tight mt-0.5">
              {isCap ? 'Embroidery area (10cm × 5.5cm)' : 'Select an option from the design tools to begin'}
            </p>
          </div>
        )}
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

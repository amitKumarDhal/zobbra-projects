'use client';

import React from 'react';
import { getCustomizerTemplate, CustomizerTemplate, getReusableTemplateById } from '../../lib/customizerTemplates';
import { COLOR_HEX_MAP, getColorHex, isLightColor } from '../../lib/colors';
import { getCustomizerSideImage, getSideRecolor } from '../../lib/customizerViews';
import { getProductColors, getProductCollarColors } from '../../lib/productConfig';
import { RecoloredPhoto } from './RecoloredPhoto';

export interface GarmentBackdropProps {
  color: string;
  collarColor?: string;
  side: 'front' | 'back';
  category?: string;
  template?: CustomizerTemplate;
  product?: any;
}

// Colour helpers live in lib/colors; re-exported here for existing imports.
export { COLOR_HEX_MAP, getColorHex, isLightColor };

// Drawn silhouette: only used when the product has no photo (or its photo fails to load).
const SilhouetteBackdrop: React.FC<GarmentBackdropProps> = ({
  color,
  collarColor,
  side,
  category,
  template,
  product,
}) => {
  const resolvedTemplate = template || getCustomizerTemplate(product || { category: { slug: category }, name: category });
  const hex = getColorHex(color);
  const collarHex = getColorHex(collarColor || color);
  const light = isLightColor(hex);
  const collarLight = isLightColor(collarHex);

  // =========================================================================
  // 1. CAP & HEADWEAR SILHOUETTE
  // =========================================================================
  if (resolvedTemplate.type === 'cap') {
    return (
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
        <svg
          viewBox="0 0 500 580"
          className="w-full h-full max-h-[580px] drop-shadow-2xl transition-colors duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="capCrownLighting" cx="50%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={light ? "0.25" : "0.18"} />
              <stop offset="65%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity={light ? "0.15" : "0.45"} />
            </radialGradient>
            <linearGradient id="visorLighting" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={collarLight ? "0.2" : "0.1"} />
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity={collarLight ? "0.2" : "0.4"} />
            </linearGradient>
            <filter id="capShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="16" stdDeviation="18" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* FRONT VIEW */}
          {side === 'front' ? (
            <g filter="url(#capShadow)">
              {/* Visor / Brim Base */}
              <path
                d="M 85 325 C 80 345, 120 445, 250 445 C 380 445, 420 345, 415 325 C 330 350, 170 350, 85 325 Z"
                fill={collarHex}
                stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
              />
              <path
                d="M 85 325 C 80 345, 120 445, 250 445 C 380 445, 420 345, 415 325 C 330 350, 170 350, 85 325 Z"
                fill="url(#visorLighting)"
              />

              {/* Visor Stitched Contour Arcs */}
              <g stroke={collarLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"} strokeWidth="1.2" strokeDasharray="3 2" fill="none">
                <path d="M 110 344 C 145 425, 250 432, 250 432 C 250 432, 355 425, 390 344" />
                <path d="M 125 341 C 155 412, 250 418, 250 418 C 250 418, 345 412, 375 341" />
                <path d="M 140 338 C 165 398, 250 404, 250 404 C 250 404, 335 398, 360 338" />
                <path d="M 155 336 C 175 385, 250 390, 250 390 C 250 390, 325 385, 345 336" />
                <path d="M 170 334 C 185 372, 250 376, 250 376 C 250 376, 315 372, 330 334" />
              </g>

              {/* Crown Outer Dome */}
              <path
                d="M 95 330 C 95 180, 180 125, 250 125 C 320 125, 405 180, 405 330 C 340 346, 160 346, 95 330 Z"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                strokeWidth="2"
              />
              <path
                d="M 95 330 C 95 180, 180 125, 250 125 C 320 125, 405 180, 405 330 C 340 346, 160 346, 95 330 Z"
                fill="url(#capCrownLighting)"
              />

              {/* Panel Seam Stitching */}
              <path
                d="M 250 125 L 250 343"
                stroke={light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <path
                d="M 250 125 C 205 180, 170 250, 165 337"
                stroke={light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)"}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <path
                d="M 250 125 C 295 180, 330 250, 335 337"
                stroke={light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)"}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Embroidered Eyelets on Panels */}
              <g stroke={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} strokeWidth="1.2">
                <circle cx="205" cy="205" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="205" cy="205" r="2" fill="#000000" />

                <circle cx="295" cy="205" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="295" cy="205" r="2" fill="#000000" />

                <circle cx="140" cy="235" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="140" cy="235" r="2" fill="#000000" />

                <circle cx="360" cy="235" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="360" cy="235" r="2" fill="#000000" />
              </g>

              {/* Top Squatchee Button */}
              <circle
                cx="250"
                cy="125"
                r="10"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
              />
              <circle
                cx="248"
                cy="123"
                r="3"
                fill="#ffffff"
                opacity={light ? "0.5" : "0.3"}
              />

            </g>
          ) : (
            /* BACK VIEW */
            <g filter="url(#capShadow)">
              {/* Crown Outer Dome */}
              <path
                d="M 95 330 C 95 180, 180 125, 250 125 C 320 125, 405 180, 405 330 C 340 338, 160 338, 95 330 Z"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                strokeWidth="2"
              />
              <path
                d="M 95 330 C 95 180, 180 125, 250 125 C 320 125, 405 180, 405 330 C 340 338, 160 338, 95 330 Z"
                fill="url(#capCrownLighting)"
              />

              {/* Back Seam */}
              <path
                d="M 250 125 L 250 265"
                stroke={light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Back Keyhole Opening */}
              <path
                d="M 190 336 C 190 265, 310 265, 310 336 Z"
                fill="#1E293B"
                opacity="0.85"
              />

              {/* Fabric Adjustment Strap */}
              <rect
                x="180"
                y="322"
                width="140"
                height="15"
                rx="3"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                strokeWidth="1.5"
              />

              {/* Brass Metal Slide Buckle & Grommet */}
              <rect
                x="236"
                y="318"
                width="18"
                height="23"
                rx="3"
                fill="#D4AF37"
                stroke="#997A15"
                strokeWidth="1.5"
              />
              <rect
                x="242"
                y="322"
                width="6"
                height="15"
                rx="1"
                fill="#594406"
              />

              {/* Back Eyelets */}
              <g stroke={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} strokeWidth="1.2">
                <circle cx="170" cy="210" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="170" cy="210" r="2" fill="#000000" />

                <circle cx="330" cy="210" r="4.5" fill={light ? "#E2E8F0" : "#1E293B"} />
                <circle cx="330" cy="210" r="2" fill="#000000" />
              </g>

              {/* Top Button */}
              <circle
                cx="250"
                cy="125"
                r="10"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
              />

            </g>
          )}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 2. CERAMIC COFFEE MUG / DRINKWARE SILHOUETTE
  // =========================================================================
  if (resolvedTemplate.type === 'mug') {
    return (
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
        <svg
          viewBox="0 0 500 580"
          className="w-full h-full max-h-[580px] drop-shadow-2xl transition-colors duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mugBodyLighting" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
              <stop offset="22%" stopColor="#ffffff" stopOpacity={light ? "0.38" : "0.22"} />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="85%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.32" />
            </linearGradient>
            <radialGradient id="mugInnerCavity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.75" />
              <stop offset="80%" stopColor="#0F172A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </radialGradient>
            <linearGradient id="mugHandleLighting" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
            </linearGradient>
            <filter id="mugShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="18" stdDeviation="16" floodOpacity="0.14" />
            </filter>
          </defs>

          <g filter="url(#mugShadow)">
            {/* Ceramic C-Handle */}
            {side === 'front' ? (
              /* Front View: Handle on Right Side */
              <g>
                <path
                  d="M 360 200 C 455 200, 455 375, 355 375 L 355 335 C 415 335, 415 240, 360 240 Z"
                  fill={collarHex}
                  stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                  strokeWidth="2"
                />
                <path
                  d="M 360 200 C 455 200, 455 375, 355 375 L 355 335 C 415 335, 415 240, 360 240 Z"
                  fill="url(#mugHandleLighting)"
                />
              </g>
            ) : (
              /* Back / Reverse View: Handle on Left Side */
              <g>
                <path
                  d="M 140 200 C 45 200, 45 375, 145 375 L 145 335 C 85 335, 85 240, 140 240 Z"
                  fill={collarHex}
                  stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                  strokeWidth="2"
                />
                <path
                  d="M 140 200 C 45 200, 45 375, 145 375 L 145 335 C 85 335, 85 240, 140 240 Z"
                  fill="url(#mugHandleLighting)"
                />
              </g>
            )}

            {/* Mug Cylindrical Base & Body Wall */}
            <path
              d="M 135 155 L 140 435 C 140 460, 360 460, 360 435 L 365 155 Z"
              fill={hex}
              stroke={light ? "#E2E8F0" : "rgba(0,0,0,0.4)"}
              strokeWidth="2"
            />
            {/* Cylindrical 3D Lighting Overlay */}
            <path
              d="M 135 155 L 140 435 C 140 460, 360 460, 360 435 L 365 155 Z"
              fill="url(#mugBodyLighting)"
            />

            {/* Bottom Rounded Base Ring */}
            <ellipse
              cx="250"
              cy="435"
              rx="110"
              ry="22"
              fill={hex}
              stroke={light ? "#E2E8F0" : "rgba(0,0,0,0.4)"}
              strokeWidth="1.5"
            />

            {/* Top Outer Rim */}
            <ellipse
              cx="250"
              cy="155"
              rx="115"
              ry="24"
              fill={hex}
              stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
              strokeWidth="2"
            />

            {/* Inner Cup Opening / Depth Cavity */}
            <ellipse
              cx="250"
              cy="155"
              rx="103"
              ry="19"
              fill="url(#mugInnerCavity)"
            />

            {/* Ceramic Glaze Reflection Streak */}
            <rect
              x="185"
              y="178"
              width="14"
              height="240"
              rx="7"
              fill="#ffffff"
              opacity={light ? "0.45" : "0.25"}
            />

          </g>
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 3. EXECUTIVE LAPTOP BACKPACK / BAG SILHOUETTE
  // =========================================================================
  if (resolvedTemplate.type === 'bag') {
    return (
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
        <svg
          viewBox="0 0 500 580"
          className="w-full h-full max-h-[580px] drop-shadow-2xl transition-colors duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="backpackLighting" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={light ? "0.22" : "0.14"} />
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity={light ? "0.18" : "0.45"} />
            </radialGradient>
            <linearGradient id="strapLighting" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </linearGradient>
            <filter id="backpackShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="16" stdDeviation="16" floodOpacity="0.16" />
            </filter>
          </defs>

          {/* FRONT VIEW */}
          {side === 'front' ? (
            <g filter="url(#backpackShadow)">
              {/* Top Padded Grab Handle */}
              <path
                d="M 210 95 C 210 48, 290 48, 290 95"
                stroke={collarHex}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 218 95 C 218 56, 282 56, 282 95"
                stroke="#1E293B"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Main Backpack Outer Dome & Shell */}
              <path
                d="M 125 480 C 115 470, 115 280, 125 210 C 138 125, 190 90, 250 90 C 310 90, 362 125, 375 210 C 385 280, 385 470, 375 480 C 320 502, 180 502, 125 480 Z"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2.5"
              />
              {/* Lighting Overlay */}
              <path
                d="M 125 480 C 115 470, 115 280, 125 210 C 138 125, 190 90, 250 90 C 310 90, 362 125, 375 210 C 385 280, 385 470, 375 480 C 320 502, 180 502, 125 480 Z"
                fill="url(#backpackLighting)"
              />

              {/* Side Mesh Water Bottle Pockets */}
              <path
                d="M 116 325 C 108 340, 110 435, 122 455 L 126 345 Z"
                fill="#1E293B"
                opacity="0.85"
              />
              <path
                d="M 384 325 C 392 340, 390 435, 378 455 L 374 345 Z"
                fill="#1E293B"
                opacity="0.85"
              />

              {/* Main Laptop Zipper Arc */}
              <path
                d="M 145 220 C 158 145, 200 115, 250 115 C 300 115, 342 145, 355 220"
                stroke={collarLight ? "#64748B" : "#94A3B8"}
                strokeWidth="2.5"
                strokeDasharray="4 2"
                fill="none"
              />
              {/* Twin Metal Zipper Sliders */}
              <circle cx="242" cy="115" r="4.5" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <circle cx="258" cy="115" r="4.5" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />

              {/* Secondary Organizer Compartment Arc */}
              <path
                d="M 152 255 C 175 225, 325 225, 348 255"
                stroke={light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"}
                strokeWidth="2"
                fill="none"
              />

              {/* Lower Large Front Branding Pocket */}
              <rect
                x="150"
                y="270"
                width="200"
                height="185"
                rx="18"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
                strokeWidth="2"
              />
              {/* Pocket Lighting */}
              <rect
                x="150"
                y="270"
                width="200"
                height="185"
                rx="18"
                fill="url(#backpackLighting)"
              />
              {/* Front Pocket Horizontal Zipper Track */}
              <path
                d="M 165 292 L 335 292"
                stroke={collarLight ? "#64748B" : "#94A3B8"}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
              <circle cx="178" cy="292" r="3.5" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />

              {/* Reinforced Heavy-Duty Base Guard */}
              <path
                d="M 130 460 C 180 488, 320 488, 370 460 L 375 480 C 320 502, 180 502, 125 480 Z"
                fill={collarHex}
                opacity="0.9"
              />

            </g>
          ) : (
            /* BACK VIEW */
            <g filter="url(#backpackShadow)">
              {/* Outer Shell Silhouette */}
              <path
                d="M 125 480 C 115 470, 115 280, 125 210 C 138 125, 190 90, 250 90 C 310 90, 362 125, 375 210 C 385 280, 385 470, 375 480 C 320 502, 180 502, 125 480 Z"
                fill={hex}
                stroke={light ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2.5"
              />

              {/* Breathable Air-Mesh Back Ventilation Panels */}
              <rect
                x="170"
                y="150"
                width="65"
                height="140"
                rx="14"
                fill="#1E293B"
                opacity="0.8"
              />
              <rect
                x="265"
                y="150"
                width="65"
                height="140"
                rx="14"
                fill="#1E293B"
                opacity="0.8"
              />
              {/* Lower Lumbar Air-Mesh Cushion */}
              <rect
                x="165"
                y="330"
                width="170"
                height="95"
                rx="16"
                fill="#1E293B"
                opacity="0.85"
              />

              {/* S-Curve Padded Ergonomic Shoulder Straps */}
              {/* Left Shoulder Strap */}
              <path
                d="M 215 100 C 185 105, 135 240, 140 370 L 155 370 C 152 250, 198 125, 222 105 Z"
                fill={collarHex}
                stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
              />
              {/* Right Shoulder Strap */}
              <path
                d="M 285 100 C 315 105, 365 240, 360 370 L 345 370 C 348 250, 302 125, 278 105 Z"
                fill={collarHex}
                stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
              />

              {/* Chest Sternum Buckle Strap */}
              <rect
                x="150"
                y="265"
                width="200"
                height="12"
                rx="2"
                fill="#0F172A"
              />
              <rect
                x="240"
                y="260"
                width="20"
                height="22"
                rx="3"
                fill="#334155"
                stroke="#64748B"
                strokeWidth="1"
              />

            </g>
          )}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 4. GENERIC MERCHANDISE / PRODUCT IMAGE FALLBACK
  // =========================================================================
  // Hoodies have no dedicated silhouette yet: use the catalog product image instead of a polo drawing.
  if (resolvedTemplate.type === 'generic' || resolvedTemplate.type === 'hoodie') {
    const fallbackImg = product?.images?.[0];
    if (fallbackImg) {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-6 select-none">
          <div className="relative w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
            {/* Plain <img>: admin image URLs can be on any host */}
            <img
              src={fallbackImg}
              alt={product?.name || "Product Mockup"}
              className="absolute inset-0 w-full h-full object-contain p-4"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="p-4 bg-gray-100 rounded-2xl max-w-xs space-y-2 border border-gray-200">
          <p className="text-xs font-bold text-gray-700">Customization preview unavailable</p>
          <p className="text-[11px] text-gray-500">
            {product?.name ? `Template for ${product.name} will be prepared upon order.` : 'Visual preview is being prepared.'}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. T-SHIRTS & POLO APPAREL SILHOUETTE (DEFAULT)
  // =========================================================================
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      <svg
        viewBox="0 0 500 580"
        className="w-full h-full max-h-[580px] drop-shadow-xl transition-colors duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="shirtLighting" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={light ? "0.2" : "0.15"} />
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={light ? "0.15" : "0.4"} />
          </radialGradient>
          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* T-Shirt Body Path */}
        <g filter="url(#shadowFilter)">
          <path
            d={
              side === 'front'
                ? `M 170 50 
                   C 195 90, 305 90, 330 50 
                   L 440 100 
                   L 395 210 
                   L 350 185 
                   L 355 520 
                   L 145 520 
                   L 150 185 
                   L 105 210 
                   L 60 100 
                   Z`
                : `M 170 50 
                   C 210 65, 290 65, 330 50 
                   L 440 100 
                   L 395 210 
                   L 350 185 
                   L 355 520 
                   L 145 520 
                   L 150 185 
                   L 105 210 
                   L 60 100 
                   Z`
            }
            fill={hex}
            stroke={light ? "#E5E7EB" : "rgba(0,0,0,0.4)"}
            strokeWidth="2"
          />
        </g>

        {/* Realistic Lighting & Contour Overlay */}
        <path
          d={
            side === 'front'
              ? `M 170 50 C 195 90, 305 90, 330 50 L 440 100 L 395 210 L 350 185 L 355 520 L 145 520 L 150 185 L 105 210 L 60 100 Z`
              : `M 170 50 C 210 65, 290 65, 330 50 L 440 100 L 395 210 L 350 185 L 355 520 L 145 520 L 150 185 L 105 210 L 60 100 Z`
          }
          fill="url(#shirtLighting)"
        />

        {/* Sleeve Cuffs / Ribbing (Left & Right) */}
        <g>
          {/* Left sleeve cuff rib */}
          <path
            d="M 60 100 L 105 210 L 115 204 L 75 96 Z"
            fill={collarHex}
            stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
            strokeWidth="1.5"
          />
          {/* Right sleeve cuff rib */}
          <path
            d="M 440 100 L 395 210 L 385 204 L 425 96 Z"
            fill={collarHex}
            stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
            strokeWidth="1.5"
          />
        </g>

        {/* Collar & Neck Detail */}
        {side === 'front' ? (
          <g>
            {/* Inner Back Neck Crescent */}
            <path
              d="M 170 50 C 205 95, 295 95, 330 50 C 290 40, 210 40, 170 50 Z"
              fill="rgba(0,0,0,0.3)"
            />

            {/* Polo Placket under collar */}
            <rect
              x="241"
              y="70"
              width="18"
              height="80"
              rx="2"
              fill={collarHex}
              stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
              strokeWidth="1.5"
            />
            {/* Placket Buttons */}
            <circle cx="250" cy="92" r="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="250" cy="122" r="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

            {/* Polo Collar Wings / Ribbing */}
            <path
              d="M 170 50 C 205 95, 295 95, 330 50 C 300 70, 200 70, 170 50 Z"
              fill={collarHex}
              stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
              strokeWidth="2"
            />

            {/* Left Collar Flap */}
            <path
              d="M 170 50 L 220 110 L 244 85 L 205 58 Z"
              fill={collarHex}
              stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
              strokeWidth="1.5"
            />
            {/* Right Collar Flap */}
            <path
              d="M 330 50 L 280 110 L 256 85 L 295 58 Z"
              fill={collarHex}
              stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.4)"}
              strokeWidth="1.5"
            />
          </g>
        ) : (
          <g>
            {/* Back Neck Collar Band */}
            <path
              d="M 170 50 C 210 65, 290 65, 330 50 C 285 54, 215 54, 170 50 Z"
              fill={collarHex}
              stroke={collarLight ? "#CBD5E1" : "rgba(0,0,0,0.5)"}
              strokeWidth="2"
            />
          </g>
        )}

        {/* Sleeve Seams */}
        <path
          d="M 150 185 C 130 145, 115 110, 105 100"
          stroke={light ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)"}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <path
          d="M 350 185 C 370 145, 385 110, 395 100"
          stroke={light ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)"}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

      </svg>
    </div>
  );
};

/**
 * The product photo to show behind the design for one side: the admin's chosen front/back photo,
 * or (older products without a view configuration) the first/second catalog photo.
 */
export function getBackdropImage(product: any, side: "front" | "back"): string | null {
  return getCustomizerSideImage(product, side);
}

export const GarmentBackdrop: React.FC<GarmentBackdropProps> = (props) => {
  const url = getBackdropImage(props.product, props.side);
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);

  if (!url || failedUrl === url) return <SilhouetteBackdrop {...props} />;

  const alt = props.product?.name ? `${props.product.name} - ${props.side} view` : "Product";
  const templateId = props.product?.customizerTemplateId || props.product?.customizerTemplate?.id;
  const template = (templateId ? getReusableTemplateById(templateId) : null) || props.product?.customizerTemplate;
  const isTemplate = Boolean(template && template.active !== false);
  const photoClass = isTemplate ? "w-full h-full object-contain" : "w-full h-full object-contain mix-blend-multiply";
  // Masks configured for this side: the body/collar colours recolour the photo itself.
  const recolor = getSideRecolor(props.product, props.side);

  const productColors = getProductColors(props.product);
  const productCollarColors = getProductCollarColors(props.product);
  const bodyHex =
    productColors.find((c) => c.name.toLowerCase() === (props.color || '').toLowerCase())?.hex ||
    getColorHex(props.color);
  const trimHex =
    props.collarColor
      ? productCollarColors.find((c) => c.name.toLowerCase() === props.collarColor!.toLowerCase())?.hex ||
        getColorHex(props.collarColor)
      : bodyHex;

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      {recolor ? (
        <RecoloredPhoto
          source={recolor}
          bodyHex={bodyHex}
          trimHex={trimHex}
          alt={alt}
          className={photoClass}
          imgDataCy="customizer-product-photo"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <img
          src={url}
          alt={alt}
          data-cy="customizer-product-photo"
          draggable={false}
          onError={() => setFailedUrl(url)}
          className={photoClass}
        />
      )}
    </div>
  );
};

'use client';

import React from 'react';

interface GarmentBackdropProps {
  color: string;
  collarColor?: string;
  side: 'front' | 'back';
  category?: string;
}

// Map color names to nice hex values matching the studio palette
export const COLOR_HEX_MAP: Record<string, string> = {
  white: '#FFFFFF',
  red: '#FF0000',
  'charcoal black': '#2B2B2B',
  black: '#171717',
  yellow: '#FFD700',
  orange: '#FF7A00',
  green: '#00C853',
  gold: '#E5A100',
  'royal blue': '#0038FF',
  blue: '#0038FF',
  purple: '#5B0082',
  'sky blue': '#29B6F6',
  'hot pink': '#E91E63',
  pink: '#E91E63',
  maroon: '#7B1113',
  lime: '#AEEA00',
  'lime green': '#AEEA00',
  'navy blue': '#0D1333',
  navy: '#0D1333',
  'heather grey': '#9E9E9E',
  'heather gray': '#9E9E9E',
  grey: '#9E9E9E',
  gray: '#9E9E9E',
  'bottle green': '#0B3B24',
  'forest green': '#0B3B24',
  cream: '#FDF5E6',
  beige: '#FDF5E6',
};

export function getColorHex(colorName: string): string {
  if (!colorName) return '#2B2B2B';
  const clean = colorName.trim().toLowerCase();
  if (clean.startsWith('#') || clean.startsWith('rgb')) return clean;
  return COLOR_HEX_MAP[clean] || '#262626';
}

export function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160;
}

export const GarmentBackdrop: React.FC<GarmentBackdropProps> = ({
  color,
  collarColor,
  side,
  category,
}) => {
  const hex = getColorHex(color);
  const collarHex = getColorHex(collarColor || color);
  const light = isLightColor(hex);
  const collarLight = isLightColor(collarHex);

  // Dedicated Cap & Headwear Silhouette Renderer
  if (category?.toLowerCase().includes('cap')) {
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
              {/* Visor Lighting Overlay */}
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

              {/* Crown 3D Lighting Overlay */}
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

              {/* Front 3D Puff Embroidery / Branding Printable Area Outline */}
              <rect
                x="170"
                y="190"
                width="160"
                height="115"
                rx="8"
                fill="none"
                stroke={light ? "rgba(59, 111, 235, 0.5)" : "rgba(255, 255, 255, 0.45)"}
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x="250"
                y="180"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.5"
                fill={light ? "rgba(59, 111, 235, 0.8)" : "rgba(255, 255, 255, 0.75)"}
              >
                FRONT EMBROIDERY AREA (10cm × 5.5cm)
              </text>
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

              {/* Crown Lighting */}
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

              {/* Back Printable Area Outline */}
              <rect
                x="175"
                y="225"
                width="150"
                height="35"
                rx="6"
                fill="none"
                stroke={light ? "rgba(59, 111, 235, 0.5)" : "rgba(255, 255, 255, 0.45)"}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x="250"
                y="218"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.5"
                fill={light ? "rgba(59, 111, 235, 0.8)" : "rgba(255, 255, 255, 0.75)"}
              >
                BACK ARCH EMBROIDERY AREA
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }

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

        {/* Printable Area Dashed Outline */}
        <rect
          x="165"
          y="130"
          width="170"
          height="240"
          rx="6"
          fill="none"
          stroke={light ? "rgba(59, 111, 235, 0.4)" : "rgba(255, 255, 255, 0.35)"}
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text
          x="250"
          y="122"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.5"
          fill={light ? "rgba(59, 111, 235, 0.7)" : "rgba(255, 255, 255, 0.6)"}
        >
          {side.toUpperCase()} PRINTABLE AREA
        </text>
      </svg>
    </div>
  );
};

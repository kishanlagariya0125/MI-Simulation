import React from 'react';
import { Vehicle } from '../types';

interface VehicleIllustrationProps {
  vehicle: Vehicle;
  isEmergencyActive?: boolean;
}

/**
 * Top-down realistic 2D SVG illustrations for traffic simulation vehicles.
 * Includes passenger cars (sedans), SUVs, commercial delivery vans, and a distinct medical ambulance.
 */
export const VehicleIllustration: React.FC<VehicleIllustrationProps> = ({
  vehicle: v,
  isEmergencyActive = false,
}) => {
  // Determine rotation based on travel direction (0 deg = Northbound)
  let angle = 0;
  switch (v.direction) {
    case 'NORTH': angle = 180; break; // driving South (+y)
    case 'SOUTH': angle = 0;   break; // driving North (-y)
    case 'WEST':  angle = 90;  break; // driving East (+x)
    case 'EAST':  angle = 270; break; // driving West (-x)
  }

  const halfL = v.length / 2;
  const halfW = v.width / 2;

  // Brake light color: active brake red when stopped, subdued tail red when moving
  const tailLightColor = v.stopped ? '#DC2626' : '#991B1B';

  return (
    <g
      transform={`translate(${v.x}, ${v.y}) rotate(${angle})`}
      style={{ transition: 'transform 0.05s linear' }}
    >
      {/* 1. SOFT UNDERBODY SHADOW */}
      <rect
        x={-halfW + 1}
        y={-halfL + 2}
        width={v.width}
        height={v.length}
        rx={v.type === 'truck' || v.isAmbulance ? 3 : 5}
        fill="rgba(15, 23, 42, 0.38)"
      />

      {/* 2. SPECIFIC VEHICLE TYPE RENDERING */}
      {v.isAmbulance ? (
        /* ================= AMBULANCE ================= */
        <g id={`ambulance-${v.id}`}>
          {/* Subtle emergency wave aura when actively responding */}
          {isEmergencyActive && (
            <circle
              r={halfL + 12}
              fill="none"
              stroke="rgba(182, 64, 64, 0.3)"
              strokeWidth="2"
              className="pulse-badge"
            />
          )}

          {/* 4 Heavy-Duty Rubber Tires */}
          <rect x={-halfW - 1.5} y={-halfL + 6} width={2.5} height={8} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={-halfL + 6} width={2.5} height={8} rx={1} fill="#181B1F" />
          <rect x={-halfW - 1.5} y={halfL - 14} width={2.5} height={8} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={halfL - 14} width={2.5} height={8} rx={1} fill="#181B1F" />

          {/* Main Ambulance Body - Clinical White Chassis */}
          <rect
            x={-halfW}
            y={-halfL}
            width={v.width}
            height={v.length}
            rx={3}
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth={1}
          />

          {/* Front Bumper & Chrome Grille */}
          <path
            d={`M ${-halfW + 2} ${-halfL} Q 0 ${-halfL - 1} ${halfW - 2} ${-halfL}`}
            stroke="#94A3B8"
            strokeWidth={1.5}
            fill="none"
          />

          {/* Side Red Emergency Accent Stripes */}
          <rect x={-halfW + 0.5} y={-halfL + 12} width={1.8} height={v.length - 16} fill="#B64040" />
          <rect x={halfW - 2.3} y={-halfL + 12} width={1.8} height={v.length - 16} fill="#B64040" />

          {/* Rear Warning Chevrons on back step */}
          <rect x={-halfW + 2} y={halfL - 2} width={v.width - 4} height={1.8} fill="#B64040" />

          {/* Driver Cab Windshield */}
          <path
            d={`M ${-halfW + 2.5} ${-halfL + 4} 
               Q 0 ${-halfL + 2.5} ${halfW - 2.5} ${-halfL + 4} 
               L ${halfW - 2.5} ${-halfL + 9} 
               Q 0 ${-halfL + 8} ${-halfW + 2.5} ${-halfL + 9} Z`}
            fill="#273544"
          />

          {/* Driver & Passenger Cab Windows */}
          <rect x={-halfW + 1.2} y={-halfL + 9.5} width={1.8} height={5} rx={0.5} fill="#273544" />
          <rect x={halfW - 3} y={-halfL + 9.5} width={1.8} height={5} rx={0.5} fill="#273544" />

          {/* Cab Separation Line */}
          <line x1={-halfW + 2} y1={-halfL + 15} x2={halfW - 2} y2={-halfL + 15} stroke="#E2E8F0" strokeWidth={1} />

          {/* Prominent Red Medical Cross on White Patient Compartment Roof */}
          <g transform={`translate(0, ${-halfL + 24})`}>
            {/* White disc backing for high contrast */}
            <circle r={7.5} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={0.8} />
            {/* Vertical Bar */}
            <rect x={-2} y={-5.5} width={4} height={11} rx={0.5} fill="#B64040" />
            {/* Horizontal Bar */}
            <rect x={-5.5} y={-2} width={11} height={4} rx={0.5} fill="#B64040" />
          </g>

          {/* Rear Patient Cabin Windows */}
          <rect x={-halfW + 3} y={halfL - 4.5} width={5} height={2} rx={0.5} fill="#273544" />
          <rect x={halfW - 8} y={halfL - 4.5} width={5} height={2} rx={0.5} fill="#273544" />

          {/* Roof Emergency Lightbar (Blue & Red Strobe Units) */}
          <g transform={`translate(0, ${-halfL + 8.5})`}>
            {/* Chrome Bar Base */}
            <rect x={-halfW + 4} y={-1.5} width={v.width - 8} height={3} rx={1} fill="#334155" />
            {/* Red Strobe Lamp (Left) */}
            <rect
              x={-halfW + 4.5}
              y={-1.2}
              width={(v.width - 9) / 2 - 1}
              height={2.4}
              rx={0.8}
              fill="#DC2626"
              className={isEmergencyActive ? 'siren-active' : undefined}
            />
            {/* Blue Strobe Lamp (Right) */}
            <rect
              x={0.5}
              y={-1.2}
              width={(v.width - 9) / 2 - 1}
              height={2.4}
              rx={0.8}
              fill="#2563EB"
              className={isEmergencyActive ? 'siren-active' : undefined}
            />
          </g>

          {/* Rear Auxiliary Corner Warning Pods */}
          <circle cx={-halfW + 2} cy={halfL - 2} r={1} fill={isEmergencyActive ? '#DC2626' : '#991B1B'} />
          <circle cx={halfW - 2} cy={halfL - 2} r={1} fill={isEmergencyActive ? '#2563EB' : '#1D4ED8'} />

          {/* Headlights (Warm Halogen / Xenon) */}
          <circle cx={-halfW + 2.5} cy={-halfL + 0.8} r={1.3} fill="#FEF08A" />
          <circle cx={halfW - 2.5} cy={-halfL + 0.8} r={1.3} fill="#FEF08A" />

          {/* Tail Lights */}
          <circle cx={-halfW + 2} cy={halfL - 0.8} r={1.2} fill={tailLightColor} />
          <circle cx={halfW - 2} cy={halfL - 0.8} r={1.2} fill={tailLightColor} />
        </g>
      ) : v.type === 'truck' ? (
        /* ================= COMMERCIAL DELIVERY VAN / UTILITY ================= */
        <g id={`van-${v.id}`}>
          {/* 4 Rubber Tires */}
          <rect x={-halfW - 1.2} y={-halfL + 6} width={2.2} height={8} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={-halfL + 6} width={2.2} height={8} rx={1} fill="#181B1F" />
          <rect x={-halfW - 1.2} y={halfL - 14} width={2.2} height={8} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={halfL - 14} width={2.2} height={8} rx={1} fill="#181B1F" />

          {/* Van Body */}
          <rect
            x={-halfW}
            y={-halfL}
            width={v.width}
            height={v.length}
            rx={3}
            fill={v.color}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1}
          />

          {/* Front Bumper */}
          <rect x={-halfW + 1} y={-halfL} width={v.width - 2} height={1.5} rx={0.5} fill="#334155" />

          {/* Cab Windshield */}
          <path
            d={`M ${-halfW + 2.5} ${-halfL + 3.5} 
               Q 0 ${-halfL + 2} ${halfW - 2.5} ${-halfL + 3.5} 
               L ${halfW - 2.5} ${-halfL + 8} 
               Q 0 ${-halfL + 7} ${-halfW + 2.5} ${-halfL + 8} Z`}
            fill="#1E293B"
          />

          {/* Cab Side Windows */}
          <rect x={-halfW + 1} y={-halfL + 8.5} width={1.8} height={4.5} rx={0.5} fill="#1E293B" />
          <rect x={halfW - 2.8} y={-halfL + 8.5} width={1.8} height={4.5} rx={0.5} fill="#1E293B" />

          {/* Cab Separation Groove */}
          <line x1={-halfW + 1} y1={-halfL + 14} x2={halfW - 1} y2={-halfL + 14} stroke="rgba(0,0,0,0.18)" strokeWidth={1} />

          {/* Roof Cargo Ribs (Structural Ridges) */}
          <line x1={-halfW + 4} y1={-halfL + 17} x2={-halfW + 4} y2={halfL - 5} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
          <line x1={0} y1={-halfL + 17} x2={0} y2={halfL - 5} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
          <line x1={halfW - 4} y1={-halfL + 17} x2={halfW - 4} y2={halfL - 5} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />

          {/* Rear Cargo Doors Split */}
          <line x1={0} y1={halfL - 6} x2={0} y2={halfL} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          <rect x={-1} y={halfL - 3} width={2} height={1} fill="#475569" />

          {/* Headlights */}
          <circle cx={-halfW + 2.5} cy={-halfL + 1} r={1.2} fill="#FEF08A" />
          <circle cx={halfW - 2.5} cy={-halfL + 1} r={1.2} fill="#FEF08A" />

          {/* Tail Lights */}
          <rect x={-halfW + 1} y={halfL - 2} width={1.8} height={1.5} rx={0.5} fill={tailLightColor} />
          <rect x={halfW - 2.8} y={halfL - 2} width={1.8} height={1.5} rx={0.5} fill={tailLightColor} />
        </g>
      ) : v.type === 'suv' ? (
        /* ================= SUV / CROSSOVER ================= */
        <g id={`suv-${v.id}`}>
          {/* 4 Wider SUV Tires */}
          <rect x={-halfW - 1.2} y={-halfL + 5} width={2.2} height={7} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={-halfL + 5} width={2.2} height={7} rx={1} fill="#181B1F" />
          <rect x={-halfW - 1.2} y={halfL - 12} width={2.2} height={7} rx={1} fill="#181B1F" />
          <rect x={halfW - 1} y={halfL - 12} width={2.2} height={7} rx={1} fill="#181B1F" />

          {/* SUV Body Shell */}
          <rect
            x={-halfW}
            y={-halfL}
            width={v.width}
            height={v.length}
            rx={4}
            fill={v.color}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth={1}
          />

          {/* Front Hood Contours */}
          <path
            d={`M ${-halfW + 4} ${-halfL + 1} L ${-halfW + 5} ${-halfL + 6}`}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.8}
          />
          <path
            d={`M ${halfW - 4} ${-halfL + 1} L ${halfW - 5} ${-halfL + 6}`}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.8}
          />

          {/* Front Panoramic Windshield */}
          <path
            d={`M ${-halfW + 2.5} ${-halfL + 7} 
               Q 0 ${-halfL + 5.5} ${halfW - 2.5} ${-halfL + 7} 
               L ${halfW - 3} ${-halfL + 12} 
               Q 0 ${-halfL + 11} ${-halfW + 3} ${-halfL + 12} Z`}
            fill="#1E293B"
          />

          {/* Side Mirrors */}
          <rect x={-halfW - 2} y={-halfL + 7} width={2} height={2.5} rx={0.6} fill={v.color} stroke="#1E293B" strokeWidth={0.5} />
          <rect x={halfW} y={-halfL + 7} width={2} height={2.5} rx={0.6} fill={v.color} stroke="#1E293B" strokeWidth={0.5} />

          {/* Darker Side Windows (Privacy Glass) */}
          <rect x={-halfW + 1.2} y={-halfL + 12.5} width={1.8} height={12} rx={0.5} fill="#0F172A" />
          <rect x={halfW - 3} y={-halfL + 12.5} width={1.8} height={12} rx={0.5} fill="#0F172A" />

          {/* Silver Roof Rails */}
          <rect x={-halfW + 3.2} y={-halfL + 12} width={1} height={15} rx={0.5} fill="#94A3B8" />
          <rect x={halfW - 4.2} y={-halfL + 12} width={1} height={15} rx={0.5} fill="#94A3B8" />

          {/* Sunroof Outline */}
          <rect x={-3.5} y={-halfL + 13} width={7} height={6} rx={1} fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />

          {/* Rear Window & Spoiler Lip */}
          <rect x={-halfW + 3} y={halfL - 8} width={v.width - 6} height={3.5} rx={1} fill="#0F172A" />
          <rect x={-halfW + 2} y={halfL - 9} width={v.width - 4} height={1.2} fill="rgba(0,0,0,0.3)" />

          {/* Headlights */}
          <circle cx={-halfW + 2.5} cy={-halfL + 1} r={1.2} fill="#FEF08A" />
          <circle cx={halfW - 2.5} cy={-halfL + 1} r={1.2} fill="#FEF08A" />

          {/* Tail Lights */}
          <rect x={-halfW + 1} y={halfL - 1.8} width={2.5} height={1.2} rx={0.4} fill={tailLightColor} />
          <rect x={halfW - 3.5} y={halfL - 1.8} width={2.5} height={1.2} rx={0.4} fill={tailLightColor} />
        </g>
      ) : (
        /* ================= PASSENGER CAR (SEDAN / COMPACT) ================= */
        <g id={`sedan-${v.id}`}>
          {/* 4 Tucked Rubber Wheels */}
          <rect x={-halfW - 1} y={-halfL + 5} width={1.8} height={6.5} rx={0.8} fill="#181B1F" />
          <rect x={halfW - 0.8} y={-halfL + 5} width={1.8} height={6.5} rx={0.8} fill="#181B1F" />
          <rect x={-halfW - 1} y={halfL - 11} width={1.8} height={6.5} rx={0.8} fill="#181B1F" />
          <rect x={halfW - 0.8} y={halfL - 11} width={1.8} height={6.5} rx={0.8} fill="#181B1F" />

          {/* Aerodynamic Sedan Body Shell */}
          <rect
            x={-halfW}
            y={-halfL}
            width={v.width}
            height={v.length}
            rx={4}
            fill={v.color}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={1}
          />

          {/* Front Curved Windshield */}
          <path
            d={`M ${-halfW + 2.2} ${-halfL + 6.5} 
               Q 0 ${-halfL + 5} ${halfW - 2.2} ${-halfL + 6.5} 
               L ${halfW - 2.5} ${-halfL + 11} 
               Q 0 ${-halfL + 10} ${-halfW + 2.5} ${-halfL + 11} Z`}
            fill="#1E293B"
          />

          {/* Side Mirrors */}
          <rect x={-halfW - 1.6} y={-halfL + 6.5} width={1.6} height={2} rx={0.5} fill={v.color} stroke="#1E293B" strokeWidth={0.5} />
          <rect x={halfW} y={-halfL + 6.5} width={1.6} height={2} rx={0.5} fill={v.color} stroke="#1E293B" strokeWidth={0.5} />

          {/* Side Windows */}
          <rect x={-halfW + 1} y={-halfL + 11.5} width={1.6} height={10} rx={0.5} fill="#1E293B" />
          <rect x={halfW - 2.6} y={-halfL + 11.5} width={1.6} height={10} rx={0.5} fill="#1E293B" />

          {/* B-Pillars divider */}
          <rect x={-halfW + 1} y={-halfL + 16} width={1.6} height={1} fill={v.color} />
          <rect x={halfW - 2.6} y={-halfL + 16} width={1.6} height={1} fill={v.color} />

          {/* Roof Panel */}
          <rect x={-halfW + 2.6} y={-halfL + 11} width={v.width - 5.2} height={10.5} rx={1} fill="rgba(255,255,255,0.08)" />

          {/* Rear Window */}
          <path
            d={`M ${-halfW + 2.5} ${-halfL + 21.5} 
               Q 0 ${-halfL + 22.5} ${halfW - 2.5} ${-halfL + 21.5} 
               L ${halfW - 2.8} ${-halfL + 25} 
               Q 0 ${-halfL + 26} ${-halfW + 2.8} ${-halfL + 25} Z`}
            fill="#1E293B"
          />

          {/* Trunk Lid Section */}
          <rect x={-halfW + 2} y={halfL - 5} width={v.width - 4} height={4} rx={1} fill="rgba(0,0,0,0.06)" />

          {/* Headlights */}
          <circle cx={-halfW + 2.2} cy={-halfL + 0.8} r={1.1} fill="#FEF08A" />
          <circle cx={halfW - 2.2} cy={-halfL + 0.8} r={1.1} fill="#FEF08A" />

          {/* Tail Lights */}
          <circle cx={-halfW + 2} cy={halfL - 0.8} r={1.1} fill={tailLightColor} />
          <circle cx={halfW - 2} cy={halfL - 0.8} r={1.1} fill={tailLightColor} />
        </g>
      )}
    </g>
  );
};

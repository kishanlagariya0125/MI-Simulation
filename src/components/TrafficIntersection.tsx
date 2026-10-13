import React from 'react';
import {
  Direction,
  IntersectionSignalState,
  PedestrianAgent,
  SimulationPhase,
  Vehicle,
} from '../types';
import { TrafficLight } from './TrafficLight';
import { VehicleIllustration } from './VehicleIllustration';
import { AlertTriangle, ShieldAlert, Footprints } from 'lucide-react';

interface TrafficIntersectionProps {
  phase: SimulationPhase;
  phaseRemainingTime: number;
  signals: IntersectionSignalState;
  vehicles: Vehicle[];
  pedestrians: PedestrianAgent[];
  activeEmergencyDirection: Direction | null;
}

export const TrafficIntersection: React.FC<TrafficIntersectionProps> = React.memo(({
  phase,
  phaseRemainingTime,
  signals,
  vehicles,
  pedestrians,
  activeEmergencyDirection,
}) => {
  const isEmergency = phase === 'EMERGENCY_PRIORITY';
  const isPedestrian = phase === 'PEDESTRIAN_CROSSING';
  const isAllRed = phase === 'ALL_RED';

  // Render Pedestrian Agent on crosswalk
  const renderPedestrian = (p: PedestrianAgent) => {
    let x = 0;
    let y = 0;

    switch (p.crosswalk) {
      case 'NS_TOP':
        x = 230 + p.progress * 140;
        y = 195;
        break;
      case 'NS_BOTTOM':
        x = 230 + p.progress * 140;
        y = 405;
        break;
      case 'EW_LEFT':
        x = 195;
        y = 230 + p.progress * 140;
        break;
      case 'EW_RIGHT':
        x = 405;
        y = 230 + p.progress * 140;
        break;
    }

    return (
      <g key={p.id} transform={`translate(${x}, ${y})`}>
        {/* Soft shadow */}
        <circle r={4.5} cy={1} fill="rgba(0,0,0,0.3)" />
        {/* Pedestrian Head & Body */}
        <circle r={4.2} fill={p.color} stroke="#FFFFFF" strokeWidth="1" />
        <circle cy={-0.8} r={1.8} fill="#FFFFFF" />
      </g>
    );
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Top Banner Status (Emergency / Walk / All Red / Normal) */}
      <div style={{ width: '100%', minHeight: '38px', marginBottom: '0.85rem', display: 'flex', justifyContent: 'center' }}>
        {isEmergency && (
          <div
            className="emergency-banner-bg"
            style={{
              width: '100%',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 8px rgba(182, 64, 64, 0.25)',
            }}
          >
            <ShieldAlert size={18} className="pulse-badge" />
            <span>EMERGENCY PRIORITY: {activeEmergencyDirection} AMBULANCE PASSING</span>
            <span
              className="font-mono"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                padding: '0.1rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {Math.ceil(phaseRemainingTime)}s
            </span>
          </div>
        )}

        {isPedestrian && (
          <div
            style={{
              width: '100%',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#47785C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 8px rgba(71, 120, 92, 0.25)',
            }}
          >
            <Footprints size={18} />
            <span>PEDESTRIAN CROSSING ACTIVE (WALK) — VEHICLES STOPPED</span>
            <span
              className="font-mono"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '0.1rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {Math.ceil(phaseRemainingTime)}s
            </span>
          </div>
        )}

        {isAllRed && !isEmergency && !isPedestrian && (
          <div
            style={{
              width: '100%',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#FDF0F0',
              border: '1px solid #F3C4C4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: '#B64040',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
            }}
          >
            <AlertTriangle size={17} />
            <span>SAFETY INTERVAL: ALL DIRECTIONS RED</span>
            <span
              className="font-mono"
              style={{
                backgroundColor: '#B64040',
                color: '#FFFFFF',
                padding: '0.1rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {Math.ceil(phaseRemainingTime)}s
            </span>
          </div>
        )}

        {!isEmergency && !isPedestrian && !isAllRed && (
          <div
            style={{
              width: '100%',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#E5EDF4',
              border: '1px solid #D6DCE2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              color: '#28323D',
            }}
          >
            <span>
              Active Phase: <strong style={{ color: '#365D7A' }}>{phase.replace('_', ' ')}</strong>
            </span>
            <span style={{ color: '#65717D', fontSize: '0.75rem' }}>Conflicting directions isolated</span>
            <span className="font-mono" style={{ color: '#365D7A', fontWeight: 700 }}>
              Remaining: {Math.ceil(phaseRemainingTime)}s
            </span>
          </div>
        )}
      </div>

      {/* Main Intersection Display with SVG Canvas & Corner Traffic Lights */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          aspectRatio: '1 / 1',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#E2E6EA',
          border: '1px solid #D6DCE2',
          boxShadow: 'inset 0 1px 4px rgba(40, 50, 61, 0.08)',
        }}
      >
        {/* SVG Road Layout, Markings, Pedestrians, and Realistic Vehicles */}
        <svg
          viewBox="0 0 600 600"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Ground / Pavement Surface */}
          <rect width="600" height="600" fill="#E2E6EA" />

          {/* Corner Curbs / Concrete Sidewalk Islands */}
          <rect x="0" y="0" width="220" height="220" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" rx="8" />
          <rect x="380" y="0" width="220" height="220" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" rx="8" />
          <rect x="0" y="380" width="220" height="220" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" rx="8" />
          <rect x="380" y="380" width="220" height="220" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" rx="8" />

          {/* Road Asphalt: North-South Road */}
          <rect x="220" y="0" width="160" height="600" fill="#2A313C" />

          {/* Road Asphalt: East-West Road */}
          <rect x="0" y="220" width="600" height="160" fill="#2A313C" />

          {/* Central Intersection Junction Box */}
          <rect x="220" y="220" width="160" height="160" fill="#2F3844" />

          {/* Subtle Yellow Box Junction Hatching */}
          <g opacity="0.12">
            <line x1="220" y1="220" x2="380" y2="380" stroke="#C18B45" strokeWidth="2" strokeDasharray="8 8" />
            <line x1="220" y1="380" x2="380" y2="220" stroke="#C18B45" strokeWidth="2" strokeDasharray="8 8" />
            <rect x="225" y="225" width="150" height="150" fill="none" stroke="#C18B45" strokeWidth="2" />
          </g>

          {/* Double Yellow Continuous Centerlines (Muted Amber Road Yellow) */}
          {/* North Road Centerline */}
          <line x1="298" y1="0" x2="298" y2="180" stroke="#C18B45" strokeWidth="2" />
          <line x1="302" y1="0" x2="302" y2="180" stroke="#C18B45" strokeWidth="2" />

          {/* South Road Centerline */}
          <line x1="298" y1="420" x2="298" y2="600" stroke="#C18B45" strokeWidth="2" />
          <line x1="302" y1="420" x2="302" y2="600" stroke="#C18B45" strokeWidth="2" />

          {/* West Road Centerline */}
          <line x1="0" y1="298" x2="180" y2="298" stroke="#C18B45" strokeWidth="2" />
          <line x1="0" y1="302" x2="180" y2="302" stroke="#C18B45" strokeWidth="2" />

          {/* East Road Centerline */}
          <line x1="420" y1="298" x2="600" y2="298" stroke="#C18B45" strokeWidth="2" />
          <line x1="420" y1="302" x2="600" y2="302" stroke="#C18B45" strokeWidth="2" />

          {/* White Dashed Lane Dividers */}
          {/* North Road: x=260 and x=340 */}
          <line x1="260" y1="0" x2="260" y2="180" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="340" y1="0" x2="340" y2="180" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />

          {/* South Road: x=260 and x=340 */}
          <line x1="260" y1="420" x2="260" y2="600" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="340" y1="420" x2="340" y2="600" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />

          {/* West Road: y=260 and y=340 */}
          <line x1="0" y1="260" x2="180" y2="260" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="0" y1="340" x2="180" y2="340" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />

          {/* East Road: y=260 and y=340 */}
          <line x1="420" y1="260" x2="600" y2="260" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="420" y1="340" x2="600" y2="340" stroke="#D6DCE2" strokeWidth="2" strokeDasharray="8 8" />

          {/* Zebra Pedestrian Crossings (Clean White Stripes) */}
          {/* North Crosswalk: y in [185, 205] */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`cw-n-${i}`} x={226 + i * 17} y={185} width={10} height={20} fill="#FFFFFF" opacity={isPedestrian ? 1 : 0.75} />
          ))}

          {/* South Crosswalk: y in [395, 415] */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`cw-s-${i}`} x={226 + i * 17} y={395} width={10} height={20} fill="#FFFFFF" opacity={isPedestrian ? 1 : 0.75} />
          ))}

          {/* West Crosswalk: x in [185, 205] */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`cw-w-${i}`} x={185} y={226 + i * 17} width={20} height={10} fill="#FFFFFF" opacity={isPedestrian ? 1 : 0.75} />
          ))}

          {/* East Crosswalk: x in [395, 415] */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={`cw-e-${i}`} x={395} y={226 + i * 17} width={20} height={10} fill="#FFFFFF" opacity={isPedestrian ? 1 : 0.75} />
          ))}

          {/* Solid White Stop Lines */}
          <line x1="220" y1="210" x2="300" y2="210" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="300" y1="390" x2="380" y2="390" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="210" y1="300" x2="210" y2="380" stroke="#FFFFFF" strokeWidth="4" />
          <line x1="390" y1="220" x2="390" y2="300" stroke="#FFFFFF" strokeWidth="4" />

          {/* Direction Compass Labels */}
          <text x="300" y="28" fill="#65717D" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1.5">
            ▲ NORTH (N)
          </text>
          <text x="300" y="585" fill="#65717D" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1.5">
            ▼ SOUTH (S)
          </text>
          <text x="32" y="304" fill="#65717D" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1.5">
            ◄ WEST (W)
          </text>
          <text x="568" y="304" fill="#65717D" fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="1.5">
            EAST (E) ►
          </text>

          {/* Crossing Pedestrians */}
          {pedestrians.map(renderPedestrian)}

          {/* Realistic Top-Down Vehicles & Distinct Ambulance */}
          {vehicles.map((v) => (
            <VehicleIllustration
              key={v.id}
              vehicle={v}
              isEmergencyActive={isEmergency && signals.emergencyDirection === v.direction}
            />
          ))}
        </svg>

        {/* 4 Corner Traffic Light Signal Heads */}
        {/* NORTH APPROACH SIGNAL (Top Left Quadrant) */}
        <div style={{ position: 'absolute', top: '155px', left: '145px', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <TrafficLight
            directionLabel="NORTH"
            state={signals.nsLight}
            countdownSeconds={signals.nsLight !== 'RED' ? phaseRemainingTime : undefined}
            isEmergencyPriority={signals.emergencyActive && signals.emergencyAxis === 'NS'}
          />
        </div>

        {/* SOUTH APPROACH SIGNAL (Bottom Right Quadrant) */}
        <div style={{ position: 'absolute', bottom: '155px', right: '145px', transform: 'translate(50%, 50%)', zIndex: 10 }}>
          <TrafficLight
            directionLabel="SOUTH"
            state={signals.nsLight}
            countdownSeconds={signals.nsLight !== 'RED' ? phaseRemainingTime : undefined}
            isEmergencyPriority={signals.emergencyActive && signals.emergencyAxis === 'NS'}
          />
        </div>

        {/* WEST APPROACH SIGNAL (Bottom Left Quadrant) */}
        <div style={{ position: 'absolute', bottom: '145px', left: '155px', transform: 'translate(-50%, 50%)', zIndex: 10 }}>
          <TrafficLight
            directionLabel="WEST"
            state={signals.ewLight}
            countdownSeconds={signals.ewLight !== 'RED' ? phaseRemainingTime : undefined}
            isEmergencyPriority={signals.emergencyActive && signals.emergencyAxis === 'EW'}
          />
        </div>

        {/* EAST APPROACH SIGNAL (Top Right Quadrant) */}
        <div style={{ position: 'absolute', top: '145px', right: '155px', transform: 'translate(50%, -50%)', zIndex: 10 }}>
          <TrafficLight
            directionLabel="EAST"
            state={signals.ewLight}
            countdownSeconds={signals.ewLight !== 'RED' ? phaseRemainingTime : undefined}
            isEmergencyPriority={signals.emergencyActive && signals.emergencyAxis === 'EW'}
          />
        </div>

      </div>
    </div>
  );
});

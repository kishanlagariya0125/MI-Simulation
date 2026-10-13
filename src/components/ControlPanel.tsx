import React from 'react';
import {
  Direction,
  EmergencyRequest,
  OperationMode,
  RoadAxis,
  SimulationPhase,
  TrafficDensity,
} from '../types';
import {
  Siren,
  Footprints,
  SlidersHorizontal,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Radio,
} from 'lucide-react';

interface ControlPanelProps {
  mode: OperationMode;
  density: TrafficDensity;
  phase: SimulationPhase;
  phaseRemainingTime: number;
  manualSelectedAxis: RoadAxis;
  pendingAmbulances: EmergencyRequest[];
  pendingPedestriansCount: number;
  onSetMode: (mode: OperationMode) => void;
  onSetDensity: (density: TrafficDensity) => void;
  onTriggerManualRoad: (axis: RoadAxis) => void;
  onRequestAmbulance: (dir: Direction) => void;
  onRequestPedestrian: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  density,
  phase,
  phaseRemainingTime,
  manualSelectedAxis,
  pendingAmbulances,
  pendingPedestriansCount,
  onSetMode,
  onSetDensity,
  onTriggerManualRoad,
  onRequestAmbulance,
  onRequestPedestrian,
}) => {
  // Count pending ambulances by direction
  const pendingByDir = {
    NORTH: pendingAmbulances.filter((r) => r.direction === 'NORTH').length,
    SOUTH: pendingAmbulances.filter((r) => r.direction === 'SOUTH').length,
    EAST: pendingAmbulances.filter((r) => r.direction === 'EAST').length,
    WEST: pendingAmbulances.filter((r) => r.direction === 'WEST').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* 1. OPERATING MODE & DENSITY CARD */}
      <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <SlidersHorizontal size={18} color="#365D7A" />
          <h2 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#28323D' }}>
            OPERATING MODE & TRAFFIC DENSITY
          </h2>
        </div>

        {/* Mode Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#65717D', marginBottom: '0.45rem' }}>
            Operating Mode (Assembly 'M' Toggle):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              id="btn-mode-auto"
              onClick={() => onSetMode('AUTOMATIC')}
              style={{
                padding: '0.6rem',
                borderRadius: '6px',
                border: mode === 'AUTOMATIC' ? '2px solid #365D7A' : '1px solid #D6DCE2',
                backgroundColor: mode === 'AUTOMATIC' ? '#E5EDF4' : '#FFFFFF',
                color: mode === 'AUTOMATIC' ? '#28323D' : '#65717D',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Radio size={14} color={mode === 'AUTOMATIC' ? '#365D7A' : '#A0A8B0'} />
                <span>AUTOMATIC</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#65717D', fontWeight: 400 }}>Continuous NS & EW cycle</span>
            </button>

            <button
              id="btn-mode-manual"
              onClick={() => onSetMode('MANUAL')}
              style={{
                padding: '0.6rem',
                borderRadius: '6px',
                border: mode === 'MANUAL' ? '2px solid #365D7A' : '1px solid #D6DCE2',
                backgroundColor: mode === 'MANUAL' ? '#E5EDF4' : '#FFFFFF',
                color: mode === 'MANUAL' ? '#28323D' : '#65717D',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Compass size={14} color={mode === 'MANUAL' ? '#365D7A' : '#A0A8B0'} />
                <span>MANUAL</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#65717D', fontWeight: 400 }}>Operator road selection</span>
            </button>
          </div>
        </div>

        {/* Traffic Density Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#65717D', marginBottom: '0.45rem' }}>
            Traffic Density (Assembly 'L', 'M', 'H'):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[
              { key: 'LOW' as const, label: 'LOW', seconds: '5s', desc: 'Light' },
              { key: 'MEDIUM' as const, label: 'MEDIUM', seconds: '8s', desc: 'Standard' },
              { key: 'HIGH' as const, label: 'HIGH', seconds: '12s', desc: 'Dense' },
            ].map((d) => (
              <button
                key={d.key}
                id={`btn-density-${d.key.toLowerCase()}`}
                onClick={() => onSetDensity(d.key)}
                style={{
                  padding: '0.55rem 0.35rem',
                  borderRadius: '6px',
                  border: density === d.key ? '2px solid #365D7A' : '1px solid #D6DCE2',
                  backgroundColor: density === d.key ? '#E5EDF4' : '#FFFFFF',
                  color: density === d.key ? '#28323D' : '#65717D',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>{d.label}</div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: density === d.key ? '#365D7A' : '#A0A8B0', fontWeight: 600 }}>
                  {d.seconds} green
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MANUAL ROAD SELECTION */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          backgroundColor: '#FFFFFF',
          opacity: mode === 'MANUAL' ? 1 : 0.65,
          border: mode === 'MANUAL' ? '1px solid #BDD3E6' : '1px solid #D6DCE2',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} color="#365D7A" />
            <h2 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#28323D' }}>
              MANUAL ROAD TRIGGER
            </h2>
          </div>
          {mode !== 'MANUAL' && (
            <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
              Requires Manual Mode
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.75rem', color: '#65717D', marginBottom: '0.75rem' }}>
          Select corridor to grant green light. Safety intervals are strictly enforced before switching.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <button
            id="btn-manual-ns"
            onClick={() => onTriggerManualRoad('NS')}
            disabled={mode !== 'MANUAL'}
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              border: manualSelectedAxis === 'NS' ? '2px solid #365D7A' : '1px solid #D6DCE2',
              backgroundColor: manualSelectedAxis === 'NS' ? '#E5EDF4' : '#FFFFFF',
              color: manualSelectedAxis === 'NS' ? '#28323D' : '#65717D',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: mode === 'MANUAL' ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <ArrowUp size={16} color={manualSelectedAxis === 'NS' ? '#365D7A' : '#65717D'} />
              <ArrowDown size={16} color={manualSelectedAxis === 'NS' ? '#365D7A' : '#65717D'} />
            </div>
            <span>NORTH / SOUTH (N)</span>
          </button>

          <button
            id="btn-manual-ew"
            onClick={() => onTriggerManualRoad('EW')}
            disabled={mode !== 'MANUAL'}
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              border: manualSelectedAxis === 'EW' ? '2px solid #365D7A' : '1px solid #D6DCE2',
              backgroundColor: manualSelectedAxis === 'EW' ? '#E5EDF4' : '#FFFFFF',
              color: manualSelectedAxis === 'EW' ? '#28323D' : '#65717D',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: mode === 'MANUAL' ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <ArrowLeft size={16} color={manualSelectedAxis === 'EW' ? '#365D7A' : '#65717D'} />
              <ArrowRight size={16} color={manualSelectedAxis === 'EW' ? '#365D7A' : '#65717D'} />
            </div>
            <span>EAST / WEST (E)</span>
          </button>
        </div>
      </div>

      {/* 3. AMBULANCE EMERGENCY CALLS (PRIORITY 1) */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #F3C4C4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Siren size={20} color="#B64040" />
            <h2 className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, color: '#B64040' }}>
              AMBULANCE EMERGENCY REQUESTS
            </h2>
          </div>
          {pendingAmbulances.length > 0 && (
            <span className="badge badge-danger">
              {pendingAmbulances.length} QUEUED
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.725rem', color: '#65717D', marginBottom: '0.85rem' }}>
          Preempts ordinary traffic. Multiple requests are deterministically queued in FIFO order.
        </p>

        {/* 4 Directional Emergency Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
          
          {/* North Ambulance (B) */}
          <button
            id="btn-amb-north"
            className="btn-danger"
            onClick={() => onRequestAmbulance('NORTH')}
            style={{
              padding: '0.75rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowDown size={16} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>NORTH [B]</div>
                <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>Approaching South</div>
              </div>
            </div>
            {pendingByDir.NORTH > 0 && (
              <span style={{ backgroundColor: '#FFFFFF', color: '#B64040', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
                {pendingByDir.NORTH}
              </span>
            )}
          </button>

          {/* South Ambulance (C) */}
          <button
            id="btn-amb-south"
            className="btn-danger"
            onClick={() => onRequestAmbulance('SOUTH')}
            style={{
              padding: '0.75rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUp size={16} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>SOUTH [C]</div>
                <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>Approaching North</div>
              </div>
            </div>
            {pendingByDir.SOUTH > 0 && (
              <span style={{ backgroundColor: '#FFFFFF', color: '#B64040', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
                {pendingByDir.SOUTH}
              </span>
            )}
          </button>

          {/* East Ambulance (D) */}
          <button
            id="btn-amb-east"
            className="btn-danger"
            onClick={() => onRequestAmbulance('EAST')}
            style={{
              padding: '0.75rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>EAST [D]</div>
                <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>Approaching West</div>
              </div>
            </div>
            {pendingByDir.EAST > 0 && (
              <span style={{ backgroundColor: '#FFFFFF', color: '#B64040', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
                {pendingByDir.EAST}
              </span>
            )}
          </button>

          {/* West Ambulance (E) */}
          <button
            id="btn-amb-west"
            className="btn-danger"
            onClick={() => onRequestAmbulance('WEST')}
            style={{
              padding: '0.75rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowRight size={16} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>WEST [E]</div>
                <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>Approaching East</div>
              </div>
            </div>
            {pendingByDir.WEST > 0 && (
              <span style={{ backgroundColor: '#FFFFFF', color: '#B64040', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>
                {pendingByDir.WEST}
              </span>
            )}
          </button>
        </div>

        {/* 4. PEDESTRIAN CROSSING BUTTON (P) */}
        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E6EA' }}>
          <button
            id="btn-pedestrian-crossing"
            onClick={onRequestPedestrian}
            style={{
              width: '100%',
              padding: '0.7rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#EDF5F0',
              border: '1px solid #C4DFCFC',
              color: '#47785C',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.16s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Footprints size={18} />
              <span>REQUEST PEDESTRIAN CROSSING [P]</span>
            </div>
            {pendingPedestriansCount > 0 ? (
              <span className="badge badge-warning">{pendingPedestriansCount} PENDING</span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>5s Walk</span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

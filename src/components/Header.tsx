import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Code2,
  Activity,
  Gauge,
} from 'lucide-react';
import { OperationMode, SimulationStatus } from '../types';
import { SIMULATION_SPEEDS } from '../config';

interface HeaderProps {
  status: SimulationStatus;
  mode: OperationMode;
  simTime: number;
  speed: number;
  isMuted: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStop: () => void;
  onSetSpeed: (speed: number) => void;
  onToggleSound: () => void;
  onOpenAssemblyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  mode,
  simTime,
  speed,
  isMuted,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
  onSetSpeed,
  onToggleSound,
  onOpenAssemblyModal,
}) => {
  // Format simTime to MM:SS.s
  const minutes = Math.floor(simTime / 60);
  const seconds = (simTime % 60).toFixed(1);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${seconds.padStart(4, '0')}`;

  return (
    <header className="glass-panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              backgroundColor: '#365D7A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(54, 93, 122, 0.25)',
            }}
          >
            <Activity size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#28323D' }}>
                SMART TRAFFIC CONTROL SYSTEM
              </h1>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                Assembly V2.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#65717D' }}>
              Real-Time Ambulance Emergency Priority & 4-Way Traffic Junction Simulation
            </p>
          </div>
        </div>

        {/* Center Indicators: Clock, Status, Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {status === 'RUNNING' && (
              <span className="badge badge-success" style={{ padding: '0.3rem 0.65rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#47785C',
                  }}
                  className="pulse-badge"
                />
                RUNNING
              </span>
            )}
            {status === 'PAUSED' && (
              <span className="badge badge-warning" style={{ padding: '0.3rem 0.65rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#C18B45',
                  }}
                />
                PAUSED
              </span>
            )}
            {status === 'STOPPED' && (
              <span className="badge badge-neutral" style={{ padding: '0.3rem 0.65rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#A0A8B0',
                  }}
                />
                STOPPED
              </span>
            )}

            {/* Mode Badge */}
            <span
              className={mode === 'AUTOMATIC' ? 'badge badge-blue' : 'badge badge-warning'}
              style={{ padding: '0.3rem 0.65rem' }}
            >
              MODE: {mode}
            </span>
          </div>

          {/* Digital Simulation Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FFFFFF',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #D6DCE2',
              boxShadow: '0 1px 2px rgba(40, 50, 61, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#65717D', fontWeight: 600 }}>SIM CLOCK</span>
            <span
              className="font-mono"
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#28323D',
                letterSpacing: '0.04em',
                minWidth: '65px',
                textAlign: 'center',
              }}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Action Controls & Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* Speed Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F1F4F6',
              borderRadius: '6px',
              padding: '0.2rem',
              border: '1px solid #D6DCE2',
              gap: '0.15rem',
            }}
          >
            <Gauge size={14} color="#65717D" style={{ marginLeft: '0.3rem', marginRight: '0.15rem' }} />
            {SIMULATION_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                style={{
                  background: speed === s ? '#365D7A' : 'transparent',
                  color: speed === s ? '#FFFFFF' : '#65717D',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.25rem 0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Start / Pause / Resume */}
          {status === 'STOPPED' && (
            <button className="btn-primary" onClick={onStart} id="btn-start-sim">
              <Play size={15} fill="white" />
              Start
            </button>
          )}

          {status === 'RUNNING' && (
            <button className="btn-amber" onClick={onPause} id="btn-pause-sim">
              <Pause size={15} />
              Pause
            </button>
          )}

          {status === 'PAUSED' && (
            <button className="btn-primary" onClick={onResume} id="btn-resume-sim">
              <Play size={15} fill="white" />
              Resume
            </button>
          )}

          {/* Stop Button */}
          <button
            className="btn-danger"
            onClick={onStop}
            disabled={status === 'STOPPED'}
            id="btn-stop-sim"
            title="Safely stop traffic (All Red)"
          >
            <Square size={14} fill={status === 'STOPPED' ? '#A0A8B0' : 'white'} />
            Stop
          </button>

          {/* Reset Button */}
          <button className="btn-secondary" onClick={onReset} id="btn-reset-sim" title="Reset all timers and state">
            <RotateCcw size={14} />
            Reset
          </button>

          {/* Mute Audio Toggle */}
          <button
            className="btn-secondary"
            onClick={onToggleSound}
            id="btn-sound-toggle"
            title={isMuted ? 'Unmute siren and signals' : 'Mute siren and signals'}
            style={{ padding: '0.5rem 0.65rem' }}
          >
            {isMuted ? <VolumeX size={15} color="#B64040" /> : <Volume2 size={15} color="#47785C" />}
          </button>

          {/* Assembly Inspector Modal Toggle */}
          <button
            className="btn-secondary"
            onClick={onOpenAssemblyModal}
            id="btn-open-asm-modal"
            style={{
              backgroundColor: '#E5EDF4',
              borderColor: '#BDD3E6',
              color: '#365D7A',
              fontWeight: 600,
            }}
          >
            <Code2 size={15} />
            ASM Source
          </button>
        </div>

      </div>
    </header>
  );
};

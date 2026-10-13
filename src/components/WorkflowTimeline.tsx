import React from 'react';
import { SimulationPhase } from '../types';
import { ArrowRight, Clock, ShieldAlert, Footprints } from 'lucide-react';

interface WorkflowTimelineProps {
  currentPhase: SimulationPhase;
  phaseRemainingTime: number;
  nextPlannedPhase: SimulationPhase | null;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  currentPhase,
  phaseRemainingTime,
  nextPlannedPhase,
}) => {
  // Define standard cycle stages
  const standardPhases: Array<{ phase: SimulationPhase; label: string; defaultDuration: string }> = [
    { phase: 'ALL_RED', label: 'Safety All-Red', defaultDuration: '1s' },
    { phase: 'NS_GREEN', label: 'North/South Green', defaultDuration: '5-12s' },
    { phase: 'NS_YELLOW', label: 'North/South Yellow', defaultDuration: '2s' },
    { phase: 'ALL_RED', label: 'Safety All-Red', defaultDuration: '1s' },
    { phase: 'EW_GREEN', label: 'East/West Green', defaultDuration: '5-12s' },
    { phase: 'EW_YELLOW', label: 'East/West Yellow', defaultDuration: '2s' },
  ];

  const isEmergency = currentPhase === 'EMERGENCY_PRIORITY';
  const isPedestrian = currentPhase === 'PEDESTRIAN_CROSSING';

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.25rem', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="#365D7A" />
          <h2 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#28323D' }}>
            TRAFFIC PHASE WORKFLOW TIMELINE
          </h2>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#65717D' }}>
          Active State: <strong style={{ color: '#365D7A' }}>{currentPhase}</strong>
        </div>
      </div>

      {/* Dynamic Preemption Alert Node if Emergency or Pedestrian Active */}
      {isEmergency && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            backgroundColor: '#FDF0F0',
            border: '1px solid #B64040',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={20} color="#B64040" className="pulse-badge" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B64040' }}>
                PRIORITY PREEMPTION ACTIVE: EMERGENCY_PRIORITY
              </div>
              <div style={{ fontSize: '0.7rem', color: '#65717D' }}>
                Normal schedule held in safety state until ambulance clears
              </div>
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#B64040' }}>
            {Math.ceil(phaseRemainingTime)}s
          </div>
        </div>
      )}

      {isPedestrian && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            backgroundColor: '#EDF5F0',
            border: '1px solid #47785C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Footprints size={20} color="#47785C" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#47785C' }}>
                PEDESTRIAN WALK PHASE ACTIVE: ALL VEHICLES STOPPED
              </div>
              <div style={{ fontSize: '0.7rem', color: '#65717D' }}>
                Pedestrians traversing across marked crosswalks
              </div>
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#47785C' }}>
            {Math.ceil(phaseRemainingTime)}s
          </div>
        </div>
      )}

      {/* Horizontal Step Nodes Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        {standardPhases.map((step, idx) => {
          const isActive = currentPhase === step.phase;
          const isNext = nextPlannedPhase === step.phase;

          let borderColor = '#D6DCE2';
          let bgColor = '#F8FAFB';
          let textColor = '#65717D';
          let activeTitleColor = '#28323D';

          if (isActive) {
            if (step.phase.includes('GREEN')) {
              borderColor = '#47785C';
              bgColor = '#EDF5F0';
              textColor = '#47785C';
              activeTitleColor = '#47785C';
            } else if (step.phase.includes('YELLOW')) {
              borderColor = '#C18B45';
              bgColor = '#FDF8EE';
              textColor = '#C18B45';
              activeTitleColor = '#C18B45';
            } else {
              borderColor = '#B64040';
              bgColor = '#FDF0F0';
              textColor = '#B64040';
              activeTitleColor = '#B64040';
            }
          } else if (isNext) {
            borderColor = '#365D7A';
            bgColor = '#E5EDF4';
            textColor = '#365D7A';
            activeTitleColor = '#365D7A';
          }

          return (
            <React.Fragment key={idx}>
              <div
                style={{
                  minWidth: '135px',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: isActive || isNext ? `2px solid ${borderColor}` : `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  transition: 'all 0.16s ease',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 2px 6px rgba(40, 50, 61, 0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage {idx + 1}
                  </span>
                  {isActive && (
                    <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {Math.ceil(phaseRemainingTime)}s
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: activeTitleColor }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#65717D', marginTop: '0.2rem' }}>
                  {isActive ? 'ACTIVE NOW' : isNext ? 'NEXT PLANNED' : step.defaultDuration}
                </div>
              </div>

              {idx < standardPhases.length - 1 && (
                <ArrowRight size={14} color="#A0A8B0" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

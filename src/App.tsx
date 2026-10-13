import React, { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Header';
import { TrafficIntersection } from './components/TrafficIntersection';
import { ControlPanel } from './components/ControlPanel';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { StatisticsPanel } from './components/StatisticsPanel';
import { EventLog } from './components/EventLog';
import { AssemblyInspectorModal } from './components/AssemblyInspectorModal';
import { Keyboard, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const {
    status,
    mode,
    density,
    phase,
    phaseRemainingTime,
    phaseTotalDuration,
    signals,
    vehicles,
    pedestrians,
    pendingAmbulances,
    pendingPedestriansCount,
    statistics,
    eventLog,
    simTime,
    speedMultiplier,
    nextPlannedPhase,
    activeEmergencyDirection,
    manualSelectedAxis,
    isMuted,
    toggleSound,
    start,
    pause,
    resume,
    stop,
    reset,
    resetStats,
    clearLog,
    setMode,
    setDensity,
    setSpeed,
    triggerManualRoad,
    requestAmbulance,
    requestPedestrian,
  } = useSimulation();

  const [isAsmModalOpen, setIsAsmModalOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Auto-start simulation on mount so user sees it live immediately!
  useEffect(() => {
    start();
  }, []);

  // Keyboard shortcut listener matching Assembly menu choices!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'A') {
        setMode('AUTOMATIC');
      } else if (key === 'B') {
        requestAmbulance('NORTH');
      } else if (key === 'C') {
        requestAmbulance('SOUTH');
      } else if (key === 'D') {
        requestAmbulance('EAST');
      } else if (key === 'E') {
        requestAmbulance('WEST');
      } else if (key === 'P') {
        requestPedestrian();
      } else if (key === 'M') {
        setMode(mode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC');
      } else if (key === 'N') {
        if (mode === 'MANUAL') triggerManualRoad('NS');
      } else if (key === 'L') {
        setDensity('LOW');
      } else if (key === 'H') {
        setDensity('HIGH');
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (status === 'RUNNING') pause();
        else if (status === 'PAUSED') resume();
        else if (status === 'STOPPED') start();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, status, start, pause, resume, setMode, setDensity, triggerManualRoad, requestAmbulance, requestPedestrian]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP HEADER */}
      <Header
        status={status}
        mode={mode}
        simTime={simTime}
        speed={speedMultiplier}
        isMuted={isMuted}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onStop={stop}
        onSetSpeed={setSpeed}
        onToggleSound={toggleSound}
        onOpenAssemblyModal={() => setIsAsmModalOpen(true)}
      />

      {/* 2. MAIN APPLICATION CONTENT GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Main Intersection Simulation & Workflow Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TrafficIntersection
            phase={phase}
            phaseRemainingTime={phaseRemainingTime}
            signals={signals}
            vehicles={vehicles}
            pedestrians={pedestrians}
            activeEmergencyDirection={activeEmergencyDirection}
          />

          <WorkflowTimeline
            currentPhase={phase}
            phaseRemainingTime={phaseRemainingTime}
            nextPlannedPhase={nextPlannedPhase}
          />
        </div>

        {/* RIGHT COLUMN: Control Panel & Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ControlPanel
            mode={mode}
            density={density}
            phase={phase}
            phaseRemainingTime={phaseRemainingTime}
            manualSelectedAxis={manualSelectedAxis}
            pendingAmbulances={pendingAmbulances}
            pendingPedestriansCount={pendingPedestriansCount}
            onSetMode={setMode}
            onSetDensity={setDensity}
            onTriggerManualRoad={triggerManualRoad}
            onRequestAmbulance={requestAmbulance}
            onRequestPedestrian={requestPedestrian}
          />

          {/* Quick Keyboard Hotkeys Card */}
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#28323D' }}>
              <Keyboard size={16} color="#365D7A" />
              <span style={{ fontWeight: 600 }}>Keyboard Hotkeys (Assembly Menu):</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#365D7A', fontWeight: 600 }}>
              {showKeyboardHelp ? 'Hide' : 'Show Keys'}
            </span>
          </div>

          {showKeyboardHelp && (
            <div
              className="glass-panel"
              style={{
                padding: '0.85rem 1.15rem',
                fontSize: '0.75rem',
                color: '#65717D',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
              }}
            >
              <div><strong style={{ color: '#28323D' }}>[B]</strong> North Ambulance</div>
              <div><strong style={{ color: '#28323D' }}>[C]</strong> South Ambulance</div>
              <div><strong style={{ color: '#28323D' }}>[D]</strong> East Ambulance</div>
              <div><strong style={{ color: '#28323D' }}>[E]</strong> West Ambulance</div>
              <div><strong style={{ color: '#28323D' }}>[P]</strong> Pedestrian Crossing</div>
              <div><strong style={{ color: '#28323D' }}>[M]</strong> Toggle Auto/Manual</div>
              <div><strong style={{ color: '#28323D' }}>[N]</strong> Manual North/South</div>
              <div><strong style={{ color: '#28323D' }}>[Space]</strong> Pause / Resume</div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Statistics Dashboard & Event Log */}
      <StatisticsPanel
        statistics={statistics}
        onResetStats={resetStats}
      />

      <EventLog
        events={eventLog}
        onClearLog={clearLog}
      />

      {/* 4. FOOTER */}
      <footer
        style={{
          marginTop: '2rem',
          padding: '1.25rem 0',
          borderTop: '1px solid #D6DCE2',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#65717D',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="#47785C" />
          <span>Smart Ambulance Traffic Light Controller — Interactive Web Simulation</span>
        </div>
        <div>
          Based on NASM x86 Assembly source code (<code style={{ color: '#365D7A' }}>innovativemi - Copy.asm</code>)
        </div>
      </footer>

      {/* 5. MODALS */}
      <AssemblyInspectorModal
        isOpen={isAsmModalOpen}
        onClose={() => setIsAsmModalOpen(false)}
      />

    </div>
  );
};
export default App;

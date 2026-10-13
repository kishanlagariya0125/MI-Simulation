import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileCode, Cpu } from 'lucide-react';

interface AssemblyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssemblyInspectorModal: React.FC<AssemblyInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'SOURCE' | 'ARCHITECTURE' | 'MAPPING'>('SOURCE');

  if (!isOpen) return null;

  const asmCodeSnippet = `; ==============================================================
; PROJECT: AMBULANCE TRAFFIC LIGHT CONTROLLER (NASM x86 Assembly)
; Preserved Reference Implementation from innovativemi - Copy.asm
; ==============================================================

global main
extern printf, scanf

section .data
title db 10,'========================================',10
      db '   AMBULANCE TRAFFIC LIGHT CONTROLLER',10
      db '========================================',10,0

menu  db 10,'=============== MAIN MENU ===============',10
      db 'A = Normal Traffic',10
      db 'B = Ambulance from NORTH',10
      db 'C = Ambulance from SOUTH',10
      db 'D = Ambulance from EAST',10
      db 'E = Ambulance from WEST',10
      db 'P = Pedestrian Crossing',10
      db 'M = Toggle Manual/Automatic Mode',10
      db 'X = Exit and Show Statistics',10,0

; Traffic Densities: Low (5s), Medium (8s), High (12s)
; States: NS_GREEN, NS_YELLOW (2s), ALL_RED (1s safety)
;         EW_GREEN, EW_YELLOW (2s), ALL_RED (1s safety)

section .text
main:
    mov dword [mode], 0        ; 0 = automatic, 1 = manual
    mov dword [event_count], 0 ; Initialize Event Log
    ; Initialize statistics: normal, north, south, east, west, ped, total_ambulance

emergency_ns:
    push alert_msg
    call printf
    push all_red               ; Safety State
    call printf
    push priority_ns           ; Priority N/S
    call printf
    push ns_green
    call printf
    push dword 5               ; 5-second priority countdown
    call Countdown
    push ambulance_msg         ; *** AMBULANCE PASSING ***
    call printf
    push all_red
    call printf
    jmp menu_loop

Countdown:
    ; Procedure counting down seconds
    push ebp
    mov ebp, esp
    mov eax, [ebp+8]
    mov [countdown_val], eax
countdown_loop:
    cmp dword [countdown_val], 0
    jle countdown_done
    ; decrement and format
    dec dword [countdown_val]
    jmp countdown_loop
countdown_done:
    pop ebp
    ret`;

  const copyCode = () => {
    navigator.clipboard.writeText(asmCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(40, 50, 61, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6DCE2',
          boxShadow: '0 20px 40px rgba(40, 50, 61, 0.15)',
          borderRadius: '10px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #D6DCE2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={20} color="#365D7A" />
            <div>
              <h2 className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#28323D', margin: 0 }}>
                NASM x86 ASSEMBLY SOURCE CODE INSPECTOR
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#65717D', margin: '2px 0 0 0' }}>
                Original Assembly logic translated directly into real-time Web State Machine
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={copyCode}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              {copied ? <Check size={13} color="#47785C" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Excerpt'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#65717D',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', padding: '0.5rem 1.25rem', gap: '0.5rem', backgroundColor: '#EEF0F2', borderBottom: '1px solid #D6DCE2' }}>
          {[
            { key: 'SOURCE', label: 'Assembly Source Excerpt' },
            { key: 'MAPPING', label: 'ASM-to-TypeScript Logic Mapping' },
            { key: 'ARCHITECTURE', label: 'Safety & Concurrency Design' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: activeTab === t.key ? '1px solid #365D7A' : '1px solid transparent',
                backgroundColor: activeTab === t.key ? '#E5EDF4' : 'transparent',
                color: activeTab === t.key ? '#365D7A' : '#65717D',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, backgroundColor: '#FFFFFF' }}>
          {activeTab === 'SOURCE' && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#65717D', marginBottom: '0.6rem' }}>
                Reference file preserved in <code style={{ color: '#365D7A', fontWeight: 600 }}>asm_reference/innovativemi.asm</code> and workspace root.
              </div>
              <pre
                className="font-mono"
                style={{
                  backgroundColor: '#1E252D',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #D6DCE2',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  color: '#A5D6A7',
                  overflowX: 'auto',
                }}
              >
                {asmCodeSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'MAPPING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  asm: 'mode (0 = auto, 1 = manual)',
                  ts: 'OperationMode (AUTOMATIC / MANUAL) in TrafficStateMachine',
                  detail: 'Maintains stateful continuous cycling in Auto, or interactive user lane selection in Manual.',
                },
                {
                  asm: 'density (L=5s, M=8s, H=12s)',
                  ts: 'TrafficDensity (LOW, MEDIUM, HIGH) in PhaseTimingConfig',
                  detail: 'Configures exact green phase durations and dynamic vehicle spawning rates in the physics engine.',
                },
                {
                  asm: 'Countdown procedure',
                  ts: 'TrafficStateMachine.tick() with high-res delta seconds',
                  detail: 'Replaced console busy-waiting with real-time browser requestAnimationFrame clock, supporting pause & speed multipliers.',
                },
                {
                  asm: 'emergency_ns & emergency_ew',
                  ts: 'EmergencyManager + EMERGENCY_PRIORITY phase in StateMachine',
                  detail: 'Translates directional ambulance triggers into a deterministic non-loss FIFO queue, sirens, and priority green with all-red transitions.',
                },
                {
                  asm: 'pedestrian_crossing',
                  ts: 'PedestrianManager + PEDESTRIAN_CROSSING phase',
                  detail: 'Enforces all conflicting directions to RED, displays walk signal, and animates pedestrians across zebra stripes for 5 seconds.',
                },
                {
                  asm: 'LogEvent (events 1-6)',
                  ts: 'TrafficStateMachine.logEvent() with identical event codes',
                  detail: 'Event 1=Normal, 2=North, 3=South, 4=East, 5=West, 6=Pedestrian. Fully filterable and exportable.',
                },
                {
                  asm: 'exit_program statistics reporting',
                  ts: 'StatisticsTracker',
                  detail: 'Maintains normal_count, north_count, south_count, east_count, west_count, total_ambulance, ped_count, and vehicle throughput.',
                },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #D6DCE2',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C18B45' }}>
                      ASM: {m.asm}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#365D7A' }}>
                      TS: {m.ts}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#65717D', margin: 0, lineHeight: 1.45 }}>{m.detail}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ARCHITECTURE' && (
            <div style={{ fontSize: '0.8rem', color: '#28323D', lineHeight: '1.6' }}>
              <h3 style={{ color: '#28323D', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Safety First Architecture
              </h3>
              <p style={{ marginBottom: '0.75rem', color: '#65717D' }}>
                In real traffic systems, conflicting green movements are dangerous. Our state machine
                contains an explicit safety assertion on every transition:
              </p>
              <pre
                className="font-mono"
                style={{
                  backgroundColor: '#F1F4F7',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #D6DCE2',
                  color: '#B64040',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                {`if (state.nsLight === 'GREEN' && state.ewLight === 'GREEN') return false;
if (state.pedestrianWalkActive && (state.nsLight !== 'RED' || state.ewLight !== 'RED')) return false;`}
              </pre>
              <p style={{ color: '#65717D', margin: 0 }}>
                Whenever an emergency preempts normal traffic while a conflicting movement is green,
                the engine gracefully truncates the phase into YELLOW (2s), followed by ALL_RED (1s safety),
                before illuminating the emergency GREEN for the ambulance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

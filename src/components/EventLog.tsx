import React, { useState } from 'react';
import { EventCategory, EventLogEntry } from '../types';
import {
  FileText,
  Trash2,
  Download,
  Siren,
  Footprints,
} from 'lucide-react';

interface EventLogProps {
  events: ReadonlyArray<EventLogEntry>;
  onClearLog: () => void;
}

export const EventLog: React.FC<EventLogProps> = React.memo(({ events, onClearLog }) => {
  const [filter, setFilter] = useState<EventCategory | 'ALL'>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.category === filter;
  });

  const exportLog = () => {
    const textContent = events
      .map(
        (e) =>
          `[${e.realTimestamp}] [SIM +${e.simTime.toFixed(1)}s] [${e.category}] (Code ${e.code}) ${e.message}`
      )
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `traffic-simulation-event-log-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryBadge = (category: EventCategory) => {
    switch (category) {
      case 'EMERGENCY':
        return (
          <span className="badge badge-danger" style={{ fontSize: '0.62rem' }}>
            <Siren size={11} />
            EMERGENCY
          </span>
        );
      case 'PEDESTRIAN':
        return (
          <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
            <Footprints size={11} />
            PEDESTRIAN
          </span>
        );
      case 'NORMAL':
        return (
          <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>
            NORMAL
          </span>
        );
      case 'SYSTEM':
      default:
        return (
          <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.25rem', backgroundColor: '#FFFFFF' }}>
      {/* Log Header with Filter Tabs & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="#365D7A" />
          <h2 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#28323D' }}>
            SIMULATION EVENT LOG ({filteredEvents.length})
          </h2>
        </div>

        {/* Action Buttons: Export & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="btn-export-log"
            className="btn-secondary"
            onClick={exportLog}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            <Download size={13} />
            Export Log
          </button>

          {!showClearConfirm ? (
            <button
              id="btn-clear-log"
              className="btn-secondary"
              onClick={() => setShowClearConfirm(true)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: '#B64040' }}
            >
              <Trash2 size={13} />
              Clear Log
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#B64040', fontWeight: 600 }}>Confirm?</span>
              <button
                id="btn-confirm-clear"
                className="btn-danger"
                onClick={() => {
                  onClearLog();
                  setShowClearConfirm(false);
                }}
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
              >
                Yes, Clear
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowClearConfirm(false)}
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        {[
          { key: 'ALL', label: 'All Events' },
          { key: 'NORMAL', label: 'Normal Traffic' },
          { key: 'EMERGENCY', label: 'Emergency Events' },
          { key: 'PEDESTRIAN', label: 'Pedestrian Events' },
          { key: 'SYSTEM', label: 'System Events' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as EventCategory | 'ALL')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: filter === tab.key ? '1px solid #365D7A' : '1px solid #D6DCE2',
              backgroundColor: filter === tab.key ? '#E5EDF4' : '#FFFFFF',
              color: filter === tab.key ? '#365D7A' : '#65717D',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Items List (Newest First) */}
      <div
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
          backgroundColor: '#F8FAFB',
          borderRadius: '6px',
          border: '1px solid #D6DCE2',
          padding: '0.5rem',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#65717D', fontSize: '0.8rem' }}>
            No events recorded for this filter category.
          </div>
        ) : (
          filteredEvents.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.6rem',
                borderBottom: '1px solid #E2E6EA',
                fontSize: '0.78rem',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                <span className="font-mono" style={{ fontSize: '0.7rem', color: '#65717D', minWidth: '55px' }}>
                  +{e.simTime.toFixed(1)}s
                </span>
                {getCategoryBadge(e.category)}
                <span style={{ color: '#28323D', fontWeight: 500 }}>
                  {e.message}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.68rem', color: '#65717D' }}>
                {e.realTimestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

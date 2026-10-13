import React from 'react';
import { SimulationStatistics } from '../types';
import {
  BarChart3,
  Siren,
  Footprints,
  RotateCcw,
  Clock,
  Car,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface StatisticsPanelProps {
  statistics: SimulationStatistics;
  onResetStats: () => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = React.memo(({
  statistics,
  onResetStats,
}) => {
  // Directional percentages for ambulance requests
  const total = statistics.totalAmbulance || 1;
  const pNorth = Math.round((statistics.northAmbulance / total) * 100);
  const pSouth = Math.round((statistics.southAmbulance / total) * 100);
  const pEast = Math.round((statistics.eastAmbulance / total) * 100);
  const pWest = Math.round((statistics.westAmbulance / total) * 100);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.25rem', backgroundColor: '#FFFFFF' }}>
      {/* Header & Reset Stats Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="#365D7A" />
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#28323D' }}>
              LIVE STATISTICS & PERFORMANCE METRICS
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#65717D' }}>
              Real-time telemetry matching Assembly counter variables
            </p>
          </div>
        </div>

        <button
          id="btn-reset-stats"
          className="btn-secondary"
          onClick={onResetStats}
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
        >
          <RotateCcw size={13} />
          Reset Statistics
        </button>
      </div>

      {/* Grid of Key Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Normal Cycles */}
        <div
          style={{
            backgroundColor: '#F8FAFB',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #D6DCE2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#65717D', fontWeight: 600 }}>Normal Cycles</span>
            <CheckCircle size={15} color="#47785C" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#28323D' }}>
            {statistics.normalCycles}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            Completed NS & EW green cycles
          </div>
        </div>

        {/* Total Ambulances */}
        <div
          style={{
            backgroundColor: '#FDF0F0',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #F3C4C4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#B64040', fontWeight: 700 }}>Total Ambulance Requests</span>
            <Siren size={15} color="#B64040" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#B64040' }}>
            {statistics.totalAmbulance}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            N({statistics.northAmbulance}) + S({statistics.southAmbulance}) + E({statistics.eastAmbulance}) + W({statistics.westAmbulance})
          </div>
        </div>

        {/* Pedestrians */}
        <div
          style={{
            backgroundColor: '#EDF5F0',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #C4DFCFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#47785C', fontWeight: 700 }}>Pedestrian Crossings</span>
            <Footprints size={15} color="#47785C" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#47785C' }}>
            {statistics.completedCrossings} / {statistics.pedestrianRequests}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            Completed / Requested
          </div>
        </div>

        {/* Vehicles Passed */}
        <div
          style={{
            backgroundColor: '#F8FAFB',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #D6DCE2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#65717D', fontWeight: 600 }}>Vehicles Cleared</span>
            <Car size={15} color="#365D7A" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#28323D' }}>
            {statistics.vehiclesPassed}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            Passed through intersection safely
          </div>
        </div>

        {/* Phase Transitions */}
        <div
          style={{
            backgroundColor: '#F8FAFB',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #D6DCE2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#65717D', fontWeight: 600 }}>Phase Transitions</span>
            <Layers size={15} color="#365D7A" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#28323D' }}>
            {statistics.phaseTransitions}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            Explicit state machine transitions
          </div>
        </div>

        {/* Avg Response Time */}
        <div
          style={{
            backgroundColor: '#F8FAFB',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #D6DCE2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#65717D', fontWeight: 600 }}>Avg Emergency Response</span>
            <Clock size={15} color="#C18B45" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C18B45' }}>
            {statistics.avgEmergencyResponseTime}s
          </div>
          <div style={{ fontSize: '0.68rem', color: '#65717D', marginTop: '0.2rem' }}>
            From request to granted priority
          </div>
        </div>
      </div>

      {/* Ambulance Directional Breakdown Chart */}
      <div
        style={{
          backgroundColor: '#F8FAFB',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #D6DCE2',
        }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#28323D', marginBottom: '0.75rem' }}>
          Directional Emergency Distribution Breakdown:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'NORTH', count: statistics.northAmbulance, pct: pNorth, color: '#365D7A' },
            { label: 'SOUTH', count: statistics.southAmbulance, pct: pSouth, color: '#29485F' },
            { label: 'EAST', count: statistics.eastAmbulance, pct: pEast, color: '#47785C' },
            { label: 'WEST', count: statistics.westAmbulance, pct: pWest, color: '#C18B45' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: '#65717D' }}>{item.label}</span>
                <span className="font-mono" style={{ fontWeight: 700, color: item.color }}>
                  {item.count} req ({statistics.totalAmbulance > 0 ? item.pct : 0}%)
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E5EDF4', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${statistics.totalAmbulance > 0 ? item.pct : 0}%`,
                    backgroundColor: item.color,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

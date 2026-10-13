import React from 'react';
import { LightColor } from '../types';

interface TrafficLightProps {
  directionLabel: string;
  state: LightColor;
  countdownSeconds?: number;
  orientation?: 'vertical' | 'horizontal';
  isEmergencyPriority?: boolean;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({
  directionLabel,
  state,
  countdownSeconds,
  orientation = 'vertical',
  isEmergencyPriority = false,
}) => {
  const isRed = state === 'RED';
  const isYellow = state === 'YELLOW';
  const isGreen = state === 'GREEN';

  const lampSize = 22; // px

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {/* Direction & Status Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#28323D',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          border: '1px solid #D6DCE2',
          boxShadow: '0 1px 3px rgba(40, 50, 61, 0.1)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <span>{directionLabel}</span>
        {isEmergencyPriority && (
          <span
            style={{
              fontSize: '0.58rem',
              backgroundColor: '#B64040',
              color: '#FFFFFF',
              padding: '0.1rem 0.3rem',
              borderRadius: '3px',
              fontWeight: 800,
            }}
          >
            PRIORITY
          </span>
        )}
      </div>

      {/* Traffic Light Head Housing (Professional Matte Charcoal Signal Casing) */}
      <div
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          backgroundColor: '#242B33',
          padding: '0.45rem',
          borderRadius: '8px',
          border: isEmergencyPriority ? '2px solid #B64040' : '1px solid #3D4856',
          boxShadow: isEmergencyPriority
            ? '0 0 12px rgba(182, 64, 64, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 3px 8px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
      >
        {/* Red Lamp */}
        <div
          title={`Red Lamp: ${isRed ? 'ACTIVE' : 'OFF'}`}
          style={{
            width: `${lampSize}px`,
            height: `${lampSize}px`,
            borderRadius: '50%',
            backgroundColor: isRed ? '#B64040' : '#3D1E1E',
            boxShadow: isRed
              ? '0 0 10px rgba(182, 64, 64, 0.7), inset 0 0 4px #FFFFFF'
              : 'inset 0 1px 3px rgba(0,0,0,0.6)',
            border: '1px solid rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isRed && countdownSeconds !== undefined && countdownSeconds > 0 && (
            <span
              className="font-mono"
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {Math.ceil(countdownSeconds)}
            </span>
          )}
        </div>

        {/* Yellow / Amber Lamp */}
        <div
          title={`Amber Lamp: ${isYellow ? 'ACTIVE' : 'OFF'}`}
          style={{
            width: `${lampSize}px`,
            height: `${lampSize}px`,
            borderRadius: '50%',
            backgroundColor: isYellow ? '#C18B45' : '#382C18',
            boxShadow: isYellow
              ? '0 0 10px rgba(193, 139, 69, 0.75), inset 0 0 4px #FFFFFF'
              : 'inset 0 1px 3px rgba(0,0,0,0.6)',
            border: '1px solid rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isYellow && countdownSeconds !== undefined && countdownSeconds > 0 && (
            <span
              className="font-mono"
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {Math.ceil(countdownSeconds)}
            </span>
          )}
        </div>

        {/* Green Lamp */}
        <div
          title={`Green Lamp: ${isGreen ? 'ACTIVE' : 'OFF'}`}
          style={{
            width: `${lampSize}px`,
            height: `${lampSize}px`,
            borderRadius: '50%',
            backgroundColor: isGreen ? '#2E8B57' : '#153022',
            boxShadow: isGreen
              ? '0 0 10px rgba(46, 139, 87, 0.75), inset 0 0 4px #FFFFFF'
              : 'inset 0 1px 3px rgba(0,0,0,0.6)',
            border: '1px solid rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isGreen && countdownSeconds !== undefined && countdownSeconds > 0 && (
            <span
              className="font-mono"
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {Math.ceil(countdownSeconds)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

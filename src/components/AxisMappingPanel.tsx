import { useState } from 'react'
import { GamepadState } from '../hooks/useGamepad'
import { GamepadMapping, StickDirection, StickMappingType } from '../hooks/useGamepadMapping'
import { getStickDirection, getStickAxes } from '../utils/stickDirection'
import { DIRECTION_LABELS } from '../constants/directionLabels'
import {
  DEFAULT_STICK_THRESHOLD,
  DEFAULT_STICK_THRESHOLD_PREVIEW,
  DEFAULT_MOUSE_SENSITIVITY,
  DEFAULT_MOUSE_ACCELERATION,
  DEFAULT_MOUSE_INVERT_X,
  DEFAULT_MOUSE_INVERT_Y,
} from '../constants/defaults'
import './MappingPanel.css'

interface AxisMappingPanelProps {
  gamepad: GamepadState
  mapping?: GamepadMapping
  stickIndex: number
  direction: StickDirection
  editingAxis: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: StickMappingType, sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  onSetEditingAxis: (value: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null) => void
}

export function AxisMappingPanel({
  gamepad,
  mapping,
  stickIndex,
  direction,
  editingAxis,
  onSetAxisMapping,
  onRemoveAxisMapping,
  onSetEditingAxis,
}: AxisMappingPanelProps) {
  const [threshold, setThreshold] = useState(DEFAULT_STICK_THRESHOLD)
  const [sensitivity, setSensitivity] = useState(DEFAULT_MOUSE_SENSITIVITY)
  const [acceleration, setAcceleration] = useState(DEFAULT_MOUSE_ACCELERATION)
  const [invertX, setInvertX] = useState(DEFAULT_MOUSE_INVERT_X)
  const [invertY, setInvertY] = useState(DEFAULT_MOUSE_INVERT_Y)

  const stickDirection = direction as StickDirection
  const stickMapping = mapping?.axisMappings.find(m => m.stickIndex === stickIndex && m.direction === stickDirection)
  const isEditing = editingAxis?.stickIndex === stickIndex && editingAxis?.direction === stickDirection

  const getCurrentStickDirection = (stickIndex: number): StickDirection | null => {
    const { axisXIndex, axisYIndex } = getStickAxes(stickIndex)
    return getStickDirection(
      gamepad.axes[axisXIndex] || 0,
      gamepad.axes[axisYIndex] || 0,
      DEFAULT_STICK_THRESHOLD_PREVIEW
    )
  }

  const isActive = getCurrentStickDirection(stickIndex) === stickDirection

  return (
    <div className="mapping-panel-content">
      <div className="mapping-header">
        <h3>{stickIndex === 0 ? 'Left' : 'Right'} Stick - {DIRECTION_LABELS[stickDirection]}</h3>
        {isActive && <span className="pressed-indicator">● Active</span>}
      </div>
      
      <div className="mapping-editor">
        {stickMapping ? (
          <>
            <div className="mapping-display">
              <div className="mapping-label">Type:</div>
              <div className="threshold-value">{stickMapping.type === 'mouse' ? 'Mouse Control' : 'Hotkey'}</div>
              <div className="mapping-label">Mapped to:</div>
              <div className="mapped-key-large">{stickMapping.label}</div>
              <div className="mapping-label">Threshold:</div>
              <div className="threshold-value">{stickMapping.threshold.toFixed(2)}</div>
              {stickMapping.type === 'mouse' && (
                <>
                  <div className="mapping-label">Sensitivity:</div>
                  <div className="threshold-value">{stickMapping.sensitivity?.toFixed(2) || '1.00'}</div>
                  <div className="mapping-label">Acceleration:</div>
                  <div className="threshold-value">{stickMapping.acceleration?.toFixed(2) || '1.00'}</div>
                  <div className="mapping-label">Invert X:</div>
                  <div className="threshold-value">{stickMapping.invertX ? 'Yes' : 'No'}</div>
                  <div className="mapping-label">Invert Y:</div>
                  <div className="threshold-value">{stickMapping.invertY ? 'Yes' : 'No'}</div>
                </>
              )}
            </div>
            <div className="mapping-actions">
              <button
                className="btn-edit"
                onClick={() => {
                  setThreshold(stickMapping.threshold)
                  setSensitivity(stickMapping.sensitivity ?? DEFAULT_MOUSE_SENSITIVITY)
                  setAcceleration(stickMapping.acceleration ?? DEFAULT_MOUSE_ACCELERATION)
                  onSetEditingAxis({ gamepadIndex: gamepad.index, stickIndex, direction: stickDirection })
                }}
              >
                Edit
              </button>
              <button
                className="btn-remove"
                onClick={() => onRemoveAxisMapping(stickIndex, stickDirection)}
              >
                Remove Mapping
              </button>
            </div>
            {isEditing && (
              <div className="editing-hint">
                {stickMapping.type === 'mouse' ? (
                  <>
                    <div className="threshold-control">
                      <label>Deadzone:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      />
                      <span>{threshold.toFixed(2)}</span>
                    </div>
                    <div className="threshold-control">
                      <label>Sensitivity:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                      />
                      <span>{sensitivity.toFixed(2)}</span>
                    </div>
                    <div className="threshold-control">
                      <label>Acceleration:</label>
                      <input
                        type="range"
                        min="0.0"
                        max="2.0"
                        step="0.1"
                        value={acceleration}
                        onChange={(e) => setAcceleration(parseFloat(e.target.value))}
                      />
                      <span>{acceleration.toFixed(2)}</span>
                    </div>
                    <div className="threshold-control">
                      <label>Invert X:</label>
                      <input
                        type="checkbox"
                        checked={invertX}
                        onChange={(e) => setInvertX(e.target.checked)}
                      />
                    </div>
                    <div className="threshold-control">
                      <label>Invert Y:</label>
                      <input
                        type="checkbox"
                        checked={invertY}
                        onChange={(e) => setInvertY(e.target.checked)}
                      />
                    </div>
                    <button
                      className="btn-map"
                      onClick={() => {
                        onSetAxisMapping(stickIndex, stickDirection, 'Mouse', 'Mouse', threshold, 'mouse', sensitivity, acceleration, invertX, invertY)
                      }}
                    >
                      Save Mouse Settings
                    </button>
                  </>
                ) : (
                  <>
                    <div>Press a key to map...</div>
                    <div className="threshold-control">
                      <label>Threshold:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      />
                      <span>{threshold.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mapping-display">
              <div className="mapping-label">No mapping</div>
              <p className="mapping-hint">Click "Map Key" and press a keyboard key to assign it to this stick direction.</p>
            </div>
            <div className="mapping-actions">
              <button
                className="btn-map"
                onClick={() => {
                  setThreshold(DEFAULT_STICK_THRESHOLD)
                  onSetEditingAxis({ gamepadIndex: gamepad.index, stickIndex, direction: stickDirection })
                }}
              >
                Map Key
              </button>
            </div>
            {isEditing && (
              <div className="editing-hint">
                <div>Press a key to map...</div>
                <div className="threshold-control">
                  <label>Threshold:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  />
                  <span>{threshold.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

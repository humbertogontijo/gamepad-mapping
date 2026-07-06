import { useState, useRef, useCallback, useEffect } from 'react'
import { GamepadMapping, StickDirection, StickMappingType } from '../hooks/useGamepadMapping'
import { MappingActions } from './MappingPanel'
import {
  DEFAULT_STICK_THRESHOLD_MOUSE,
  DEFAULT_MOUSE_SENSITIVITY,
  DEFAULT_MOUSE_ACCELERATION,
  DEFAULT_MOUSE_INVERT_X,
  DEFAULT_MOUSE_INVERT_Y,
} from '../constants/defaults'
import './MappingPanel.css'

interface StickMouseModeProps {
  mapping?: GamepadMapping
  stickIndex: number
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: StickMappingType, sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  previousMappingType: StickMappingType | null
}

export function StickMouseMode({
  mapping,
  stickIndex,
  onSetAxisMapping,
  onRemoveAxisMapping,
  previousMappingType,
}: StickMouseModeProps) {
  const [threshold, setThreshold] = useState(DEFAULT_STICK_THRESHOLD_MOUSE)
  const [sensitivity, setSensitivity] = useState(DEFAULT_MOUSE_SENSITIVITY)
  const [acceleration, setAcceleration] = useState(DEFAULT_MOUSE_ACCELERATION)
  const [invertX, setInvertX] = useState(DEFAULT_MOUSE_INVERT_X)
  const [invertY, setInvertY] = useState(DEFAULT_MOUSE_INVERT_Y)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const originalMouseMappingRef = useRef<{
    threshold: number
    sensitivity: number
    acceleration: number
    invertX: boolean
    invertY: boolean
  } | null>(null)

  const stickMappings = mapping?.axisMappings.filter(m => m.stickIndex === stickIndex) || []
  const mouseMapping = stickMappings.find(m => m.type === 'mouse')

  // Sync state with mouse mapping when it changes
  useEffect(() => {
    if (mouseMapping) {
      const values = {
        threshold: mouseMapping.threshold,
        sensitivity: mouseMapping.sensitivity ?? DEFAULT_MOUSE_SENSITIVITY,
        acceleration: mouseMapping.acceleration ?? DEFAULT_MOUSE_ACCELERATION,
        invertX: mouseMapping.invertX ?? DEFAULT_MOUSE_INVERT_X,
        invertY: mouseMapping.invertY ?? DEFAULT_MOUSE_INVERT_Y,
      }
      setThreshold(values.threshold)
      setSensitivity(values.sensitivity)
      setAcceleration(values.acceleration)
      setInvertX(values.invertX)
      setInvertY(values.invertY)
      originalMouseMappingRef.current = values
      setHasUnsavedChanges(false)
    } else {
      // Initialize defaults
      const values = {
        threshold: DEFAULT_STICK_THRESHOLD_MOUSE,
        sensitivity: DEFAULT_MOUSE_SENSITIVITY,
        acceleration: DEFAULT_MOUSE_ACCELERATION,
        invertX: DEFAULT_MOUSE_INVERT_X,
        invertY: DEFAULT_MOUSE_INVERT_Y,
      }
      setThreshold(values.threshold)
      setSensitivity(values.sensitivity)
      setAcceleration(values.acceleration)
      setInvertX(values.invertX)
      setInvertY(values.invertY)
      originalMouseMappingRef.current = null
    }
  }, [mouseMapping])

  // Check for changes
  useEffect(() => {
    // Check if mapping type changed (mode switch from hotkey to mouse)
    const mappingTypeChanged = previousMappingType === 'hotkey'
    
    if (mouseMapping) {
      // Compare current values with saved mapping
      const hasChanges = 
        Math.abs(threshold - mouseMapping.threshold) > 0.01 ||
        Math.abs((sensitivity ?? DEFAULT_MOUSE_SENSITIVITY) - (mouseMapping.sensitivity ?? DEFAULT_MOUSE_SENSITIVITY)) > 0.01 ||
        Math.abs((acceleration ?? DEFAULT_MOUSE_ACCELERATION) - (mouseMapping.acceleration ?? DEFAULT_MOUSE_ACCELERATION)) > 0.01 ||
        (invertX ?? DEFAULT_MOUSE_INVERT_X) !== (mouseMapping.invertX ?? DEFAULT_MOUSE_INVERT_X) ||
        (invertY ?? DEFAULT_MOUSE_INVERT_Y) !== (mouseMapping.invertY ?? DEFAULT_MOUSE_INVERT_Y)
      setHasUnsavedChanges(hasChanges)
    } else {
      // New mapping - show buttons if mapping type changed OR if values differ from defaults
      const valuesDifferFromDefaults = 
        Math.abs(threshold - DEFAULT_STICK_THRESHOLD_MOUSE) > 0.01 ||
        Math.abs((sensitivity ?? DEFAULT_MOUSE_SENSITIVITY) - DEFAULT_MOUSE_SENSITIVITY) > 0.01 ||
        Math.abs((acceleration ?? DEFAULT_MOUSE_ACCELERATION) - DEFAULT_MOUSE_ACCELERATION) > 0.01 ||
        (invertX ?? DEFAULT_MOUSE_INVERT_X) !== DEFAULT_MOUSE_INVERT_X ||
        (invertY ?? DEFAULT_MOUSE_INVERT_Y) !== DEFAULT_MOUSE_INVERT_Y
      setHasUnsavedChanges(mappingTypeChanged || valuesDifferFromDefaults)
    }
  }, [threshold, sensitivity, acceleration, invertX, invertY, mouseMapping, previousMappingType])

  const revertChanges = useCallback(() => {
    if (originalMouseMappingRef.current) {
      setThreshold(originalMouseMappingRef.current.threshold)
      setSensitivity(originalMouseMappingRef.current.sensitivity)
      setAcceleration(originalMouseMappingRef.current.acceleration)
      setInvertX(originalMouseMappingRef.current.invertX)
      setInvertY(originalMouseMappingRef.current.invertY)
      setHasUnsavedChanges(false)
    } else {
      // Revert to defaults for new mapping
      setThreshold(DEFAULT_STICK_THRESHOLD_MOUSE)
      setSensitivity(DEFAULT_MOUSE_SENSITIVITY)
      setAcceleration(DEFAULT_MOUSE_ACCELERATION)
      setInvertX(DEFAULT_MOUSE_INVERT_X)
      setInvertY(DEFAULT_MOUSE_INVERT_Y)
      setHasUnsavedChanges(false)
    }
  }, [])

  return (
    <div className="mouse-control-settings">
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
      
      <MappingActions
        hasUnsavedChanges={hasUnsavedChanges}
        onApplyChanges={() => {
          onSetAxisMapping(stickIndex, 'up', 'Mouse', 'Mouse', threshold, 'mouse', sensitivity, acceleration, invertX, invertY)
          setHasUnsavedChanges(false)
          originalMouseMappingRef.current = {
            threshold,
            sensitivity,
            acceleration,
            invertX,
            invertY
          }
        }}
        onRevertChanges={revertChanges}
        onRemoveMapping={() => {
          if (mouseMapping) {
            onRemoveAxisMapping(stickIndex, mouseMapping.direction)
          }
          setHasUnsavedChanges(false)
          originalMouseMappingRef.current = null
        }}
        showRemove={!!(mouseMapping)}
      />
    </div>
  )
}

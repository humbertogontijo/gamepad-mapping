import { useState, useRef, useCallback, useEffect } from 'react'
import { GamepadMapping, StickDirection } from '../hooks/useGamepadMapping'
import { MappingActions } from './MappingPanel'
import './MappingPanel.css'

interface StickMouseModeProps {
  mapping?: GamepadMapping
  stickIndex: number
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: 'hotkey' | 'mouse', sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  previousMappingType: 'hotkey' | 'mouse' | null
}

export function StickMouseMode({
  mapping,
  stickIndex,
  onSetAxisMapping,
  onRemoveAxisMapping,
  previousMappingType,
}: StickMouseModeProps) {
  const [threshold, setThreshold] = useState(0.3)
  const [sensitivity, setSensitivity] = useState(1.0)
  const [acceleration, setAcceleration] = useState(1.0)
  const [invertX, setInvertX] = useState(false)
  const [invertY, setInvertY] = useState(false)
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
        sensitivity: mouseMapping.sensitivity ?? 1.0,
        acceleration: mouseMapping.acceleration ?? 1.0,
        invertX: mouseMapping.invertX ?? false,
        invertY: mouseMapping.invertY ?? false,
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
        threshold: 0.3,
        sensitivity: 1.0,
        acceleration: 1.0,
        invertX: false,
        invertY: false,
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
        Math.abs((sensitivity ?? 1.0) - (mouseMapping.sensitivity ?? 1.0)) > 0.01 ||
        Math.abs((acceleration ?? 1.0) - (mouseMapping.acceleration ?? 1.0)) > 0.01 ||
        (invertX ?? false) !== (mouseMapping.invertX ?? false) ||
        (invertY ?? false) !== (mouseMapping.invertY ?? false)
      setHasUnsavedChanges(hasChanges)
    } else {
      // New mapping - show buttons if mapping type changed OR if values differ from defaults
      const valuesDifferFromDefaults = 
        Math.abs(threshold - 0.3) > 0.01 ||
        Math.abs((sensitivity ?? 1.0) - 1.0) > 0.01 ||
        Math.abs((acceleration ?? 1.0) - 1.0) > 0.01 ||
        (invertX ?? false) !== false ||
        (invertY ?? false) !== false
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
      setThreshold(0.3)
      setSensitivity(1.0)
      setAcceleration(1.0)
      setInvertX(false)
      setInvertY(false)
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


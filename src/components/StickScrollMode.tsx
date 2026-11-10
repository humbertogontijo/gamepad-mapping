import { useState, useRef, useCallback, useEffect } from 'react'
import { GamepadMapping, StickDirection, StickMappingType } from '../hooks/useGamepadMapping'
import { MappingActions } from './MappingPanel'
import {
  DEFAULT_STICK_THRESHOLD_MOUSE,
  DEFAULT_SCROLL_SENSITIVITY,
  DEFAULT_SCROLL_ACCELERATION,
  DEFAULT_SCROLL_INVERT_X,
  DEFAULT_SCROLL_INVERT_Y,
} from '../constants/defaults'
import './MappingPanel.css'

interface StickScrollModeProps {
  mapping?: GamepadMapping
  stickIndex: number
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: StickMappingType, sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  previousMappingType: StickMappingType | null
}

export function StickScrollMode({
  mapping,
  stickIndex,
  onSetAxisMapping,
  onRemoveAxisMapping,
  previousMappingType,
}: StickScrollModeProps) {
  const [threshold, setThreshold] = useState(DEFAULT_STICK_THRESHOLD_MOUSE)
  const [sensitivity, setSensitivity] = useState(DEFAULT_SCROLL_SENSITIVITY)
  const [acceleration, setAcceleration] = useState(DEFAULT_SCROLL_ACCELERATION)
  const [invertX, setInvertX] = useState(DEFAULT_SCROLL_INVERT_X)
  const [invertY, setInvertY] = useState(DEFAULT_SCROLL_INVERT_Y)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const originalScrollMappingRef = useRef<{
    threshold: number
    sensitivity: number
    acceleration: number
    invertX: boolean
    invertY: boolean
  } | null>(null)

  const stickMappings = mapping?.axisMappings.filter(m => m.stickIndex === stickIndex) || []
  const scrollMapping = stickMappings.find(m => m.type === 'scroll')

  useEffect(() => {
    if (scrollMapping) {
      const values = {
        threshold: scrollMapping.threshold,
        sensitivity: scrollMapping.sensitivity ?? DEFAULT_SCROLL_SENSITIVITY,
        acceleration: scrollMapping.acceleration ?? DEFAULT_SCROLL_ACCELERATION,
        invertX: scrollMapping.invertX ?? DEFAULT_SCROLL_INVERT_X,
        invertY: scrollMapping.invertY ?? DEFAULT_SCROLL_INVERT_Y,
      }
      setThreshold(values.threshold)
      setSensitivity(values.sensitivity)
      setAcceleration(values.acceleration)
      setInvertX(values.invertX)
      setInvertY(values.invertY)
      originalScrollMappingRef.current = values
      setHasUnsavedChanges(false)
    } else {
      const values = {
        threshold: DEFAULT_STICK_THRESHOLD_MOUSE,
        sensitivity: DEFAULT_SCROLL_SENSITIVITY,
        acceleration: DEFAULT_SCROLL_ACCELERATION,
        invertX: DEFAULT_SCROLL_INVERT_X,
        invertY: DEFAULT_SCROLL_INVERT_Y,
      }
      setThreshold(values.threshold)
      setSensitivity(values.sensitivity)
      setAcceleration(values.acceleration)
      setInvertX(values.invertX)
      setInvertY(values.invertY)
      originalScrollMappingRef.current = null
    }
  }, [scrollMapping])

  useEffect(() => {
    const mappingTypeChanged = previousMappingType !== null && previousMappingType !== 'scroll'

    if (scrollMapping) {
      const hasChanges =
        Math.abs(threshold - scrollMapping.threshold) > 0.01 ||
        Math.abs((sensitivity ?? DEFAULT_SCROLL_SENSITIVITY) - (scrollMapping.sensitivity ?? DEFAULT_SCROLL_SENSITIVITY)) > 0.01 ||
        Math.abs((acceleration ?? DEFAULT_SCROLL_ACCELERATION) - (scrollMapping.acceleration ?? DEFAULT_SCROLL_ACCELERATION)) > 0.01 ||
        (invertX ?? DEFAULT_SCROLL_INVERT_X) !== (scrollMapping.invertX ?? DEFAULT_SCROLL_INVERT_X) ||
        (invertY ?? DEFAULT_SCROLL_INVERT_Y) !== (scrollMapping.invertY ?? DEFAULT_SCROLL_INVERT_Y)
      setHasUnsavedChanges(hasChanges)
    } else {
      const valuesDifferFromDefaults =
        Math.abs(threshold - DEFAULT_STICK_THRESHOLD_MOUSE) > 0.01 ||
        Math.abs((sensitivity ?? DEFAULT_SCROLL_SENSITIVITY) - DEFAULT_SCROLL_SENSITIVITY) > 0.01 ||
        Math.abs((acceleration ?? DEFAULT_SCROLL_ACCELERATION) - DEFAULT_SCROLL_ACCELERATION) > 0.01 ||
        (invertX ?? DEFAULT_SCROLL_INVERT_X) !== DEFAULT_SCROLL_INVERT_X ||
        (invertY ?? DEFAULT_SCROLL_INVERT_Y) !== DEFAULT_SCROLL_INVERT_Y
      setHasUnsavedChanges(mappingTypeChanged || valuesDifferFromDefaults)
    }
  }, [threshold, sensitivity, acceleration, invertX, invertY, scrollMapping, previousMappingType])

  const revertChanges = useCallback(() => {
    if (originalScrollMappingRef.current) {
      setThreshold(originalScrollMappingRef.current.threshold)
      setSensitivity(originalScrollMappingRef.current.sensitivity)
      setAcceleration(originalScrollMappingRef.current.acceleration)
      setInvertX(originalScrollMappingRef.current.invertX)
      setInvertY(originalScrollMappingRef.current.invertY)
      setHasUnsavedChanges(false)
    } else {
      setThreshold(DEFAULT_STICK_THRESHOLD_MOUSE)
      setSensitivity(DEFAULT_SCROLL_SENSITIVITY)
      setAcceleration(DEFAULT_SCROLL_ACCELERATION)
      setInvertX(DEFAULT_SCROLL_INVERT_X)
      setInvertY(DEFAULT_SCROLL_INVERT_Y)
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
        <label>Speed:</label>
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
        <label>Invert Horizontal:</label>
        <input
          type="checkbox"
          checked={invertX}
          onChange={(e) => setInvertX(e.target.checked)}
        />
      </div>
      <div className="threshold-control">
        <label>Invert Vertical:</label>
        <input
          type="checkbox"
          checked={invertY}
          onChange={(e) => setInvertY(e.target.checked)}
        />
      </div>

      <MappingActions
        hasUnsavedChanges={hasUnsavedChanges}
        onApplyChanges={() => {
          onSetAxisMapping(stickIndex, 'up', 'Scroll', 'Scroll', threshold, 'scroll', sensitivity, acceleration, invertX, invertY)
          setHasUnsavedChanges(false)
          originalScrollMappingRef.current = {
            threshold,
            sensitivity,
            acceleration,
            invertX,
            invertY
          }
        }}
        onRevertChanges={revertChanges}
        onRemoveMapping={() => {
          if (scrollMapping) {
            onRemoveAxisMapping(stickIndex, scrollMapping.direction)
          }
          setHasUnsavedChanges(false)
          originalScrollMappingRef.current = null
        }}
        showRemove={!!(scrollMapping)}
      />
    </div>
  )
}

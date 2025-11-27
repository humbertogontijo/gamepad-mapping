import { useState, useRef, useCallback, useEffect } from 'react'
import { GamepadState } from '../hooks/useGamepad'
import { GamepadMapping, StickDirection } from '../hooks/useGamepadMapping'
import { MappingActions } from './MappingPanel'
import { KeyMappingSelector } from './KeyMappingSelector'
import './MappingPanel.css'

const STICK_DIRECTIONS: StickDirection[] = ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']

const DIRECTION_LABELS: Record<StickDirection, string> = {
  'up': '↑ Up',
  'down': '↓ Down',
  'left': '← Left',
  'right': '→ Right',
  'up-left': '↖ Up-Left',
  'up-right': '↗ Up-Right',
  'down-left': '↙ Down-Left',
  'down-right': '↘ Down-Right',
}

interface StickHotkeyModeProps {
  gamepad: GamepadState
  mapping?: GamepadMapping
  stickIndex: number
  editingAxis: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: 'hotkey' | 'mouse', sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  onSetEditingAxis: (value: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null) => void
  onRemoveAllMappings: (stickIndex: number) => void
}

export function StickHotkeyMode({
  gamepad,
  mapping,
  stickIndex,
  editingAxis,
  onSetAxisMapping,
  onRemoveAxisMapping,
  onSetEditingAxis,
  onRemoveAllMappings,
}: StickHotkeyModeProps) {
  const [threshold, setThreshold] = useState(0.5)
  const [pendingDirectionKeys, setPendingDirectionKeys] = useState<Map<StickDirection, { key: string; label: string }>>(new Map())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const originalDirectionMappingsRef = useRef<Map<StickDirection, { key: string; label: string }>>(new Map())
  const originalThresholdRef = useRef<number>(0.5)

  const stickMappings = mapping?.axisMappings.filter(m => m.stickIndex === stickIndex && m.type === 'hotkey') || []

  const getStickMapping = useCallback((direction: StickDirection) => {
    return mapping?.axisMappings.find(m => m.stickIndex === stickIndex && m.direction === direction)
  }, [mapping?.axisMappings, stickIndex])

  // Initialize threshold from existing mappings (use first one found)
  useEffect(() => {
    if (stickMappings.length > 0) {
      const firstMapping = stickMappings[0]
      setThreshold(firstMapping.threshold)
      originalThresholdRef.current = firstMapping.threshold
    }
  }, [stickMappings.length]) // Only run when mappings are first loaded

  const getStickDirection = (x: number, y: number, threshold: number): StickDirection | null => {
    const absX = Math.abs(x)
    const absY = Math.abs(y)
    
    if (absX < threshold && absY < threshold) {
      return null
    }

    const isUp = y < -threshold
    const isDown = y > threshold
    const isLeft = x < -threshold
    const isRight = x > threshold

    if (isUp && isLeft) return 'up-left'
    if (isUp && isRight) return 'up-right'
    if (isDown && isLeft) return 'down-left'
    if (isDown && isRight) return 'down-right'
    if (isUp) return 'up'
    if (isDown) return 'down'
    if (isLeft) return 'left'
    if (isRight) return 'right'

    return null
  }

  const getCurrentStickDirection = (stickIndex: number): StickDirection | null => {
    if (stickIndex === 0) {
      return getStickDirection(gamepad.axes[0] || 0, gamepad.axes[1] || 0, 0.3)
    } else {
      return getStickDirection(gamepad.axes[2] || 0, gamepad.axes[3] || 0, 0.3)
    }
  }

  // Initialize original mappings
  useEffect(() => {
    originalDirectionMappingsRef.current = new Map()
    stickMappings.forEach(m => {
      originalDirectionMappingsRef.current.set(m.direction, {
        key: m.key,
        label: m.label
      })
    })
  }, [stickMappings])

  // Check for changes
  useEffect(() => {
    const hasPendingKeys = pendingDirectionKeys.size > 0
    const hasThresholdChanges = Math.abs(threshold - originalThresholdRef.current) > 0.01
    setHasUnsavedChanges(hasPendingKeys || hasThresholdChanges)
  }, [pendingDirectionKeys, threshold])

  const handleKeyPress = useCallback((direction: StickDirection, key: string, label: string) => {
    const stickMapping = getStickMapping(direction)
    
    // Store original if not already stored
    if (!originalDirectionMappingsRef.current.has(direction) && stickMapping) {
      originalDirectionMappingsRef.current.set(direction, {
        key: stickMapping.key,
        label: stickMapping.label
      })
    }
    
    // Store pending key
    setPendingDirectionKeys(prev => {
      const newMap = new Map(prev)
      newMap.set(direction, { key, label })
      return newMap
    })
    setHasUnsavedChanges(true)
  }, [getStickMapping])

  const revertChanges = useCallback(() => {
    setPendingDirectionKeys(new Map())
    setThreshold(originalThresholdRef.current)
    setHasUnsavedChanges(false)
  }, [])

  return (
    <>
      <div className="stick-directions-list">
        {STICK_DIRECTIONS.map((direction) => {
          const stickMapping = getStickMapping(direction)
          const isActive = getCurrentStickDirection(stickIndex) === direction
          
          return (
            <div
              key={direction}
              className={`stick-direction-item ${stickMapping ? 'has-mapping' : ''} ${isActive ? 'active' : ''} ${editingAxis?.stickIndex === stickIndex && editingAxis?.direction === direction ? 'editing' : ''}`}
              onClick={() => {
                // Store original values if not already stored
                if (stickMapping && !originalDirectionMappingsRef.current.has(direction)) {
                  originalDirectionMappingsRef.current.set(direction, {
                    key: stickMapping.key,
                    label: stickMapping.label
                  })
                }
                // Set editing state for this direction
                onSetEditingAxis({ gamepadIndex: gamepad.index, stickIndex, direction })
              }}
            >
              <div className="direction-label">{DIRECTION_LABELS[direction]}</div>
              <KeyMappingSelector
                currentMapping={stickMapping ? { key: stickMapping.key, label: stickMapping.label } : null}
                isEditing={editingAxis?.stickIndex === stickIndex && editingAxis?.direction === direction}
                pendingKey={pendingDirectionKeys.has(direction) ? pendingDirectionKeys.get(direction)! : null}
                onKeyPress={(key, label) => handleKeyPress(direction, key, label)}
                onRemove={() => {
                  onRemoveAxisMapping(stickIndex, direction)
                  // Remove from pending if exists
                  setPendingDirectionKeys(prev => {
                    const newMap = new Map(prev)
                    newMap.delete(direction)
                    return newMap
                  })
                }}
                showRemove={!!stickMapping || pendingDirectionKeys.has(direction)}
              />
              {isActive && <span className="active-indicator">●</span>}
            </div>
          )
        })}
      </div>

      {/* Global threshold control */}
      <div className="threshold-control">
        <label>Threshold (applies to all directions):</label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={threshold}
          onChange={(e) => {
            const newThreshold = parseFloat(e.target.value)
            setThreshold(newThreshold)
            setHasUnsavedChanges(true)
          }}
        />
        <span>{threshold.toFixed(2)}</span>
      </div>
      
      <MappingActions
        hasUnsavedChanges={hasUnsavedChanges}
        onApplyChanges={() => {
          // Apply all pending direction mappings with global threshold
          pendingDirectionKeys.forEach((pending, direction) => {
            onSetAxisMapping(stickIndex, direction, pending.key, pending.label, threshold, 'hotkey', 1.0, 1.0)
          })
          // Update threshold for all existing mappings if it changed
          if (Math.abs(threshold - originalThresholdRef.current) > 0.01) {
            stickMappings.forEach(m => {
              onSetAxisMapping(stickIndex, m.direction, m.key, m.label, threshold, 'hotkey', 1.0, 1.0)
            })
          }
          // Clear pending changes
          setPendingDirectionKeys(new Map())
          setHasUnsavedChanges(false)
          originalThresholdRef.current = threshold
          originalDirectionMappingsRef.current.clear()
          if (editingAxis) {
            onSetEditingAxis(null)
          }
        }}
        onRevertChanges={revertChanges}
        onRemoveMapping={() => {
          onRemoveAllMappings(stickIndex)
          setHasUnsavedChanges(false)
          setPendingDirectionKeys(new Map())
          originalDirectionMappingsRef.current.clear()
        }}
        showRemove={stickMappings.length > 0 || pendingDirectionKeys.size > 0}
      />
    </>
  )
}


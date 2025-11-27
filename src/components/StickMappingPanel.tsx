import { useState, useEffect, useRef } from 'react'
import { GamepadState } from '../hooks/useGamepad'
import { GamepadMapping, StickDirection } from '../hooks/useGamepadMapping'
import { StickHotkeyMode } from './StickHotkeyMode'
import { StickMouseMode } from './StickMouseMode'
import './MappingPanel.css'

interface StickMappingPanelProps {
  gamepad: GamepadState
  mapping?: GamepadMapping
  stickIndex: number
  editingAxis: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: 'hotkey' | 'mouse', sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  onSetEditingAxis: (value: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null) => void
}

export function StickMappingPanel({
  gamepad,
  mapping,
  stickIndex,
  editingAxis,
  onSetAxisMapping,
  onRemoveAxisMapping,
  onSetEditingAxis,
}: StickMappingPanelProps) {
  const [mappingType, setMappingType] = useState<'hotkey' | 'mouse'>('hotkey')
  const previousMappingTypeRef = useRef<'hotkey' | 'mouse' | null>(null)

  const stickMappings = mapping?.axisMappings.filter(m => m.stickIndex === stickIndex) || []
  const mouseMapping = stickMappings.find(m => m.type === 'mouse')
  const isMouseMode = mouseMapping !== undefined || mappingType === 'mouse'

  // Sync mapping type with existing mappings
  useEffect(() => {
    if (mouseMapping) {
      setMappingType('mouse')
      previousMappingTypeRef.current = 'mouse'
    } else {
      setMappingType('hotkey')
    }
  }, [mouseMapping])

  const removeAllStickMappings = (stickIndex: number) => {
    const stickMappings = mapping?.axisMappings.filter(m => m.stickIndex === stickIndex) || []
    stickMappings.forEach(m => {
      onRemoveAxisMapping(stickIndex, m.direction)
    })
  }

  return (
    <div className="mapping-panel-content">
      <div className="mapping-header">
        <h3>{stickIndex === 0 ? 'Left' : 'Right'} Stick</h3>
        <p className="panel-subtitle">Configure stick mapping</p>
      </div>
      
      {/* Mode selector */}
      <div className="mapping-mode-selector">
        <label>Mapping Mode:</label>
        <div className="mode-buttons">
          <button
            className={`mode-button ${!isMouseMode ? 'active' : ''}`}
            onClick={() => {
              // Switch to hotkey mode - remove mouse mapping if exists
              if (mouseMapping) {
                onRemoveAxisMapping(stickIndex, mouseMapping.direction)
              }
              // Track that we're switching modes
              previousMappingTypeRef.current = mappingType
              // Always set to hotkey mode and clear editing state
              setMappingType('hotkey')
              if (editingAxis?.stickIndex === stickIndex) {
                onSetEditingAxis(null)
              }
            }}
          >
            8 Directions (Hotkeys)
          </button>
          <button
            className={`mode-button ${isMouseMode ? 'active' : ''}`}
            onClick={() => {
              // Switch to mouse mode - remove all hotkey mappings for this stick first
              if (!mouseMapping) {
                // Remove all existing hotkey mappings for this stick
                stickMappings.forEach(m => {
                  if (m.type !== 'mouse') {
                    onRemoveAxisMapping(stickIndex, m.direction)
                  }
                })
                // Track that we're switching modes
                previousMappingTypeRef.current = mappingType
                setMappingType('mouse')
                // Clear any editing state
                if (editingAxis?.stickIndex === stickIndex) {
                  onSetEditingAxis(null)
                }
              }
            }}
          >
            Mouse Control
          </button>
        </div>
      </div>

      {isMouseMode ? (
        <StickMouseMode
          mapping={mapping}
          stickIndex={stickIndex}
          onSetAxisMapping={onSetAxisMapping}
          onRemoveAxisMapping={onRemoveAxisMapping}
          previousMappingType={previousMappingTypeRef.current}
        />
      ) : (
        <StickHotkeyMode
          gamepad={gamepad}
          mapping={mapping}
          stickIndex={stickIndex}
          editingAxis={editingAxis}
          onSetAxisMapping={onSetAxisMapping}
          onRemoveAxisMapping={onRemoveAxisMapping}
          onSetEditingAxis={onSetEditingAxis}
          onRemoveAllMappings={removeAllStickMappings}
        />
      )}
    </div>
  )
}


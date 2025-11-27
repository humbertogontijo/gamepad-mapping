import { useState, useCallback } from 'react'
import { GamepadState } from '../hooks/useGamepad'
import { GamepadMapping } from '../hooks/useGamepadMapping'
import { MappingActions } from './MappingPanel'
import { KeyMappingSelector } from './KeyMappingSelector'
import './MappingPanel.css'

const BUTTON_LABELS: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'Back',
  9: 'Start',
  10: 'Left Stick',
  11: 'Right Stick',
  12: 'D-Pad Up',
  13: 'D-Pad Down',
  14: 'D-Pad Left',
  15: 'D-Pad Right',
}

interface ButtonMappingPanelProps {
  gamepad: GamepadState
  mapping?: GamepadMapping
  buttonIndex: number
  editingButton: { gamepadIndex: number; buttonIndex: number } | null
  onSetButtonMapping: (buttonIndex: number, key: string, label: string) => void
  onRemoveButtonMapping: (buttonIndex: number) => void
  onSetEditingButton: (value: { gamepadIndex: number; buttonIndex: number } | null) => void
}

export function ButtonMappingPanel({
  gamepad,
  mapping,
  buttonIndex,
  editingButton,
  onSetButtonMapping,
  onRemoveButtonMapping,
  onSetEditingButton,
}: ButtonMappingPanelProps) {
  const [pendingButtonKey, setPendingButtonKey] = useState<{ key: string; label: string } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const button = gamepad.buttons[buttonIndex]
  const btnMapping = mapping?.buttonMappings.find(m => m.buttonIndex === buttonIndex)
  const isEditing = editingButton?.buttonIndex === buttonIndex

  const handleKeyPress = useCallback((key: string, label: string) => {
    setPendingButtonKey({ key, label })
    setHasUnsavedChanges(true)
  }, [])

  const revertChanges = useCallback(() => {
    setPendingButtonKey(null)
    setHasUnsavedChanges(false)
    onSetEditingButton(null)
  }, [onSetEditingButton])

  const getButtonLabel = (index: number) => {
    return BUTTON_LABELS[index] || `Button ${index}`
  }

  return (
    <div className="mapping-panel-content">
      <div className="mapping-header">
        <h3>{getButtonLabel(buttonIndex)}</h3>
        <p className="panel-subtitle">Configure button mapping</p>
      </div>
      
      <div className="stick-directions-list">
        <div
          className={`stick-direction-item ${btnMapping ? 'has-mapping' : ''} ${button?.pressed ? 'active' : ''} ${isEditing ? 'editing' : ''}`}
          onClick={() => {
            setPendingButtonKey(null)
            setHasUnsavedChanges(false)
            onSetEditingButton({ gamepadIndex: gamepad.index, buttonIndex })
          }}
        >
          <div className="direction-label">{getButtonLabel(buttonIndex)}</div>
          <KeyMappingSelector
            currentMapping={btnMapping ? { key: btnMapping.key, label: btnMapping.label } : null}
            isEditing={isEditing}
            pendingKey={pendingButtonKey}
            onKeyPress={handleKeyPress}
            onRemove={() => {
              onRemoveButtonMapping(buttonIndex)
              setHasUnsavedChanges(false)
              setPendingButtonKey(null)
            }}
            showRemove={!!btnMapping || !!pendingButtonKey}
          />
          {button?.pressed && <span className="active-indicator">●</span>}
        </div>
      </div>

      {isEditing && (
        <div className="editing-hint">
          {pendingButtonKey ? (
            <div>New key: <strong>{pendingButtonKey.label}</strong> (press Apply Changes to save)</div>
          ) : (
            <div>Press a key to map...</div>
          )}
        </div>
      )}
      
      <MappingActions
        hasUnsavedChanges={hasUnsavedChanges && isEditing}
        onApplyChanges={() => {
          if (pendingButtonKey) {
            onSetButtonMapping(buttonIndex, pendingButtonKey.key, pendingButtonKey.label)
          }
          setPendingButtonKey(null)
          setHasUnsavedChanges(false)
          onSetEditingButton(null)
        }}
        onRevertChanges={revertChanges}
        onRemoveMapping={() => {
          onRemoveButtonMapping(buttonIndex)
          setHasUnsavedChanges(false)
          setPendingButtonKey(null)
        }}
        showRemove={!!btnMapping || !!pendingButtonKey}
      />
    </div>
  )
}


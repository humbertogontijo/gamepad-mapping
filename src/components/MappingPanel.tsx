import { GamepadState } from '../hooks/useGamepad'
import { GamepadMapping, StickDirection } from '../hooks/useGamepadMapping'
import { ButtonMappingPanel } from './ButtonMappingPanel'
import { StickMappingPanel } from './StickMappingPanel'
import { AxisMappingPanel } from './AxisMappingPanel'
import './MappingPanel.css'

type SelectedControl = 
  | { type: 'button'; buttonIndex: number }
  | { type: 'axis'; stickIndex: number; direction: string }
  | { type: 'stick'; stickIndex: number }
  | null

interface MappingPanelProps {
  gamepad: GamepadState
  mapping?: GamepadMapping
  selectedControl: SelectedControl
  onSetButtonMapping: (buttonIndex: number, key: string, label: string) => void
  onSetAxisMapping: (stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number, type?: 'hotkey' | 'mouse', sensitivity?: number, acceleration?: number, invertX?: boolean, invertY?: boolean) => void
  onRemoveButtonMapping: (buttonIndex: number) => void
  onRemoveAxisMapping: (stickIndex: number, direction: StickDirection) => void
  editingButton: { gamepadIndex: number; buttonIndex: number } | null
  editingAxis: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null
  onSetEditingButton: (value: { gamepadIndex: number; buttonIndex: number } | null) => void
  onSetEditingAxis: (value: { gamepadIndex: number; stickIndex: number; direction: StickDirection } | null) => void
  onSelectControl?: (control: SelectedControl) => void
}

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

export interface MappingActionsProps {
  hasUnsavedChanges: boolean
  onApplyChanges: () => void
  onRevertChanges: () => void
  onRemoveMapping: () => void
  showRemove: boolean
}

export function MappingActions({ hasUnsavedChanges, onApplyChanges, onRevertChanges, onRemoveMapping, showRemove }: MappingActionsProps) {
  return (
    <div className="mapping-actions">
      {hasUnsavedChanges && (
        <>
          <button
            className="btn-revert"
            onClick={onRevertChanges}
          >
            Revert Changes
          </button>
          <button
            className="btn-map"
            onClick={onApplyChanges}
          >
            Apply Changes
          </button>
        </>
      )}
      {showRemove && (
        <button
          className="btn-remove"
          onClick={onRemoveMapping}
        >
          Remove Mapping
        </button>
      )}
    </div>
  )
}

export function MappingPanel({
  gamepad,
  mapping,
  selectedControl,
  onSetButtonMapping,
  onSetAxisMapping,
  onRemoveButtonMapping,
  onRemoveAxisMapping,
  editingButton,
  editingAxis,
  onSetEditingButton,
  onSetEditingAxis,
}: MappingPanelProps) {
  const getButtonLabel = (index: number) => {
    return BUTTON_LABELS[index] || `Button ${index}`
  }

  // Show all mappings when no control is selected
  if (!selectedControl) {
    const buttonMappings = mapping?.buttonMappings || []
    const axisMappings = mapping?.axisMappings || []
    
    return (
      <div className="mapping-panel-content">
        <div className="mapping-header">
          <h3>All Mappings</h3>
          <p className="panel-subtitle">{gamepad.id.split('(')[0].trim()}</p>
        </div>
        
        {/* Button Mappings */}
        {buttonMappings.length > 0 && (
          <div className="mappings-section">
            <h4 className="mappings-section-title">Buttons</h4>
            <div className="mappings-list">
              {buttonMappings.map(btnMapping => (
                <div key={btnMapping.buttonIndex} className="mapping-item">
                  <div className="mapping-item-label">{getButtonLabel(btnMapping.buttonIndex)}</div>
                  <div className="mapping-item-value">
                    <span className="mapped-key-small">{btnMapping.label}</span>
                    <button
                      className="btn-remove-small"
                      onClick={() => onRemoveButtonMapping(btnMapping.buttonIndex)}
                      title="Remove mapping"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stick Mappings */}
        {axisMappings.length > 0 && (
          <div className="mappings-section">
            <h4 className="mappings-section-title">Sticks</h4>
            <div className="mappings-list">
              {axisMappings.map(axisMapping => (
                <div key={`${axisMapping.stickIndex}-${axisMapping.direction}`} className="mapping-item">
                  <div className="mapping-item-label">
                    {axisMapping.stickIndex === 0 ? 'LS' : 'RS'} - {DIRECTION_LABELS[axisMapping.direction]}
                    {axisMapping.type === 'mouse' && <span className="mapping-type-badge">Mouse</span>}
                  </div>
                  <div className="mapping-item-value">
                    <span className="mapped-key-small">{axisMapping.label}</span>
                    <button
                      className="btn-remove-small"
                      onClick={() => onRemoveAxisMapping(axisMapping.stickIndex, axisMapping.direction)}
                      title="Remove mapping"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {buttonMappings.length === 0 && axisMappings.length === 0 && (
          <div className="no-mappings">
            <p>No mappings configured. Click on a button or stick in the controller to create a mapping.</p>
          </div>
        )}
      </div>
    )
  }

  // Handle button mapping
  if (selectedControl.type === 'button') {
    return (
      <ButtonMappingPanel
        gamepad={gamepad}
        mapping={mapping}
        buttonIndex={selectedControl.buttonIndex}
        editingButton={editingButton}
        onSetButtonMapping={onSetButtonMapping}
        onRemoveButtonMapping={onRemoveButtonMapping}
        onSetEditingButton={onSetEditingButton}
      />
    )
  }

  // Handle stick mapping
  if (selectedControl.type === 'stick') {
    return (
      <StickMappingPanel
        gamepad={gamepad}
        mapping={mapping}
        stickIndex={selectedControl.stickIndex}
        editingAxis={editingAxis}
        onSetAxisMapping={onSetAxisMapping}
        onRemoveAxisMapping={onRemoveAxisMapping}
        onSetEditingAxis={onSetEditingAxis}
      />
    )
  }

  // Handle axis/stick mapping (legacy - redirects to stick view)
  if (selectedControl.type === 'axis') {
    return (
      <AxisMappingPanel
        gamepad={gamepad}
        mapping={mapping}
        stickIndex={selectedControl.stickIndex}
        direction={selectedControl.direction as StickDirection}
        editingAxis={editingAxis}
        onSetAxisMapping={onSetAxisMapping}
        onRemoveAxisMapping={onRemoveAxisMapping}
        onSetEditingAxis={onSetEditingAxis}
      />
    )
  }

  return null
}

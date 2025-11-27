import { GamepadState } from '../hooks/useGamepad'
import './DeviceList.css'

interface DeviceListProps {
  gamepads: GamepadState[]
  selectedGamepadIndex: number | null
  onSelectGamepad: (index: number) => void
}

export function DeviceList({ gamepads, selectedGamepadIndex, onSelectGamepad }: DeviceListProps) {
  return (
    <aside className="device-panel">
      <div className="panel-header">
        <h2>Devices</h2>
      </div>
      <div className="device-list">
        {gamepads.length === 0 ? (
          <div className="empty-state-sidebar">
            <p>No gamepads connected.</p>
          </div>
        ) : (
          gamepads.map((gamepad) => (
            <button
              key={gamepad.index}
              className={`device-item ${selectedGamepadIndex === gamepad.index ? 'active' : ''}`}
              onClick={() => onSelectGamepad(gamepad.index)}
            >
              <div className="device-icon">🎮</div>
              <div className="device-info">
                <div className="device-name">
                  {gamepad.id.split('(')[0].trim() || `Gamepad ${gamepad.index + 1}`}
                </div>
                <div className="device-id">{gamepad.id}</div>
              </div>
              {gamepad.connected && (
                <div className="device-status" title="Connected" />
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}


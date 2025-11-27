import { GamepadState } from '../hooks/useGamepad'
import './GamepadVisualizer.css'

interface GamepadVisualizerProps {
  gamepad: GamepadState
}

export function GamepadVisualizer({ gamepad }: GamepadVisualizerProps) {
  const buttonLabels = [
    'A', 'B', 'X', 'Y',
    'LB', 'RB', 'LT', 'RT',
    'Back', 'Start',
    'LS', 'RS',
    'Up', 'Down', 'Left', 'Right',
  ]

  const getButtonLabel = (index: number): string => {
    return buttonLabels[index] || `Btn ${index}`
  }

  const getButtonClass = (pressed: boolean): string => {
    return `gamepad-button ${pressed ? 'pressed' : ''}`
  }

  const getButton = (index: number) => {
    return gamepad.buttons[index] || { pressed: false, value: 0 }
  }

  return (
    <div className="gamepad-container">
      <div className="gamepad-header">
        <h2>Gamepad {gamepad.index + 1}</h2>
        <p className="gamepad-id">{gamepad.id}</p>
      </div>

      <div className="gamepad-body">
        {/* Left Side */}
        <div className="gamepad-section left-section">
          {/* D-Pad */}
          <div className="dpad-container">
            <div className="dpad">
              <button className={getButtonClass(getButton(12).pressed)}>
                ↑
              </button>
              <div className="dpad-middle">
                <button className={getButtonClass(getButton(14).pressed)}>
                  ←
                </button>
                <button className={getButtonClass(getButton(15).pressed)}>
                  →
                </button>
              </div>
              <button className={getButtonClass(getButton(13).pressed)}>
                ↓
              </button>
            </div>
          </div>

          {/* Left Stick */}
          <div className="stick-container">
            <div className="stick-label">Left Stick</div>
            <div className="stick">
              <div
                className="stick-indicator"
                style={{
                  transform: `translate(${gamepad.axes[0] * 30}px, ${gamepad.axes[1] * 30}px)`,
                }}
              />
            </div>
            <div className="stick-values">
              X: {gamepad.axes[0]?.toFixed(2) || '0.00'} | Y: {gamepad.axes[1]?.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Left Bumper & Trigger */}
          <div className="shoulder-buttons">
            <button className={getButtonClass(getButton(4).pressed)}>
              LB
            </button>
            <div className="trigger-container">
              <div className="trigger-value">
                LT: {getButton(6).value.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="gamepad-section center-section">
          <div className="center-buttons">
            <button className={getButtonClass(getButton(8).pressed)}>
              Back
            </button>
            <button className={getButtonClass(getButton(9).pressed)}>
              Start
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="gamepad-section right-section">
          {/* Face Buttons */}
          <div className="face-buttons">
            <button className={getButtonClass(getButton(0).pressed)}>
              A
            </button>
            <button className={getButtonClass(getButton(1).pressed)}>
              B
            </button>
            <button className={getButtonClass(getButton(2).pressed)}>
              X
            </button>
            <button className={getButtonClass(getButton(3).pressed)}>
              Y
            </button>
          </div>

          {/* Right Stick */}
          <div className="stick-container">
            <div className="stick-label">Right Stick</div>
            <div className="stick">
              <div
                className="stick-indicator"
                style={{
                  transform: `translate(${gamepad.axes[2] * 30}px, ${gamepad.axes[3] * 30}px)`,
                }}
              />
            </div>
            <div className="stick-values">
              X: {gamepad.axes[2]?.toFixed(2) || '0.00'} | Y: {gamepad.axes[3]?.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Right Bumper & Trigger */}
          <div className="shoulder-buttons">
            <button className={getButtonClass(getButton(5).pressed)}>
              RB
            </button>
            <div className="trigger-container">
              <div className="trigger-value">
                RT: {getButton(7).value.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Buttons List */}
      <div className="all-buttons">
        <h3>All Buttons</h3>
        <div className="buttons-grid">
          {gamepad.buttons.map((button, index) => (
            <button
              key={index}
              className={getButtonClass(button.pressed)}
              title={`Button ${index}`}
            >
              {getButtonLabel(index)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


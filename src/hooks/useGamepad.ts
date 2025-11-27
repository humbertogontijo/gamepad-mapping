import { useState, useEffect, useCallback } from 'react'

export interface GamepadButton {
  pressed: boolean
  value: number
}

export interface GamepadState {
  index: number
  id: string
  buttons: GamepadButton[]
  axes: number[]
  connected: boolean
}

export function useGamepad() {
  const [gamepads, setGamepads] = useState<GamepadState[]>([])

  // Extract gamepad polling logic to avoid duplication
  const pollGamepads = useCallback((): GamepadState[] => {
    const gamepadList = navigator.getGamepads()
    
    const connectedGamepads: GamepadState[] = []

    for (let i = 0; i < gamepadList.length; i++) {
      const gamepad = gamepadList[i]
      if (gamepad) {
        connectedGamepads.push({
          index: gamepad.index,
          id: gamepad.id,
          buttons: Array.from(gamepad.buttons).map(btn => ({
            pressed: btn.pressed || btn.touched,
            value: btn.value,
          })),
          axes: Array.from(gamepad.axes),
          connected: gamepad.connected,
        })
      }
    }

    return connectedGamepads
  }, [])

  const updateGamepads = useCallback(() => {
    setGamepads(pollGamepads())
  }, [pollGamepads])

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id)
      updateGamepads()
    }

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id)
      updateGamepads()
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)

    // Listen for gamepad updates from main process (works even when window doesn't have focus)
    const handleGamepadUpdate = (_event: unknown, gamepads: GamepadState[]) => {
      setGamepads(gamepads)
    }

    // Listen for poll requests from main process
    const handlePollRequest = () => {
      const connectedGamepads = pollGamepads()
      
      // Send gamepad data to main process
      if (window.ipcRenderer) {
        window.ipcRenderer.send('gamepad-data', connectedGamepads)
      }
      
      // Also update local state
      setGamepads(connectedGamepads)
    }

    if (window.ipcRenderer) {
      window.ipcRenderer.on('poll-gamepads', handlePollRequest)
      window.ipcRenderer.on('gamepad-update', handleGamepadUpdate)
    }

    // Also poll locally as fallback (in case IPC communication fails)
    const intervalId = setInterval(() => {
      updateGamepads()
    }, 16)

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
      if (window.ipcRenderer) {
        window.ipcRenderer.off('poll-gamepads', handlePollRequest)
        window.ipcRenderer.off('gamepad-update', handleGamepadUpdate)
      }
      clearInterval(intervalId)
    }
  }, [updateGamepads, pollGamepads])

  return gamepads
}


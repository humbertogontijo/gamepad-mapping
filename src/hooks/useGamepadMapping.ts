import { useState, useCallback, useEffect, useRef } from 'react'
import { GamepadState } from './useGamepad'

export interface ButtonMapping {
  buttonIndex: number
  key: string
  label: string
}

export type StickDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'

export type StickMappingType = 'hotkey' | 'mouse'

export interface AxisMapping {
  stickIndex: number // 0 for left stick, 1 for right stick
  direction: StickDirection // Only used for hotkey mode
  key: string
  label: string
  threshold: number
  type: StickMappingType // 'hotkey' for 8 directions, 'mouse' for mouse control
  sensitivity?: number // For mouse control (0.1 - 10.0)
  acceleration?: number // For mouse control (0.0 - 2.0)
  invertX?: boolean // For mouse control
  invertY?: boolean // For mouse control
}

export interface GamepadMapping {
  gamepadIndex: number
  buttonMappings: ButtonMapping[]
  axisMappings: AxisMapping[]
}

const STORAGE_KEY = 'gamepad-mappings'

export function useGamepadMapping(gamepads: GamepadState[]) {
  const [mappings, setMappings] = useState<GamepadMapping[]>([])
  const [editingButton, setEditingButton] = useState<{ gamepadIndex: number; buttonIndex: number } | null>(null)
  const [editingAxis, setEditingAxis] = useState<{ gamepadIndex: number; stickIndex: number; direction: StickDirection } | null>(null)

  // Load mappings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setMappings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load mappings:', e)
      }
    }
  }, [])

  // Initialize mappings for new gamepads
  useEffect(() => {
    setMappings(prev => {
      const updated = [...prev]
      gamepads.forEach(gamepad => {
        const existing = updated.find(m => m.gamepadIndex === gamepad.index)
        if (!existing) {
          updated.push({
            gamepadIndex: gamepad.index,
            buttonMappings: [],
            axisMappings: [],
          })
        }
      })
      return updated
    })
  }, [gamepads])

  // Save mappings to localStorage
  useEffect(() => {
    if (mappings.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
    }
  }, [mappings])

  const getMapping = useCallback((gamepadIndex: number): GamepadMapping | undefined => {
    return mappings.find(m => m.gamepadIndex === gamepadIndex)
  }, [mappings])

  // Memoize mouse mappings lookup to avoid filtering every frame
  const getMouseMappings = useCallback((mapping: GamepadMapping) => {
    return mapping.axisMappings.filter(m => m.type === 'mouse')
  }, [])

  const setButtonMapping = useCallback((gamepadIndex: number, buttonIndex: number, key: string, label: string) => {
    setMappings(prev => {
      const updated = [...prev]
      let mapping = updated.find(m => m.gamepadIndex === gamepadIndex)
      
      if (!mapping) {
        mapping = {
          gamepadIndex,
          buttonMappings: [],
          axisMappings: [],
        }
        updated.push(mapping)
      }

      const existingButtonMapping = mapping.buttonMappings.find(m => m.buttonIndex === buttonIndex)
      if (existingButtonMapping) {
        existingButtonMapping.key = key
        existingButtonMapping.label = label
      } else {
        mapping.buttonMappings.push({ buttonIndex, key, label })
      }

      return updated
    })
    setEditingButton(null)
  }, [])

  const setAxisMapping = useCallback((gamepadIndex: number, stickIndex: number, direction: StickDirection, key: string, label: string, threshold: number = 0.5, type: StickMappingType = 'hotkey', sensitivity: number = 1.0, acceleration: number = 1.0, invertX: boolean = false, invertY: boolean = false) => {
    setMappings(prev => {
      const updated = [...prev]
      let mapping = updated.find(m => m.gamepadIndex === gamepadIndex)
      
      if (!mapping) {
        mapping = {
          gamepadIndex,
          buttonMappings: [],
          axisMappings: [],
        }
        updated.push(mapping)
      }

      if (type === 'mouse') {
        // For mouse mode, there's only one mapping per stick (direction doesn't matter)
        const existingMouseMapping = mapping.axisMappings.find(m => m.stickIndex === stickIndex && m.type === 'mouse')
        if (existingMouseMapping) {
          existingMouseMapping.threshold = threshold
          existingMouseMapping.sensitivity = sensitivity
          existingMouseMapping.acceleration = acceleration
          existingMouseMapping.invertX = invertX
          existingMouseMapping.invertY = invertY
        } else {
          // Remove all hotkey mappings for this stick when adding mouse mapping
          mapping.axisMappings = mapping.axisMappings.filter(m => !(m.stickIndex === stickIndex && m.type === 'hotkey'))
          mapping.axisMappings.push({ stickIndex, direction: 'up', key: 'Mouse', label: 'Mouse', threshold, type: 'mouse', sensitivity, acceleration, invertX, invertY })
        }
      } else {
        // Hotkey mode - individual direction mappings
        const existingAxisMapping = mapping.axisMappings.find(m => m.stickIndex === stickIndex && m.direction === direction && m.type === 'hotkey')
        if (existingAxisMapping) {
          existingAxisMapping.key = key
          existingAxisMapping.label = label
          existingAxisMapping.threshold = threshold
        } else {
          // Remove mouse mapping if exists when adding hotkey mapping
          mapping.axisMappings = mapping.axisMappings.filter(m => !(m.stickIndex === stickIndex && m.type === 'mouse'))
          mapping.axisMappings.push({ stickIndex, direction, key, label, threshold, type: 'hotkey' })
        }
      }

      return updated
    })
    setEditingAxis(null)
  }, [])

  const removeButtonMapping = useCallback((gamepadIndex: number, buttonIndex: number) => {
    setMappings(prev => {
      const updated = [...prev]
      const mapping = updated.find(m => m.gamepadIndex === gamepadIndex)
      if (mapping) {
        mapping.buttonMappings = mapping.buttonMappings.filter(m => m.buttonIndex !== buttonIndex)
      }
      return updated
    })
  }, [])

  const removeAxisMapping = useCallback((gamepadIndex: number, stickIndex: number, direction: StickDirection) => {
    setMappings(prev => {
      const updated = [...prev]
      const mapping = updated.find(m => m.gamepadIndex === gamepadIndex)
      if (mapping) {
        mapping.axisMappings = mapping.axisMappings.filter(m => !(m.stickIndex === stickIndex && m.direction === direction))
      }
      return updated
    })
  }, [])

  // Track which stateKeys are holding each key (allows multiple buttons to hold same key)
  const keyHoldersRef = useRef<Map<string, Set<string>>>(new Map())
  // Track previous button states to only trigger on state changes
  const previousButtonStatesRef = useRef<Map<string, boolean>>(new Map())
  // Track previous axis states to only trigger on state changes
  const previousAxisStatesRef = useRef<Map<string, boolean>>(new Map())
  // Track pending mouse movements to prevent queuing (which causes drift)
  const pendingMouseMovementsRef = useRef<Set<string>>(new Set())

  // Simulate keyboard key press via Electron IPC
  const simulateKeyPress = useCallback(async (key: string, pressed: boolean, stateKey: string) => {
    if (!window.keySimulator) {
      console.warn('Key simulator not available')
      return
    }

    // Check if state actually changed
    const previousState = previousButtonStatesRef.current.get(stateKey) ?? previousAxisStatesRef.current.get(stateKey)
    if (previousState === pressed) {
      // State hasn't changed, don't do anything
      return
    }

    // Update previous state
    if (stateKey.startsWith('button-')) {
      previousButtonStatesRef.current.set(stateKey, pressed)
    } else {
      previousAxisStatesRef.current.set(stateKey, pressed)
    }

    // Get or create the set of stateKeys holding this key
    if (!keyHoldersRef.current.has(key)) {
      keyHoldersRef.current.set(key, new Set())
    }
    const holders = keyHoldersRef.current.get(key)!

    const wasPressed = holders.size > 0

    if (pressed) {
      // Add this stateKey to the holders set
      holders.add(stateKey)
      
      // Only press the key if it wasn't already pressed by another button
      if (!wasPressed) {
        try {
          const result = await window.keySimulator.keyToggle(key, true)
          if (result && !result.success && result.error) {
            console.error('Key simulation error:', result.error)
            // If it's a permissions error, log it prominently
            if (result.error.includes('Accessibility permissions')) {
              console.error('⚠️ Accessibility permissions required! Please grant permissions in System Preferences > Security & Privacy > Privacy > Accessibility')
            }
          }
        } catch (error) {
          console.error('Error pressing key:', error)
        }
      }
    } else {
      // Remove this stateKey from the holders set
      holders.delete(stateKey)
      
      // Only release the key if no other buttons are holding it
      if (wasPressed && holders.size === 0) {
        try {
          const result = await window.keySimulator.keyToggle(key, false)
          if (result && !result.success && result.error) {
            console.error('Key simulation error:', result.error)
            if (result.error.includes('Accessibility permissions')) {
              console.error('⚠️ Accessibility permissions required! Please grant permissions in System Preferences > Security & Privacy > Privacy > Accessibility')
            }
          }
        } catch (error) {
          console.error('Error releasing key:', error)
        }
      }
    }
  }, [])

  // Calculate stick direction from X and Y axes
  const getStickDirection = useCallback((x: number, y: number, threshold: number): StickDirection | null => {
    const absX = Math.abs(x)
    const absY = Math.abs(y)
    
    if (absX < threshold && absY < threshold) {
      return null // No direction
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
  }, [])

  // Check and trigger mappings based on gamepad state
  useEffect(() => {
    gamepads.forEach(gamepad => {
      const mapping = getMapping(gamepad.index)
      if (!mapping) return

      // Check button mappings
      mapping.buttonMappings.forEach(btnMapping => {
        const button = gamepad.buttons[btnMapping.buttonIndex]
        if (button) {
          const stateKey = `gamepad-${gamepad.index}-button-${btnMapping.buttonIndex}`
          simulateKeyPress(btnMapping.key, button.pressed, stateKey)
        }
      })

      // Process axis mappings - handle both hotkey and mouse control modes
      // Check if mouse mode is enabled for each stick
      const mouseMappings = getMouseMappings(mapping)
      const sticksWithMouse = new Set(mouseMappings.map(m => m.stickIndex))
      const processedMouseSticks = new Set<number>()
      
      // Process mouse mappings first (one per stick)
      mouseMappings.forEach(mouseMapping => {
        const stickIndex = mouseMapping.stickIndex
        if (processedMouseSticks.has(stickIndex)) {
          return // Already processed this stick
        }
        processedMouseSticks.add(stickIndex)
        
        // Get stick axes based on stick index (0 = left, 1 = right)
        const axisXIndex = stickIndex === 0 ? 0 : 2
        const axisYIndex = stickIndex === 0 ? 1 : 3
        let stickX = gamepad.axes[axisXIndex] || 0
        let stickY = gamepad.axes[axisYIndex] || 0
        
        // Apply user invert settings
        if (mouseMapping.invertX) stickX = -stickX
        if (mouseMapping.invertY) stickY = -stickY
        
        // Use flat deadzone threshold for X and Y independently (not relative to magnitude)
        const absX = Math.abs(stickX)
        const absY = Math.abs(stickY)
        const threshold = mouseMapping.threshold
        const inDeadzone = absX < threshold && absY < threshold
        
        if (inDeadzone) {
          return // In deadzone - don't move mouse
        }
        
        // Calculate movement with sensitivity and acceleration
        const sensitivity = mouseMapping.sensitivity ?? 1.0
        const acceleration = mouseMapping.acceleration ?? 1.0
        
        // Remove deadzone: subtract threshold from X and Y independently (flat deadzone)
        let normalizedX = 0
        let normalizedY = 0
        
        if (absX >= threshold) {
          const signX = stickX >= 0 ? 1 : -1
          normalizedX = signX * (absX - threshold) / (1 - threshold)
        }
        
        if (absY >= threshold) {
          const signY = stickY >= 0 ? 1 : -1
          normalizedY = signY * (absY - threshold) / (1 - threshold)
        }
        
        // Calculate magnitude from normalized values for acceleration
        const normalizedMagnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
        
        // Apply acceleration curve
        let scaleFactor = 1.0
        if (normalizedMagnitude > 0 && acceleration !== 1.0) {
          scaleFactor = Math.pow(normalizedMagnitude, acceleration) / normalizedMagnitude
        }
        
        // Calculate movement delta
        const deltaX = normalizedX * sensitivity * scaleFactor * 10
        const deltaY = normalizedY * sensitivity * scaleFactor * 10
        
        // Final check: re-read stick state RIGHT BEFORE sending to prevent drift
        // This ensures we never send a movement if stick is already released
        let finalStickX = gamepad.axes[axisXIndex] || 0
        let finalStickY = gamepad.axes[axisYIndex] || 0
        if (mouseMapping.invertX) finalStickX = -finalStickX
        if (mouseMapping.invertY) finalStickY = -finalStickY
        
        if (Math.abs(finalStickX) < threshold && Math.abs(finalStickY) < threshold) {
          return // In deadzone now - don't send movement
        }
        
        // Prevent queuing: only send if no pending movement for this stick
        // Queued IPC calls cause drift because each reads mouse position after previous move
        const mouseStateKey = `gamepad-${gamepad.index}-mouse-${stickIndex}`
        if (pendingMouseMovementsRef.current.has(mouseStateKey)) {
          return // Skip this frame - previous movement still pending
        }
        
        // Send movement - mark as pending to prevent queuing
        if (window.mouseSimulator) {
          pendingMouseMovementsRef.current.add(mouseStateKey)
          window.mouseSimulator.moveMouse(deltaX, deltaY)
            .then(() => {
              pendingMouseMovementsRef.current.delete(mouseStateKey)
            })
            .catch(err => {
              console.error('Error moving mouse:', err)
              pendingMouseMovementsRef.current.delete(mouseStateKey)
            })
        }
      })
      
      // Process hotkey mappings (skip if mouse mode is enabled for that stick)
      mapping.axisMappings.forEach(axisMapping => {
        const mappingType = axisMapping.type || 'hotkey' // Default to hotkey for backward compatibility
        
        // Skip hotkey mappings if mouse mode is enabled for this stick
        if (mappingType === 'hotkey' && sticksWithMouse.has(axisMapping.stickIndex)) {
          return
        }
        
        if (mappingType === 'hotkey') {
          // Hotkey mode - 8 directions
          const stateKey = `gamepad-${gamepad.index}-axis-${axisMapping.stickIndex}-${axisMapping.direction}`
          let isActive = false
          
          if (axisMapping.stickIndex === 0) {
            // Left stick (axes 0 and 1)
            const stickDirection = getStickDirection(
              gamepad.axes[0] || 0,
              gamepad.axes[1] || 0,
              axisMapping.threshold
            )
            isActive = stickDirection === axisMapping.direction
          } else if (axisMapping.stickIndex === 1) {
            // Right stick (axes 2 and 3)
            const stickDirection = getStickDirection(
              gamepad.axes[2] || 0,
              gamepad.axes[3] || 0,
              axisMapping.threshold
            )
            isActive = stickDirection === axisMapping.direction
          }
          
          simulateKeyPress(axisMapping.key, isActive, stateKey)
        }
      })
    })
  }, [gamepads, getMapping, getMouseMappings, simulateKeyPress, getStickDirection])

  return {
    mappings,
    getMapping,
    setButtonMapping,
    setAxisMapping,
    removeButtonMapping,
    removeAxisMapping,
    editingButton,
    setEditingButton,
    editingAxis,
    setEditingAxis,
  }
}


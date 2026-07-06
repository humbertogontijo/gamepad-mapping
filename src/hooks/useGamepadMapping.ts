import { useState, useCallback, useEffect, useRef } from "react";
import { GamepadState } from "./useGamepad";
import {
  getStickDirection,
  getDpadDirection,
  getStickAxes,
} from "../utils/stickDirection";
import {
  DEFAULT_STICK_THRESHOLD,
  DEFAULT_MOUSE_SENSITIVITY,
  DEFAULT_MOUSE_ACCELERATION,
  DEFAULT_MOUSE_INVERT_X,
  DEFAULT_MOUSE_INVERT_Y,
  DEFAULT_SCROLL_ACCELERATION,
  DEFAULT_SCROLL_INVERT_X,
  DEFAULT_SCROLL_INVERT_Y,
  DEFAULT_SCROLL_SENSITIVITY,
  DEFAULT_STICK_MAPPING_TYPE,
} from "../constants/defaults";

export interface ButtonMapping {
  buttonIndex: number;
  key: string;
  label: string;
}

export type StickDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right";

export type StickMappingType = "hotkey" | "mouse" | "scroll";

export interface AxisMapping {
  stickIndex: number; // 0 for left stick, 1 for right stick
  direction: StickDirection; // Only used for hotkey mode
  key: string;
  label: string;
  threshold: number;
  type: StickMappingType; // 'hotkey' for 8 directions, 'mouse' for mouse control, 'scroll' for wheel control
  sensitivity?: number; // For mouse/scroll control (0.1 - 10.0)
  acceleration?: number; // For mouse/scroll control (0.0 - 2.0)
  invertX?: boolean; // For mouse/scroll control
  invertY?: boolean; // For mouse/scroll control
}

export interface DpadMapping {
  direction: StickDirection;
  key: string;
  label: string;
}

export interface GamepadMapping {
  gamepadIndex: number;
  buttonMappings: ButtonMapping[];
  axisMappings: AxisMapping[];
  dpadMappings?: DpadMapping[];
}

const STORAGE_KEY = "gamepad-mappings";
const SCROLL_STEPS_PER_SECOND = 60;

export function useGamepadMapping(gamepads: GamepadState[]) {
  const [mappings, setMappings] = useState<GamepadMapping[]>([]);
  const [editingButton, setEditingButton] = useState<{
    gamepadIndex: number;
    buttonIndex: number;
  } | null>(null);
  const [editingAxis, setEditingAxis] = useState<{
    gamepadIndex: number;
    stickIndex: number;
    direction: StickDirection;
  } | null>(null);
  const [editingDpad, setEditingDpad] = useState<{
    gamepadIndex: number;
    direction: StickDirection;
  } | null>(null);

  // Load mappings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMappings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load mappings:", e);
      }
    }
  }, []);

  // Initialize mappings for new gamepads
  useEffect(() => {
    setMappings((prev) => {
      const updated = [...prev];
      gamepads.forEach((gamepad) => {
        const existing = updated.find((m) => m.gamepadIndex === gamepad.index);
        if (!existing) {
          updated.push({
            gamepadIndex: gamepad.index,
            buttonMappings: [],
            axisMappings: [],
            dpadMappings: [],
          });
        }
      });
      return updated;
    });
  }, [gamepads]);

  // Save mappings to localStorage
  useEffect(() => {
    if (mappings.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    }
  }, [mappings]);

  const getMapping = useCallback(
    (gamepadIndex: number): GamepadMapping | undefined => {
      return mappings.find((m) => m.gamepadIndex === gamepadIndex);
    },
    [mappings]
  );

  // Memoize mouse mappings lookup to avoid filtering every frame
  const getMouseMappings = useCallback((mapping: GamepadMapping) => {
    return mapping.axisMappings.filter((m) => m.type === "mouse");
  }, []);

  const getScrollMappings = useCallback((mapping: GamepadMapping) => {
    return mapping.axisMappings.filter((m) => m.type === "scroll");
  }, []);

  const setButtonMapping = useCallback(
    (gamepadIndex: number, buttonIndex: number, key: string, label: string) => {
      setMappings((prev) => {
        const updated = [...prev];
        let mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);

        if (!mapping) {
          mapping = {
            gamepadIndex,
            buttonMappings: [],
            axisMappings: [],
            dpadMappings: [],
          };
          updated.push(mapping);
        }

        const existingButtonMapping = mapping.buttonMappings.find(
          (m) => m.buttonIndex === buttonIndex
        );
        if (existingButtonMapping) {
          existingButtonMapping.key = key;
          existingButtonMapping.label = label;
        } else {
          mapping.buttonMappings.push({ buttonIndex, key, label });
        }

        return updated;
      });
      setEditingButton(null);
    },
    []
  );

  const setAxisMapping = useCallback(
    (
      gamepadIndex: number,
      stickIndex: number,
      direction: StickDirection,
      key: string,
      label: string,
      threshold: number = DEFAULT_STICK_THRESHOLD,
      type: StickMappingType = DEFAULT_STICK_MAPPING_TYPE,
      sensitivity: number = DEFAULT_MOUSE_SENSITIVITY,
      acceleration: number = DEFAULT_MOUSE_ACCELERATION,
      invertX: boolean = DEFAULT_MOUSE_INVERT_X,
      invertY: boolean = DEFAULT_MOUSE_INVERT_Y
    ) => {
      setMappings((prev) => {
        const updated = [...prev];
        let mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);

        if (!mapping) {
          mapping = {
            gamepadIndex,
            buttonMappings: [],
            axisMappings: [],
            dpadMappings: [],
          };
          updated.push(mapping);
        }

        if (type === "mouse" || type === "scroll") {
          // For continuous modes, there's only one mapping per stick (direction doesn't matter)
          const existingContinuousMapping = mapping.axisMappings.find(
            (m) => m.stickIndex === stickIndex && m.type === type
          );
          if (existingContinuousMapping) {
            existingContinuousMapping.threshold = threshold;
            existingContinuousMapping.sensitivity = sensitivity;
            existingContinuousMapping.acceleration = acceleration;
            existingContinuousMapping.invertX = invertX;
            existingContinuousMapping.invertY = invertY;
          } else {
            // Remove all other mappings for this stick when adding a continuous mapping
            mapping.axisMappings = mapping.axisMappings.filter(
              (m) => m.stickIndex !== stickIndex
            );
            mapping.axisMappings.push({
              stickIndex,
              direction: "up",
              key: type === "mouse" ? "Mouse" : "Scroll",
              label: type === "mouse" ? "Mouse" : "Scroll",
              threshold,
              type,
              sensitivity,
              acceleration,
              invertX,
              invertY,
            });
          }
        } else {
          // Hotkey mode - individual direction mappings
          const existingAxisMapping = mapping.axisMappings.find(
            (m) =>
              m.stickIndex === stickIndex &&
              m.direction === direction &&
              m.type === "hotkey"
          );
          if (existingAxisMapping) {
            existingAxisMapping.key = key;
            existingAxisMapping.label = label;
            existingAxisMapping.threshold = threshold;
          } else {
            // Remove continuous mapping if exists when adding hotkey mapping
            mapping.axisMappings = mapping.axisMappings.filter(
              (m) => !(m.stickIndex === stickIndex && m.type !== "hotkey")
            );
            mapping.axisMappings.push({
              stickIndex,
              direction,
              key,
              label,
              threshold,
              type: "hotkey",
            });
          }
        }

        return updated;
      });
      setEditingAxis(null);
    },
    []
  );

  const removeButtonMapping = useCallback(
    (gamepadIndex: number, buttonIndex: number) => {
      setMappings((prev) => {
        const updated = [...prev];
        const mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);
        if (mapping) {
          mapping.buttonMappings = mapping.buttonMappings.filter(
            (m) => m.buttonIndex !== buttonIndex
          );
        }
        return updated;
      });
    },
    []
  );

  const removeAxisMapping = useCallback(
    (gamepadIndex: number, stickIndex: number, direction: StickDirection) => {
      setMappings((prev) => {
        const updated = [...prev];
        const mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);
        if (mapping) {
          mapping.axisMappings = mapping.axisMappings.filter(
            (m) => !(m.stickIndex === stickIndex && m.direction === direction)
          );
        }
        return updated;
      });
    },
    []
  );

  const setDpadMapping = useCallback(
    (
      gamepadIndex: number,
      direction: StickDirection,
      key: string,
      label: string
    ) => {
      setMappings((prev) => {
        const updated = [...prev];
        let mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);

        if (!mapping) {
          mapping = {
            gamepadIndex,
            buttonMappings: [],
            axisMappings: [],
            dpadMappings: [],
          };
          updated.push(mapping);
        }

        if (!mapping.dpadMappings) {
          mapping.dpadMappings = [];
        }

        const existingDpadMapping = mapping.dpadMappings.find(
          (m) => m.direction === direction
        );
        if (existingDpadMapping) {
          existingDpadMapping.key = key;
          existingDpadMapping.label = label;
        } else {
          mapping.dpadMappings.push({ direction, key, label });
        }

        return updated;
      });
      setEditingDpad(null);
    },
    []
  );

  const removeDpadMapping = useCallback(
    (gamepadIndex: number, direction: StickDirection) => {
      setMappings((prev) => {
        const updated = [...prev];
        const mapping = updated.find((m) => m.gamepadIndex === gamepadIndex);
        if (mapping && mapping.dpadMappings) {
          mapping.dpadMappings = mapping.dpadMappings.filter(
            (m) => m.direction !== direction
          );
        }
        return updated;
      });
    },
    []
  );

  // Helper function to get fallback cardinal directions for diagonal directions
  const getFallbackDirections = useCallback(
    (direction: StickDirection): StickDirection[] => {
      switch (direction) {
        case "up-left":
          return ["up", "left"];
        case "up-right":
          return ["up", "right"];
        case "down-left":
          return ["down", "left"];
        case "down-right":
          return ["down", "right"];
        default:
          return [];
      }
    },
    []
  );

  // Track which stateKeys are holding each key (allows multiple buttons to hold same key)
  const keyHoldersRef = useRef<Map<string, Set<string>>>(new Map());
  // Track previous button states to only trigger on state changes
  const previousButtonStatesRef = useRef<Map<string, boolean>>(new Map());
  // Track previous axis states to only trigger on state changes
  const previousAxisStatesRef = useRef<Map<string, boolean>>(new Map());
  // Track pending mouse movements to prevent queuing (which causes drift)
  const pendingMouseMovementsRef = useRef<Set<string>>(new Set());
  const scrollRemainderRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const lastScrollUpdateTimeRef = useRef<Map<string, number>>(new Map());
  // Track when each stick started moving for time-based acceleration
  const stickMovementStartTimeRef = useRef<Map<string, number>>(new Map());

  const isMouseWheelKey = (key: string) => key.startsWith("MouseWheel");

  const getMouseWheelDelta = (key: string, amount: number = 1) => {
    switch (key) {
      case "MouseWheelUp":
        return { deltaX: 0, deltaY: -amount };
      case "MouseWheelDown":
        return { deltaX: 0, deltaY: amount };
      case "MouseWheelLeft":
        return { deltaX: -amount, deltaY: 0 };
      case "MouseWheelRight":
        return { deltaX: amount, deltaY: 0 };
      default:
        return null;
    }
  };

  const sendMouseScroll = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!window.mouseSimulator) {
        return;
      }

      const stepsX = Math.trunc(deltaX);
      const stepsY = Math.trunc(deltaY);
      if (stepsX === 0 && stepsY === 0) {
        return;
      }

      void window.mouseSimulator.scrollMouse(stepsX, stepsY).catch((err) => {
        console.error("Error scrolling mouse:", err);
      });
    },
    []
  );

  const triggerMappedWheelScroll = useCallback(
    (key: string, stateKey: string, amount: number = 1) => {
      const delta = getMouseWheelDelta(key, amount);
      if (!delta) {
        return;
      }
      sendMouseScroll(delta.deltaX, delta.deltaY);
    },
    [sendMouseScroll]
  );

  // Simulate keyboard key press or mouse button via Electron IPC
  const simulateKeyPress = useCallback(
    async (key: string, pressed: boolean, stateKey: string) => {
      // Check if state actually changed
      const previousState =
        previousButtonStatesRef.current.get(stateKey) ??
        previousAxisStatesRef.current.get(stateKey);
      if (previousState === pressed) {
        // State hasn't changed, don't do anything
        return;
      }

      // Update previous state
      if (stateKey.startsWith("button-")) {
        previousButtonStatesRef.current.set(stateKey, pressed);
      } else {
        previousAxisStatesRef.current.set(stateKey, pressed);
      }

      // Get or create the set of stateKeys holding this key/button
      if (!keyHoldersRef.current.has(key)) {
        keyHoldersRef.current.set(key, new Set());
      }
      const holders = keyHoldersRef.current.get(key)!;

      const wasPressed = holders.size > 0;

      if (pressed) {
        // Add this stateKey to the holders set
        holders.add(stateKey);

        // Only press the key/button if it wasn't already pressed by another button
        if (!wasPressed) {
          try {
            let result;
            if (isMouseWheelKey(key)) {
              triggerMappedWheelScroll(key, stateKey);
              result = { success: true };
            } else if (key.startsWith("Mouse")) {
              // Check if it's a mouse button
              if (!window.mouseSimulator) {
                console.warn("Mouse simulator not available");
                return;
              }
              result = await window.mouseSimulator.buttonToggle(key, true);
            } else {
              if (!window.keySimulator) {
                console.warn("Key simulator not available");
                return;
              }
              result = await window.keySimulator.keyToggle(key, true);
            }

            if (result && !result.success && result.error) {
              console.error("Input simulation error:", result.error);
              // If it's a permissions error, log it prominently
              if (result.error.includes("Accessibility permissions")) {
                console.error(
                  "⚠️ Accessibility permissions required! Please grant permissions in System Preferences > Security & Privacy > Privacy > Accessibility"
                );
              }
            }
          } catch (error) {
            console.error("Error pressing key/button:", error);
          }
        }
      } else {
        // Remove this stateKey from the holders set
        holders.delete(stateKey);

        // Only release the key/button if no other buttons are holding it
        if (wasPressed && holders.size === 0) {
          try {
            let result;
            if (isMouseWheelKey(key)) {
              result = { success: true };
            } else if (key.startsWith("Mouse")) {
              // Check if it's a mouse button
              if (!window.mouseSimulator) {
                console.warn("Mouse simulator not available");
                return;
              }
              result = await window.mouseSimulator.buttonToggle(key, false);
            } else {
              if (!window.keySimulator) {
                console.warn("Key simulator not available");
                return;
              }
              result = await window.keySimulator.keyToggle(key, false);
            }

            if (result && !result.success && result.error) {
              console.error("Input simulation error:", result.error);
              if (result.error.includes("Accessibility permissions")) {
                console.error(
                  "⚠️ Accessibility permissions required! Please grant permissions in System Preferences > Security & Privacy > Privacy > Accessibility"
                );
              }
            }
          } catch (error) {
            console.error("Error releasing key/button:", error);
          }
        }
      }
    },
    [triggerMappedWheelScroll]
  );

  // Check and trigger mappings based on gamepad state
  useEffect(() => {
    gamepads.forEach((gamepad) => {
      const mapping = getMapping(gamepad.index);
      if (!mapping) return;

      // Check button mappings
      mapping.buttonMappings.forEach((btnMapping) => {
        const button = gamepad.buttons[btnMapping.buttonIndex];
        if (button) {
          const stateKey = `gamepad-${gamepad.index}-button-${btnMapping.buttonIndex}`;
          if (isMouseWheelKey(btnMapping.key)) {
            if (button.pressed) {
              triggerMappedWheelScroll(btnMapping.key, stateKey);
            }
          } else {
            simulateKeyPress(btnMapping.key, button.pressed, stateKey);
          }
        }
      });

      // Check dpad mappings with combined keys
      if (mapping.dpadMappings && mapping.dpadMappings.length > 0) {
        const currentDirection = getDpadDirection(gamepad.buttons);

        // Check if there's a direct mapping for the current direction
        const hasDirectMapping =
          currentDirection &&
          mapping.dpadMappings.some((m) => m.direction === currentDirection);

        // Process each dpad mapping
        mapping.dpadMappings.forEach((dpadMapping) => {
          const stateKey = `gamepad-${gamepad.index}-dpad-${dpadMapping.direction}`;
          let isActive = false;

          if (currentDirection === dpadMapping.direction) {
            // Direct match
            isActive = true;
          } else if (currentDirection && !hasDirectMapping) {
            // No direct mapping - check if this is a fallback cardinal direction for a diagonal
            const fallbackDirections = getFallbackDirections(currentDirection);
            isActive = fallbackDirections.includes(dpadMapping.direction);
          }

          if (isMouseWheelKey(dpadMapping.key)) {
            if (isActive) {
              triggerMappedWheelScroll(dpadMapping.key, stateKey);
            }
          } else {
            simulateKeyPress(dpadMapping.key, isActive, stateKey);
          }
        });
      }

      // Process axis mappings - handle both hotkey and mouse control modes
      // Check if mouse mode is enabled for each stick
      const mouseMappings = getMouseMappings(mapping);
      const scrollMappings = getScrollMappings(mapping);
      const sticksWithContinuous = new Set([
        ...mouseMappings.map((m) => m.stickIndex),
        ...scrollMappings.map((m) => m.stickIndex),
      ]);
      const processedMouseSticks = new Set<number>();

      // Process mouse mappings first (one per stick)
      mouseMappings.forEach((mouseMapping) => {
        const stickIndex = mouseMapping.stickIndex;
        if (processedMouseSticks.has(stickIndex)) {
          return; // Already processed this stick
        }
        processedMouseSticks.add(stickIndex);

        // Get stick axes based on stick index
        const { axisXIndex, axisYIndex } = getStickAxes(stickIndex);
        let stickX = gamepad.axes[axisXIndex] || 0;
        let stickY = gamepad.axes[axisYIndex] || 0;

        // Apply user invert settings
        if (mouseMapping.invertX) stickX = -stickX;
        if (mouseMapping.invertY) stickY = -stickY;

        // Use flat deadzone threshold for X and Y independently (not relative to magnitude)
        const absX = Math.abs(stickX);
        const absY = Math.abs(stickY);
        const threshold = mouseMapping.threshold;
        const inDeadzone = absX < threshold && absY < threshold;

        const mouseStateKey = `gamepad-${gamepad.index}-mouse-${stickIndex}`;

        if (inDeadzone) {
          // Reset movement start time when stick returns to deadzone
          stickMovementStartTimeRef.current.delete(mouseStateKey);
          return; // In deadzone - don't move mouse
        }

        // Calculate movement with sensitivity and acceleration
        const sensitivity =
          mouseMapping.sensitivity ?? DEFAULT_MOUSE_SENSITIVITY;
        const acceleration =
          mouseMapping.acceleration ?? DEFAULT_MOUSE_ACCELERATION;

        // Track movement start time for time-based acceleration
        const now = Date.now();
        if (!stickMovementStartTimeRef.current.has(mouseStateKey)) {
          stickMovementStartTimeRef.current.set(mouseStateKey, now);
        }
        const movementStartTime =
          stickMovementStartTimeRef.current.get(mouseStateKey)!;
        const movementDurationSeconds = (now - movementStartTime) / 1000;

        // Remove deadzone: subtract threshold from X and Y independently (flat deadzone)
        let normalizedX = 0;
        let normalizedY = 0;

        if (absX >= threshold) {
          const signX = stickX >= 0 ? 1 : -1;
          normalizedX = (signX * (absX - threshold)) / (1 - threshold);
        }

        if (absY >= threshold) {
          const signY = stickY >= 0 ? 1 : -1;
          normalizedY = (signY * (absY - threshold)) / (1 - threshold);
        }

        // Apply time-based acceleration: acceleration = 1 means no acceleration,
        // acceleration = 1.2 means 1.2x speed every second
        let accelerationMultiplier = 1.0;
        if (acceleration !== 1.0 && movementDurationSeconds > 0) {
          // acceleration^time gives us the multiplier
          // e.g., acceleration=1.2, time=1s -> 1.2^1 = 1.2x
          // e.g., acceleration=1.2, time=2s -> 1.2^2 = 1.44x
          accelerationMultiplier = Math.pow(
            acceleration,
            movementDurationSeconds
          );
        }

        // Calculate movement delta
        const deltaX = normalizedX * sensitivity * accelerationMultiplier * 10;
        const deltaY = normalizedY * sensitivity * accelerationMultiplier * 10;

        // Final check: re-read stick state RIGHT BEFORE sending to prevent drift
        // This ensures we never send a movement if stick is already released
        let finalStickX = gamepad.axes[axisXIndex] || 0;
        let finalStickY = gamepad.axes[axisYIndex] || 0;
        if (mouseMapping.invertX) finalStickX = -finalStickX;
        if (mouseMapping.invertY) finalStickY = -finalStickY;

        if (
          Math.abs(finalStickX) < threshold &&
          Math.abs(finalStickY) < threshold
        ) {
          // Reset movement start time when stick returns to deadzone
          stickMovementStartTimeRef.current.delete(mouseStateKey);
          return; // In deadzone now - don't send movement
        }

        // Prevent queuing: only send if no pending movement for this stick
        // Queued IPC calls cause drift because each reads mouse position after previous move
        if (pendingMouseMovementsRef.current.has(mouseStateKey)) {
          return; // Skip this frame - previous movement still pending
        }

        // Send movement - mark as pending to prevent queuing
        if (window.mouseSimulator) {
          pendingMouseMovementsRef.current.add(mouseStateKey);
          window.mouseSimulator
            .moveMouse(deltaX, deltaY)
            .then(() => {
              pendingMouseMovementsRef.current.delete(mouseStateKey);
            })
            .catch((err) => {
              console.error("Error moving mouse:", err);
              pendingMouseMovementsRef.current.delete(mouseStateKey);
            });
        }
      });

      const processedScrollSticks = new Set<number>();

      // Process scroll mappings first (one per stick)
      scrollMappings.forEach((scrollMapping) => {
        const stickIndex = scrollMapping.stickIndex;
        if (processedScrollSticks.has(stickIndex)) {
          return;
        }
        processedScrollSticks.add(stickIndex);

        const { axisXIndex, axisYIndex } = getStickAxes(stickIndex);
        let stickX = gamepad.axes[axisXIndex] || 0;
        let stickY = gamepad.axes[axisYIndex] || 0;

        if (scrollMapping.invertX) stickX = -stickX;
        if (scrollMapping.invertY) stickY = -stickY;

        const absX = Math.abs(stickX);
        const absY = Math.abs(stickY);
        const threshold = scrollMapping.threshold;
        const inDeadzone = absX < threshold && absY < threshold;
        const scrollStateKey = `gamepad-${gamepad.index}-scroll-${stickIndex}`;

        if (inDeadzone) {
          stickMovementStartTimeRef.current.delete(scrollStateKey);
          scrollRemainderRef.current.delete(scrollStateKey);
          lastScrollUpdateTimeRef.current.delete(scrollStateKey);
          return;
        }

        const sensitivity =
          scrollMapping.sensitivity ?? DEFAULT_SCROLL_SENSITIVITY;
        const acceleration =
          scrollMapping.acceleration ?? DEFAULT_SCROLL_ACCELERATION;

        const now = performance.now();
        if (!stickMovementStartTimeRef.current.has(scrollStateKey)) {
          stickMovementStartTimeRef.current.set(scrollStateKey, now);
        }
        const previousUpdateTime =
          lastScrollUpdateTimeRef.current.get(scrollStateKey) ??
          now - 1000 / SCROLL_STEPS_PER_SECOND;
        lastScrollUpdateTimeRef.current.set(scrollStateKey, now);
        const movementStartTime =
          stickMovementStartTimeRef.current.get(scrollStateKey)!;
        const movementDurationSeconds = (now - movementStartTime) / 1000;
        const elapsedSeconds = Math.min(
          Math.max((now - previousUpdateTime) / 1000, 0),
          0.05
        );

        let normalizedX = 0;
        let normalizedY = 0;

        if (absX >= threshold) {
          const signX = stickX >= 0 ? 1 : -1;
          normalizedX = (signX * (absX - threshold)) / (1 - threshold);
        }

        if (absY >= threshold) {
          const signY = stickY >= 0 ? 1 : -1;
          normalizedY = (signY * (absY - threshold)) / (1 - threshold);
        }

        let accelerationMultiplier = 1.0;
        if (acceleration !== 1.0 && movementDurationSeconds > 0) {
          accelerationMultiplier = Math.pow(
            acceleration,
            movementDurationSeconds
          );
        }

        let finalStickX = gamepad.axes[axisXIndex] || 0;
        let finalStickY = gamepad.axes[axisYIndex] || 0;
        if (scrollMapping.invertX) finalStickX = -finalStickX;
        if (scrollMapping.invertY) finalStickY = -finalStickY;

        if (
          Math.abs(finalStickX) < threshold &&
          Math.abs(finalStickY) < threshold
        ) {
          stickMovementStartTimeRef.current.delete(scrollStateKey);
          scrollRemainderRef.current.delete(scrollStateKey);
          lastScrollUpdateTimeRef.current.delete(scrollStateKey);
          return;
        }

        const remainder =
          scrollRemainderRef.current.get(scrollStateKey) ?? { x: 0, y: 0 };
        const nextX =
          remainder.x +
          normalizedX *
            sensitivity *
            accelerationMultiplier *
            elapsedSeconds *
            SCROLL_STEPS_PER_SECOND;
        const nextY =
          remainder.y +
          normalizedY *
            sensitivity *
            accelerationMultiplier *
            elapsedSeconds *
            SCROLL_STEPS_PER_SECOND;
        const stepsX = nextX < 0 ? Math.ceil(nextX) : Math.floor(nextX);
        const stepsY = nextY < 0 ? Math.ceil(nextY) : Math.floor(nextY);

        scrollRemainderRef.current.set(scrollStateKey, {
          x: nextX - stepsX,
          y: nextY - stepsY,
        });

        sendMouseScroll(stepsX, stepsY);
      });

      // Process hotkey mappings (skip if a continuous mode is enabled for that stick)
      // Group by stick index to check for direct mappings efficiently
      const stickMappingsByStick = mapping.axisMappings.reduce(
        (acc, axisMapping) => {
          if (
            axisMapping.type === "hotkey" &&
            !sticksWithContinuous.has(axisMapping.stickIndex)
          ) {
            acc.set(
              axisMapping.stickIndex,
              (acc.get(axisMapping.stickIndex) || []).concat(axisMapping)
            );
          }
          return acc;
        },
        new Map<number, AxisMapping[]>()
      );

      // Process each stick's mappings
      stickMappingsByStick.entries().forEach(([stickIndex, axisMappings]) => {
        const { axisXIndex, axisYIndex } = getStickAxes(stickIndex);
        const stickX = gamepad.axes[axisXIndex] || 0;
        const stickY = gamepad.axes[axisYIndex] || 0;

        // Get all configured directions for this stick (to check if diagonal has direct mapping)
        const configuredDirections = new Set(
          axisMappings.map((m) => m.direction)
        );

        // Process each mapping for this stick
        Promise.all(
          axisMappings.map((axisMapping) => {
            const stateKey = `gamepad-${gamepad.index}-axis-${axisMapping.stickIndex}-${axisMapping.direction}`;
            const detectedDirection = getStickDirection(
              stickX,
              stickY,
              axisMapping.threshold
            );
            let isActive = false;

            if (detectedDirection === axisMapping.direction) {
              // Direct match
              isActive = true;
            } else if (
              detectedDirection &&
              !configuredDirections.has(detectedDirection)
              
            ) {
              // No direct mapping configured for detected direction - check if this is a fallback cardinal direction for a diagonal
              const fallbackDirections =
                getFallbackDirections(detectedDirection);
              isActive = fallbackDirections.includes(axisMapping.direction);
            }

            if (isMouseWheelKey(axisMapping.key)) {
              if (isActive) {
                triggerMappedWheelScroll(axisMapping.key, stateKey);
              }
              return Promise.resolve();
            }

            return simulateKeyPress(axisMapping.key, isActive, stateKey);
          })
        );
      });
    });
  }, [
    gamepads,
    getMapping,
    getMouseMappings,
    getScrollMappings,
    sendMouseScroll,
    simulateKeyPress,
    triggerMappedWheelScroll,
  ]);

  return {
    mappings,
    getMapping,
    setButtonMapping,
    setAxisMapping,
    setDpadMapping,
    removeButtonMapping,
    removeAxisMapping,
    removeDpadMapping,
    editingButton,
    setEditingButton,
    editingAxis,
    setEditingAxis,
    editingDpad,
    setEditingDpad,
  };
}

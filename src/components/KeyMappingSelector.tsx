import { useEffect, useRef } from 'react'
import './MappingPanel.css'

interface KeyMappingSelectorProps {
  currentMapping: { key: string; label: string } | null
  isEditing: boolean
  pendingKey: { key: string; label: string } | null
  onKeyPress: (key: string, label: string) => void
  onRemove?: () => void
  showRemove?: boolean
}

export function KeyMappingSelector({
  currentMapping,
  isEditing,
  pendingKey,
  onKeyPress,
  onRemove,
  showRemove = false,
}: KeyMappingSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle key press and mouse button clicks
  useEffect(() => {

    const sortComboKeys = (keys: string[]): string[] => {
      const modifierPriority: Record<string, number> = {
        Ctrl: 1,
        Alt: 2,
        Shift: 3,
        Meta: 4,
      };
      return keys.sort((a, b) => {
        const aPriority = modifierPriority[a] || 100;
        const bPriority = modifierPriority[b] || 100;
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        return a.localeCompare(b);
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        e.preventDefault()

        const arr = [];
        let ekey = e.key === ' ' ? 'Space' : e.key
        arr.push(ekey);
        if (e.key !== "Alt" && e.altKey) arr.push("Alt");
        if (e.key !== "Shift" && e.shiftKey) arr.push("Shift");
        if (e.key !== "Meta" && e.metaKey) arr.push("Meta");
        if (e.key !== "Ctrl" && e.ctrlKey) arr.push("Ctrl");

        const key = sortComboKeys(arr).join("+");

        onKeyPress(key, key.toUpperCase());
      }
    }

    const getCurrentMappingItem = () =>
      containerRef.current?.closest('.button-mapping-item')

    const isEventInsideCurrentMappingItem = (target: EventTarget | null) => {
      const mappingItem = getCurrentMappingItem()
      return !!(mappingItem && target instanceof HTMLElement && mappingItem.contains(target))
    }

    const isInteractiveElement = (target: HTMLElement) => (
      target.tagName === 'BUTTON' ||
      target.closest('button') !== null ||
      target.tagName === 'A' ||
      target.closest('a') !== null ||
      target.closest('.btn-map') !== null ||
      target.closest('.btn-revert') !== null ||
      target.closest('.btn-remove') !== null ||
      target.closest('.btn-remove-small') !== null ||
      target.closest('.btn-edit') !== null
    )

    const handleMouseDown = (e: MouseEvent) => {
      if (isEditing && containerRef.current) {
        const target = e.target as HTMLElement
        if (!isEventInsideCurrentMappingItem(target)) {
          return
        }

        // Ignore clicks on interactive elements (buttons, links, etc.)
        if (isInteractiveElement(target)) {
          return // Don't capture clicks on buttons/links
        }

        e.preventDefault()
        e.stopPropagation()
        let key: string
        let label: string

        if (e.button === 0) {
          key = 'MouseLeft'
          label = 'Left Mouse'
        } else if (e.button === 1) {
          key = 'MouseMiddle'
          label = 'Middle Mouse'
        } else if (e.button === 2) {
          key = 'MouseRight'
          label = 'Right Mouse'
        } else {
          return // Unknown button
        }

        onKeyPress(key, label)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isEditing || !containerRef.current) {
        return
      }

      const target = e.target as HTMLElement
      if (!isEventInsideCurrentMappingItem(target) || isInteractiveElement(target)) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      let key: string
      let label: string
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > 0) {
          key = 'MouseWheelRight'
          label = 'Wheel Right'
        } else {
          key = 'MouseWheelLeft'
          label = 'Wheel Left'
        }
      } else if (e.deltaY > 0) {
        key = 'MouseWheelDown'
        label = 'Wheel Down'
      } else if (e.deltaY < 0) {
        key = 'MouseWheelUp'
        label = 'Wheel Up'
      } else {
        return
      }

      onKeyPress(key, label)
    }

    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('mousedown', handleMouseDown, true) // Use capture phase
      window.addEventListener('wheel', handleWheel, { capture: true, passive: false })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('wheel', handleWheel, true)
    }
  }, [isEditing, onKeyPress])

  const displayKey = pendingKey || currentMapping

  return (
    <div ref={containerRef} className="direction-mapping">
      {displayKey ? (
        <>
          <span className="mapped-key">
            {displayKey.label}
          </span>
          {pendingKey && (
            <span style={{ fontSize: '0.75em', color: '#888', marginLeft: '4px' }}>(unsaved)</span>
          )}
          {showRemove && onRemove && (
            <button
              className="btn-remove-small"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              title="Remove mapping"
            >
              ×
            </button>
          )}
        </>
      ) : (
        <div className="direction-mapping unmapped">Not mapped</div>
      )}
    </div>
  )
}

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

    const handleMouseDown = (e: MouseEvent) => {
      if (isEditing && containerRef.current) {
        // Only handle clicks within the current ButtonMappingPanel
        const buttonMappingPanel = containerRef.current.closest('.button-mapping-item')
        if (!buttonMappingPanel) {
          return
        }

        const target = e.target as HTMLElement
        // Validate click is within the current ButtonMappingPanel
        if (!buttonMappingPanel.contains(target)) {
          return
        }

        // Ignore clicks on interactive elements (buttons, links, etc.)
        if (
          target.tagName === 'BUTTON' ||
          target.closest('button') !== null ||
          target.tagName === 'A' ||
          target.closest('a') !== null ||
          target.closest('.btn-map') !== null ||
          target.closest('.btn-revert') !== null ||
          target.closest('.btn-remove') !== null ||
          target.closest('.btn-remove-small') !== null ||
          target.closest('.btn-edit') !== null
        ) {
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

    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('mousedown', handleMouseDown, true) // Use capture phase
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown, true)
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


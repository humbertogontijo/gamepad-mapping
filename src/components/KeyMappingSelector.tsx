import { useEffect } from 'react'
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
  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        e.preventDefault()
        const key = e.key === ' ' ? 'Space' : e.key
        const label = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key
        onKeyPress(key, label)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, onKeyPress])

  const displayKey = pendingKey || currentMapping

  return (
    <div className="direction-mapping">
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


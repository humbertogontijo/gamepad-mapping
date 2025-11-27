import UpdateElectron from "@/components/update";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  ControllerVisualization,
  SelectedControl,
} from "./components/ControllerVisualization";
import { DeviceList } from "./components/DeviceList";
import { MappingPanel } from "./components/MappingPanel";
import { useGamepad } from "./hooks/useGamepad";
import { useGamepadMapping } from "./hooks/useGamepadMapping";

function App() {
  const gamepads = useGamepad();
  const {
    getMapping,
    setButtonMapping,
    setAxisMapping,
    removeButtonMapping,
    removeAxisMapping,
    editingButton,
    setEditingButton,
    editingAxis,
    setEditingAxis,
  } = useGamepadMapping(gamepads);

  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState<
    number | null
  >(null);
  const [selectedControl, setSelectedControl] = useState<SelectedControl>(null);

  // Automatically select the first gamepad if available
  useEffect(() => {
    if (gamepads.length > 0 && selectedGamepadIndex === null) {
      setSelectedGamepadIndex(gamepads[0].index);
    } else if (gamepads.length === 0) {
      setSelectedGamepadIndex(null);
      setSelectedControl(null);
    }
  }, [gamepads, selectedGamepadIndex]);

  const selectedGamepad = gamepads.find(
    (g) => g.index === selectedGamepadIndex
  );
  const selectedMapping = selectedGamepad
    ? getMapping(selectedGamepad.index)
    : undefined;

  const handleControlSelect = useCallback(
    (control: SelectedControl) => {
      setSelectedControl(control);
      setEditingButton(null);
      setEditingAxis(null);
    },
    [setEditingButton, setEditingAxis]
  );

  const handleSelectGamepad = (index: number) => {
    setSelectedGamepadIndex(index);
    setSelectedControl(null);
  };

  return (
    <div className="app">
      {gamepads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <h1>No Gamepad Detected</h1>
          <p>Connect a controller and press any button to activate it.</p>
        </div>
      ) : (
        <div className="app-container">
          <DeviceList
            gamepads={gamepads}
            selectedGamepadIndex={selectedGamepadIndex}
            onSelectGamepad={handleSelectGamepad}
          />

          <main className="visualization-panel">
            {selectedGamepad && (
              <>
                <div className="panel-header">
                  <h2>
                    {selectedGamepad.id.split("(")[0].trim() ||
                      `Gamepad ${selectedGamepad.index + 1}`}
                  </h2>
                  <p className="panel-subtitle">{selectedGamepad.id}</p>
                </div>
                <div className="visualization-content">
                  <ControllerVisualization
                    gamepad={selectedGamepad}
                    mapping={selectedMapping}
                    selectedControl={selectedControl}
                    onControlSelect={handleControlSelect}
                  />
                </div>
              </>
            )}
          </main>

          <aside className="mapping-panel">
            <div className="panel-header">
              <h2>Mapping</h2>
            </div>
            <div className="mapping-content">
              {selectedGamepad ? (
                <MappingPanel
                  gamepad={selectedGamepad}
                  mapping={selectedMapping}
                  selectedControl={selectedControl}
                  onSetButtonMapping={(buttonIndex, key, label) =>
                    setButtonMapping(
                      selectedGamepad.index,
                      buttonIndex,
                      key,
                      label
                    )
                  }
                  onSetAxisMapping={(
                    stickIndex,
                    direction,
                    key,
                    label,
                    threshold,
                    type,
                    sensitivity,
                    acceleration,
                    invertX,
                    invertY
                  ) =>
                    setAxisMapping(
                      selectedGamepad.index,
                      stickIndex,
                      direction,
                      key,
                      label,
                      threshold,
                      type,
                      sensitivity,
                      acceleration,
                      invertX,
                      invertY
                    )
                  }
                  onRemoveButtonMapping={(buttonIndex) =>
                    removeButtonMapping(selectedGamepad.index, buttonIndex)
                  }
                  onRemoveAxisMapping={(stickIndex, direction) =>
                    removeAxisMapping(
                      selectedGamepad.index,
                      stickIndex,
                      direction
                    )
                  }
                  editingButton={editingButton}
                  editingAxis={editingAxis}
                  onSetEditingButton={setEditingButton}
                  onSetEditingAxis={setEditingAxis}
                  onSelectControl={handleControlSelect}
                />
              ) : (
                <div className="no-selection">
                  <div className="no-selection-icon">👆</div>
                  <p>
                    Click on a button or stick direction in the controller to
                    map it
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
      <UpdateElectron />
    </div>
  );
}

export default App;

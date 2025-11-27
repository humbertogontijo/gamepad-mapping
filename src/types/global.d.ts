export interface KeySimulator {
  keyToggle: (key: string, down: boolean) => Promise<{ success: boolean; error?: string }>
}

export interface MouseSimulator {
  moveMouse: (deltaX: number, deltaY: number) => Promise<{ success: boolean; error?: string }>
}

export interface IpcRenderer {
  on(channel: string, listener: (event: any, ...args: any[]) => void): void
  off(channel: string, listener: (...args: any[]) => void): void
  send(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

declare global {
  interface Window {
    keySimulator: KeySimulator
    mouseSimulator?: MouseSimulator
    ipcRenderer?: IpcRenderer
  }
}


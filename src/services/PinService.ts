// src/services/PinService.ts
import * as vscode from 'vscode';
import { Pin, PinStorage, PinEvent } from '../types/Pin';

export class PinService {
  private pins: Map<string, Pin> = new Map();
  private lastId: number = 0;
  private onPinChangeEmitter = new vscode.EventEmitter<PinEvent>();
  public onPinChange = this.onPinChangeEmitter.event;

  constructor(private context: vscode.ExtensionContext) {
    this.loadPins();
  }

  /**
   * Cargar pins desde el almacenamiento persistente
   */
  private loadPins(): void {
    const storage = this.context.workspaceState.get<PinStorage>('pinpoint.storage', {
      pins: [],
      lastId: 0,
    });

    this.lastId = storage.lastId;
    storage.pins.forEach((pin) => {
      pin.createdAt = new Date(pin.createdAt);
      this.pins.set(pin.id, pin);
    });
  }

  /**
   * Guardar pins en almacenamiento persistente
   */
  private savePins(): void {
    const storage: PinStorage = {
      pins: Array.from(this.pins.values()),
      lastId: this.lastId,
    };
    this.context.workspaceState.update('pinpoint.storage', storage);
  }

  /**
   * Agregar un nuevo pin
   */
  addPin(file: string, line: number, description: string = ''): Pin {
    this.lastId++;
    const pin: Pin = {
      id: `pin-${this.lastId}`,
      file,
      line,
      description,
      createdAt: new Date(),
    };

    this.pins.set(pin.id, pin);
    this.savePins();
    this.onPinChangeEmitter.fire('added');

    return pin;
  }

  /**
   * Eliminar un pin por ID
   */
  removePin(id: string): boolean {
    const removed = this.pins.delete(id);
    if (removed) {
      this.savePins();
      this.onPinChangeEmitter.fire('removed');
    }
    return removed;
  }

  /**
   * Obtener todos los pins
   */
  getPins(): Pin[] {
    return Array.from(this.pins.values()).sort((a, b) => {
      if (a.file !== b.file) {
        return a.file.localeCompare(b.file);
      }
      return a.line - b.line;
    });
  }

  /**
   * Obtener pins por archivo
   */
  getPinsByFile(file: string): Pin[] {
    return this.getPins().filter((pin) => pin.file === file);
  }

  /**
   * Obtener un pin específico
   */
  getPin(id: string): Pin | undefined {
    return this.pins.get(id);
  }

  /**
   * Verificar si existe un pin en una línea específica
   */
  getPinAtLine(file: string, line: number): Pin | undefined {
    return this.getPinsByFile(file).find((pin) => pin.line === line);
  }

  /**
   * Actualizar descripción de un pin
   */
  updatePin(id: string, description: string): boolean {
    const pin = this.pins.get(id);
    if (pin) {
      pin.description = description;
      this.savePins();
      this.onPinChangeEmitter.fire('updated');
      return true;
    }
    return false;
  }

  /**
   * Eliminar todos los pins
   */
  clearAllPins(): void {
    this.pins.clear();
    this.savePins();
    this.onPinChangeEmitter.fire('cleared');
  }

  /**
   * Obtener el pin más cercano arriba de una línea
   */
  getNearestPinAbove(currentFile: string, currentLine: number): Pin | undefined {
    const pins = this.getPins();
    const sameFilePins = pins
      .filter((pin) => pin.file === currentFile && pin.line < currentLine)
      .sort((a, b) => b.line - a.line);

    if (sameFilePins.length > 0) {
      return sameFilePins[0];
    }

    const otherFilePins = pins
      .filter((pin) => pin.file !== currentFile)
      .sort((a, b) => b.line - a.line);

    if (otherFilePins.length > 0) {
      return otherFilePins[0];
    }

    return undefined;
  }

  /**
   * Obtener el siguiente pin desde una línea
   */
  getNextPin(currentFile: string, currentLine: number): Pin | undefined {
    const pins = this.getPins();
    
    // Primero, buscar en el mismo archivo después de la línea actual
    const sameFilePins = pins.filter(
      (pin) => pin.file === currentFile && pin.line > currentLine
    );
    
    if (sameFilePins.length > 0) {
      return sameFilePins[0];
    }

    // Si no hay, buscar en otros archivos
    const otherFilePins = pins.filter((pin) => pin.file !== currentFile);
    if (otherFilePins.length > 0) {
      return otherFilePins[0];
    }

    // Si no hay nada, ir al primero del mismo archivo
    const firstInFile = pins.find((pin) => pin.file === currentFile);
    if (firstInFile) {
      return firstInFile;
    }

    return pins[0];
  }

  /**
   * Obtener el pin anterior desde una línea
   */
  getPreviousPin(currentFile: string, currentLine: number): Pin | undefined {
    const pins = this.getPins().reverse();
    
    // Primero, buscar en el mismo archivo antes de la línea actual
    const sameFilePins = pins.filter(
      (pin) => pin.file === currentFile && pin.line < currentLine
    );
    
    if (sameFilePins.length > 0) {
      return sameFilePins[0];
    }

    // Si no hay, buscar en otros archivos
    const otherFilePins = pins.filter((pin) => pin.file !== currentFile);
    if (otherFilePins.length > 0) {
      return otherFilePins[0];
    }

    // Si no hay nada, ir al último del mismo archivo
    const lastInFile = pins.find((pin) => pin.file === currentFile);
    if (lastInFile) {
      return lastInFile;
    }

    return pins[0];
  }

  dispose(): void {
    this.onPinChangeEmitter.dispose();
  }
}

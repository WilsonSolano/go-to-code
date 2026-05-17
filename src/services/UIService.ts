// src/services/UIService.ts
import * as vscode from 'vscode';
import { Pin } from '../types/Pin';

export interface PinQuickPickItem extends vscode.QuickPickItem {
  pin: Pin;
}

export class UIService {
  /**
   * Mostrar cuadro de diálogo para editar descripción de un pin existente
   */
  async getDescriptionInput(currentDescription?: string): Promise<string | undefined> {
    const description = await vscode.window.showInputBox({
      placeHolder: 'Descripción del pin (opcional)',
      prompt: '📌 Editar descripción:',
      value: currentDescription || '',
      ignoreFocusOut: true,
    });
    return description;
  }

  /**
   * Mostrar cuadro para pedir descripción al crear pin
   */
  async askForDescription(): Promise<string> {
    const description = await vscode.window.showInputBox({
      placeHolder: 'Descripción (opcional)',
      prompt: '📌 Agregar descripción al pin (Enter para saltar)',
      ignoreFocusOut: true,
    });
    return description || '';
  }

  /**
   * Mostrar notificación con opción de agregar descripción después de crear
   */
  async promptAddDescription(): Promise<string | undefined> {
    const action = await vscode.window.showInformationMessage(
      '✅ Pin agregado',
      'Agregar descripción'
    );
    if (action === 'Agregar descripción') {
      return await vscode.window.showInputBox({
        placeHolder: 'Descripción del pin',
        prompt: '📌 Agregar descripción:',
        ignoreFocusOut: true,
      });
    }
    return undefined;
  }

  /**
   * Mostrar lista rápida de pins
   */
  async showPinsList(pins: Pin[]): Promise<Pin | undefined> {
    if (pins.length === 0) {
      vscode.window.showInformationMessage('📌 No hay pins agregados');
      return undefined;
    }

    const items: PinQuickPickItem[] = this.organizePinsByFile(pins).map(
      (pin) => ({
        label: `📌 ${pin.description || 'Sin descripción'}`,
        description: `${this.getRelativePath(pin.file)}:${pin.line + 1}`,
        detail: `Creado: ${this.formatDate(pin.createdAt)}`,
        pin,
      })
    );

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Selecciona un pin para ir a él',
      ignoreFocusOut: true,
    });

    return selected?.pin;
  }

  /**
   * Mostrar cuadro de confirmación
   */
  async showConfirmation(message: string): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      'Sí',
      'No'
    );
    return result === 'Sí';
  }

  /**
   * Mostrar notificación de éxito
   */
  showSuccess(message: string): void {
    vscode.window.showInformationMessage(`✅ ${message}`);
  }

  /**
   * Mostrar error
   */
  showError(message: string): void {
    vscode.window.showErrorMessage(`❌ ${message}`);
  }

  /**
   * Mostrar advertencia
   */
  showWarning(message: string): void {
    vscode.window.showWarningMessage(`⚠️ ${message}`);
  }

  /**
   * Organizar pins por archivo
   */
  private organizePinsByFile(pins: Pin[]): Pin[] {
    return pins.sort((a, b) => {
      if (a.file !== b.file) {
        return a.file.localeCompare(b.file);
      }
      return a.line - b.line;
    });
  }

  /**
   * Obtener ruta relativa del workspace
   */
  private getRelativePath(filePath: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return filePath;
    }

    const folder = workspaceFolders[0];
    if (filePath.startsWith(folder.uri.fsPath)) {
      return filePath.substring(folder.uri.fsPath.length + 1);
    }

    return filePath;
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) { return 'Hace poco'; }
    if (diffMins < 60) { return `Hace ${diffMins}m`; }
    if (diffHours < 24) { return `Hace ${diffHours}h`; }
    if (diffDays < 7) { return `Hace ${diffDays}d`; }

    return new Date(date).toLocaleDateString();
  }
}

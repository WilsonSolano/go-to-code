// src/controllers/CommandController.ts
import * as vscode from 'vscode';
import { PinService } from '../services/PinService';
import { DecorationService } from '../services/DecorationService';
import { UIService } from '../services/UIService';

export class CommandController {
  constructor(
    private pinService: PinService,
    private decorationService: DecorationService,
    private uiService: UIService,
    private context: vscode.ExtensionContext
  ) {
    this.registerCommands();
  }

  private registerCommands(): void {
    this.registerAddPin();
    this.registerRemovePin();
    this.registerNextPin();
    this.registerPreviousPin();
    this.registerShowPinList();
    this.registerClearAllPins();
  }

  /**
   * Comando: Agregar pin
   */
  private registerAddPin(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.addPin',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const file = editor.document.uri.fsPath;
        const line = editor.selection.active.line;

        // Verificar si ya existe un pin en esta línea
        const existingPin = this.pinService.getPinAtLine(file, line);
        if (existingPin) {
          this.uiService.showWarning('Ya existe un pin en esta línea');
          return;
        }

        // Solicitar descripción
        const description = await this.uiService.getDescriptionInput();

        // Agregar pin
        this.pinService.addPin(file, line, description);
        this.uiService.showSuccess(
          `Pin agregado en línea ${line + 1}`
        );

        // Actualizar decoraciones
        this.updateAllDecorations();
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Comando: Eliminar pin
   */
  private registerRemovePin(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.removePin',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const file = editor.document.uri.fsPath;
        const line = editor.selection.active.line;

        const pin = this.pinService.getPinAtLine(file, line);
        if (!pin) {
          this.uiService.showWarning('No hay pin en esta línea');
          return;
        }

        const confirmed = await this.uiService.showConfirmation(
          `¿Eliminar el pin: "${pin.description || 'Sin descripción'}"?`
        );

        if (confirmed) {
          this.pinService.removePin(pin.id);
          this.uiService.showSuccess('Pin eliminado');
          this.updateAllDecorations();
        }
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Comando: Ir al siguiente pin
   */
  private registerNextPin(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.nextPin',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const file = editor.document.uri.fsPath;
        const line = editor.selection.active.line;

        const nextPin = this.pinService.getNextPin(file, line);
        if (!nextPin) {
          this.uiService.showWarning('No hay más pins');
          return;
        }

        await this.navigateToPin(nextPin);
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Comando: Ir al pin anterior
   */
  private registerPreviousPin(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.previousPin',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const file = editor.document.uri.fsPath;
        const line = editor.selection.active.line;

        const prevPin = this.pinService.getPreviousPin(file, line);
        if (!prevPin) {
          this.uiService.showWarning('No hay pins anteriores');
          return;
        }

        await this.navigateToPin(prevPin);
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Comando: Mostrar lista de pins
   */
  private registerShowPinList(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.showPinList',
      async () => {
        const pins = this.pinService.getPins();
        const selected = await this.uiService.showPinsList(pins);

        if (selected) {
          await this.navigateToPin(selected);
        }
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Comando: Eliminar todos los pins
   */
  private registerClearAllPins(): void {
    const command = vscode.commands.registerCommand(
      'pinpoint.clearAllPins',
      async () => {
        const pins = this.pinService.getPins();
        if (pins.length === 0) {
          this.uiService.showWarning('No hay pins para eliminar');
          return;
        }

        const confirmed = await this.uiService.showConfirmation(
          `¿Eliminar todos los ${pins.length} pins?`
        );

        if (confirmed) {
          this.pinService.clearAllPins();
          this.uiService.showSuccess('Todos los pins han sido eliminados');
          this.updateAllDecorations();
        }
      }
    );

    this.context.subscriptions.push(command);
  }

  /**
   * Navegar a un pin específico
   */
  private async navigateToPin(pin: any): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(pin.file);
      const editor = await vscode.window.showTextDocument(document);

      const line = Math.min(pin.line, document.lineCount - 1);
      const range = new vscode.Range(line, 0, line, 0);

      editor.selection = new vscode.Selection(range.start, range.start);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      this.uiService.showError(`No se pudo abrir el archivo: ${pin.file}`);
    }
  }

  /**
   * Actualizar decoraciones en todos los editores
   */
  private updateAllDecorations(): void {
    const pins = this.pinService.getPins();

    vscode.window.visibleTextEditors.forEach((editor) => {
      this.decorationService.updateDecorations(editor, pins);
    });
  }

  public dispose(): void {
    // Los comandos se limpian automáticamente
  }
}

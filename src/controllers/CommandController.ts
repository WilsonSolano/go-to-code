import * as vscode from 'vscode';
import { Pin } from '../types/Pin';
import { PinService } from '../services/PinService';
import { DecorationService } from '../services/DecorationService';
import { UIService } from '../services/UIService';
import { PinTreeDataProvider, PinItem } from '../services/PinTreeDataProvider';
import { PinCodeLensProvider } from '../services/PinCodeLensProvider';

export class CommandController {
  private statusBarItem: vscode.StatusBarItem;
  private lastStickyPin: Pin | undefined;

  constructor(
    private pinService: PinService,
    private decorationService: DecorationService,
    private uiService: UIService,
    private context: vscode.ExtensionContext,
    private treeDataProvider: PinTreeDataProvider,
    private codeLensProvider: PinCodeLensProvider
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.context.subscriptions.push(this.statusBarItem);
    this.registerCommands();
    this.startStickyPinTracking();
  }

  private registerCommands(): void {
    this.registerAddPin();
    this.registerRemovePin();
    this.registerNextPin();
    this.registerPreviousPin();
    this.registerShowPinList();
    this.registerShowFilePins();
    this.registerClearAllPins();
    this.registerEditPinDescription();
    this.registerNavigateToPin();
    this.registerJumpToNearestPinAbove();
  }

  private registerAddPin(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.addPin',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const file = editor.document.uri.fsPath;
        const line = editor.selection.active.line;

        const existingPin = this.pinService.getPinAtLine(file, line);
        if (existingPin) {
          this.uiService.showWarning('Ya existe un pin en esta línea');
          return;
        }

        const pin = this.pinService.addPin(file, line);
        this.refreshViews();

        const description = await this.uiService.promptAddDescription();
        if (description !== undefined && description.trim()) {
          this.pinService.updatePin(pin.id, description.trim());
          this.refreshViews();
        }

        this.updateAllDecorations();
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerRemovePin(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.removePin',
      async (item?: PinItem) => {
        if (item?.pin) {
          this.pinService.removePin(item.pin.id);
          this.uiService.showSuccess('Pin eliminado');
          this.refreshViews();
          this.updateAllDecorations();
          return;
        }

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

        this.pinService.removePin(pin.id);
        this.uiService.showSuccess('Pin eliminado');
        this.refreshViews();
        this.updateAllDecorations();
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerNextPin(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.nextPin',
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

  private registerPreviousPin(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.previousPin',
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

  private registerShowPinList(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.showPinList',
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

  private registerShowFilePins(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.showFilePins',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }
        
        const filePath = editor.document.uri.fsPath;
        const pins = this.pinService.getPinsByFile(filePath);
        
        if (pins.length === 0) {
          this.uiService.showWarning('No hay pins en este archivo');
          return;
        }

        const selected = await this.uiService.showPinsList(pins);

        if (selected) {
          await this.navigateToPin(selected);
        }
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerClearAllPins(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.clearAllPins',
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
          this.refreshViews();
          this.updateAllDecorations();
        }
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerEditPinDescription(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.editPinDescription',
      async (item?: PinItem) => {
        let pin: Pin | undefined;

        if (item?.pin) {
          pin = item.pin;
        } else {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            this.uiService.showError('No hay editor activo');
            return;
          }
          pin = this.pinService.getPinAtLine(
            editor.document.uri.fsPath,
            editor.selection.active.line
          );
        }

        if (!pin) {
          this.uiService.showWarning('No se encontró el pin');
          return;
        }

        const description = await this.uiService.getDescriptionInput(pin.description);
        if (description !== undefined) {
          this.pinService.updatePin(pin.id, description);
          this.uiService.showSuccess('Descripción actualizada');
          this.refreshViews();
        }
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerNavigateToPin(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.navigateToPin',
      async (pin: Pin) => {
        if (pin) {
          await this.navigateToPin(pin);
        }
      }
    );
    this.context.subscriptions.push(command);
  }

  private registerJumpToNearestPinAbove(): void {
    const command = vscode.commands.registerCommand(
      'go-to-code.jumpToNearestPinAbove',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          this.uiService.showError('No hay editor activo');
          return;
        }

        const firstVisibleLine = editor.visibleRanges[0].start.line;
        const pin = this.pinService.getNearestPinAbove(
          editor.document.uri.fsPath,
          firstVisibleLine
        );

        if (pin) {
          await this.navigateToPin(pin);
        } else {
          this.uiService.showWarning('No hay pins arriba');
        }
      }
    );
    this.context.subscriptions.push(command);
  }

  private startStickyPinTracking(): void {
    const scrollDisposable = vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      const editor = event.textEditor;
      if (editor === vscode.window.activeTextEditor) {
        this.updateStickyPin(editor);
      }
    });
    this.context.subscriptions.push(scrollDisposable);

    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.updateStickyPin(editor);
      } else {
        this.statusBarItem.hide();
      }
    });
    this.context.subscriptions.push(activeEditorDisposable);

    if (vscode.window.activeTextEditor) {
      this.updateStickyPin(vscode.window.activeTextEditor);
    }
  }

  private updateStickyPin(editor: vscode.TextEditor): void {
    const visibleRanges = editor.visibleRanges;
    if (visibleRanges.length === 0) {
      this.statusBarItem.hide();
      this.decorationService.clearStickyPin(editor);
      return;
    }

    const firstVisibleLine = visibleRanges[0].start.line;
    const filePath = editor.document.uri.fsPath;

    const pin = this.pinService.getNearestPinInFile(filePath, firstVisibleLine);

    if (pin) {
      this.lastStickyPin = pin;
      const label = pin.description || `Línea ${pin.line + 1}`;
      const arrow = pin.line <= firstVisibleLine ? '↑' : '↓';
      this.statusBarItem.text = `$(bookmark) ${arrow} ${label}`;
      this.statusBarItem.tooltip = `Ir al pin: ${pin.file}:${pin.line + 1}`;
      this.statusBarItem.command = {
        title: 'Ir al pin',
        command: 'go-to-code.navigateToPin',
        arguments: [pin],
      };
      this.statusBarItem.show();
    } else {
      this.lastStickyPin = undefined;
      this.statusBarItem.hide();
      this.decorationService.clearStickyPin(editor);
    }
  }

  private async navigateToPin(pin: Pin): Promise<void> {
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

  private updateAllDecorations(): void {
    const pins = this.pinService.getPins();
    vscode.window.visibleTextEditors.forEach((editor) => {
      this.decorationService.updateDecorations(editor, pins);
    });
  }

  private refreshViews(): void {
    const pins = this.pinService.getPins();
    this.treeDataProvider.refresh(pins);
    this.codeLensProvider.refresh(pins);

    if (vscode.window.activeTextEditor) {
      this.updateStickyPin(vscode.window.activeTextEditor);
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

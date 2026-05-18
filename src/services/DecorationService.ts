// src/services/DecorationService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { Pin } from '../types/Pin';

export class DecorationService {
  private decorationType: vscode.TextEditorDecorationType;
  private stickyDecorationType: vscode.TextEditorDecorationType;
  private decorations: Map<string, vscode.Range[]> = new Map();

  constructor() {
    const iconPath = vscode.Uri.file(
      path.join(__dirname, '../../resources/pin.svg')
    );

    this.decorationType =
      vscode.window.createTextEditorDecorationType({
        gutterIconPath: iconPath,
        gutterIconSize: 'contain',
        overviewRulerColor: new vscode.ThemeColor(
          'go-to-code.decorationColor'
        ),
        overviewRulerLane: vscode.OverviewRulerLane.Right
      });

    this.stickyDecorationType =
      vscode.window.createTextEditorDecorationType({});
  }

  /**
   * Aplicar decoraciones a un editor
   */
  updateDecorations(
    editor: vscode.TextEditor,
    pins: Pin[]
  ): void {
    const filePath = editor.document.uri.fsPath;

    const filePins = pins.filter(
      (pin) => pin.file === filePath
    );

    const ranges: vscode.Range[] = [];

    filePins.forEach((pin) => {
      if (pin.line < editor.document.lineCount) {
        const line = editor.document.lineAt(pin.line);

        ranges.push(
          new vscode.Range(
            line.range.start,
            line.range.end
          )
        );
      }
    });

    editor.setDecorations(
      this.decorationType,
      ranges
    );

    this.decorations.set(filePath, ranges);
  }

  /**
   * Limpiar decoraciones de un editor
   */
  clearDecorations(
    editor: vscode.TextEditor
  ): void {
    editor.setDecorations(
      this.decorationType,
      []
    );

    this.decorations.delete(
      editor.document.uri.fsPath
    );
  }

  // Funcionalidad de sticky pin removida según requerimiento

  /**
   * Limpiar la decoración sticky (Mantenido para compatibilidad temporal si es llamado)
   */
  clearStickyPin(editor: vscode.TextEditor): void {
  }

  /**
   * Limpiar todas las decoraciones
   */
  clearAllDecorations(): void {
    this.decorations.clear();
  }

  dispose(): void {
    this.decorationType.dispose();
    this.stickyDecorationType.dispose();
  }
}
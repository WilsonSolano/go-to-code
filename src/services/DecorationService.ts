// src/services/DecorationService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { Pin } from '../types/Pin';

export class DecorationService {
  private decorationType: vscode.TextEditorDecorationType;
  private decorations: Map<string, vscode.Range[]> = new Map();

  constructor() {
    // Ruta al ícono del pin
    const iconPath = vscode.Uri.file(
      path.join(__dirname, '../../resources/pin.svg')
    );

    this.decorationType =
      vscode.window.createTextEditorDecorationType({
        gutterIconPath: iconPath,
        gutterIconSize: 'contain',

        borderRadius: '3px',
        overviewRulerColor: new vscode.ThemeColor(
          'pinpoint.decorationColor'
        ),
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        backgroundColor: new vscode.ThemeColor(
          'pinpoint.decorationColor'
        ),

        isWholeLine: false,

        light: {
          backgroundColor: '#FFA50044',
          borderColor: '#FFA500',
          borderStyle: 'solid',
          borderWidth: '1px',
        },

        dark: {
          backgroundColor: '#FFD70044',
          borderColor: '#FFD700',
          borderStyle: 'solid',
          borderWidth: '1px',
        },
      });
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

  /**
   * Limpiar todas las decoraciones
   */
  clearAllDecorations(): void {
    this.decorations.clear();
  }

  dispose(): void {
    this.decorationType.dispose();
  }
}
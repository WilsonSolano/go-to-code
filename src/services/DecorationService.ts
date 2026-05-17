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

    this.stickyDecorationType =
      vscode.window.createTextEditorDecorationType({
        gutterIconPath: iconPath,
        gutterIconSize: 'contain',
        isWholeLine: true,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: new vscode.ThemeColor(
          'pinpoint.decorationColor'
        ),
        borderStyle: 'solid',
        borderWidth: '0 0 1px 0',
        light: {
          backgroundColor: 'rgba(255, 165, 0, 0.12)',
        },
        dark: {
          backgroundColor: 'rgba(255, 215, 0, 0.12)',
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
   * Actualizar la decoración sticky del pin más cercano arriba del viewport
   */
  updateStickyPin(
    editor: vscode.TextEditor,
    pin: Pin | undefined,
    firstVisibleLine: number
  ): void {
    if (pin && firstVisibleLine > 0 && firstVisibleLine < editor.document.lineCount) {
      const line = editor.document.lineAt(firstVisibleLine);
      const range = new vscode.Range(line.range.start, line.range.end);
      editor.setDecorations(this.stickyDecorationType, [range]);
    } else {
      editor.setDecorations(this.stickyDecorationType, []);
    }
  }

  /**
   * Limpiar la decoración sticky
   */
  clearStickyPin(editor: vscode.TextEditor): void {
    editor.setDecorations(this.stickyDecorationType, []);
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
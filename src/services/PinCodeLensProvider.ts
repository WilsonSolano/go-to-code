import * as vscode from 'vscode';
import { Pin } from '../types/Pin';

export class PinCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private pins: Pin[] = [];

  refresh(pins: Pin[]): void {
    this.pins = pins;
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const filePath = document.uri.fsPath;
    const filePins = this.pins.filter((p) => p.file === filePath);

    return filePins.map((pin) => {
      const line = Math.min(pin.line, document.lineCount - 1);
      const range = new vscode.Range(line, 0, line, 0);
      return new vscode.CodeLens(range, {
        title: `📌 ${pin.description || `Línea ${pin.line + 1}`}`,
        command: 'pinpoint.navigateToPin',
        arguments: [pin],
        tooltip: `${pin.file}:${pin.line + 1}`,
      });
    });
  }
}

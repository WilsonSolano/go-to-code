import * as vscode from 'vscode';
import * as path from 'path';
import { Pin } from '../types/Pin';

export class PinTreeDataProvider implements vscode.TreeDataProvider<PinTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PinTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private pins: Pin[] = [];

  refresh(pins: Pin[]): void {
    this.pins = pins;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: PinTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PinTreeItem): Thenable<PinTreeItem[]> {
    if (!element) {
      const grouped = new Map<string, Pin[]>();
      for (const pin of this.pins) {
        const list = grouped.get(pin.file) || [];
        list.push(pin);
        grouped.set(pin.file, list);
      }

      const items: PinTreeItem[] = [];
      for (const [filePath, filePins] of grouped) {
        items.push(new PinFileItem(filePath, filePins.length));
      }
      items.sort((a, b) => String(a.label).localeCompare(String(b.label)));
      return Promise.resolve(items);
    }

    if (element instanceof PinFileItem) {
      const filePins = this.pins
        .filter((p) => p.file === element.file)
        .sort((a, b) => a.line - b.line);
      return Promise.resolve(filePins.map((pin) => new PinItem(pin)));
    }

    return Promise.resolve([]);
  }
}

export type PinTreeItem = PinFileItem | PinItem;

export class PinFileItem extends vscode.TreeItem {
  constructor(
    public file: string,
    pinCount: number
  ) {
    super(path.basename(file), vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${pinCount} pin(es)`;
    this.contextValue = 'pinFile';
    this.iconPath = new vscode.ThemeIcon('file');
    this.tooltip = file;
  }
}

export class PinItem extends vscode.TreeItem {
  constructor(public pin: Pin) {
    super(
      pin.description || `Línea ${pin.line + 1}`,
      vscode.TreeItemCollapsibleState.None
    );
    this.description = `:${pin.line + 1}`;
    this.contextValue = 'pin';
    this.iconPath = new vscode.ThemeIcon('bookmark');
    this.command = {
      command: 'pinpoint.navigateToPin',
      title: 'Ir al pin',
      arguments: [pin],
    };
    this.tooltip = `${pin.file}:${pin.line + 1}`;
  }
}

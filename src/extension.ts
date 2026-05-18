import * as vscode from 'vscode';
import { PinService } from './services/PinService';
import { DecorationService } from './services/DecorationService';
import { UIService } from './services/UIService';
import { CommandController } from './controllers/CommandController';
import { PinTreeDataProvider } from './services/PinTreeDataProvider';
import { PinCodeLensProvider } from './services/PinCodeLensProvider';

let pinService: PinService;
let decorationService: DecorationService;
let uiService: UIService;
let commandController: CommandController;
let treeDataProvider: PinTreeDataProvider;
let codeLensProvider: PinCodeLensProvider;

export function activate(context: vscode.ExtensionContext) {
  pinService = new PinService(context);
  decorationService = new DecorationService();
  uiService = new UIService();

  treeDataProvider = new PinTreeDataProvider();
  codeLensProvider = new PinCodeLensProvider();

  vscode.window.registerTreeDataProvider('go-to-code.pinsView', treeDataProvider);
  vscode.window.registerTreeDataProvider('go-to-code.pinsPanel', treeDataProvider);

  const pins = pinService.getPins();
  treeDataProvider.refresh(pins);
  codeLensProvider.refresh(pins);

  const selector: vscode.DocumentSelector = { scheme: 'file' };
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, codeLensProvider)
  );

  commandController = new CommandController(
    pinService,
    decorationService,
    uiService,
    context,
    treeDataProvider,
    codeLensProvider
  );

  pinService.onPinChange(() => {
    const allPins = pinService.getPins();
    treeDataProvider.refresh(allPins);
    codeLensProvider.refresh(allPins);
    updateAllDecorations();
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });

  updateAllDecorations();
}

function updateDecorations(editor: vscode.TextEditor): void {
  const pins = pinService.getPins();
  decorationService.updateDecorations(editor, pins);
}

function updateAllDecorations(): void {
  const pins = pinService.getPins();
  vscode.window.visibleTextEditors.forEach((editor) => {
    decorationService.updateDecorations(editor, pins);
  });
}

export function deactivate() {
  if (pinService) {
    pinService.dispose();
  }
  if (decorationService) {
    decorationService.dispose();
  }
  if (commandController) {
    commandController.dispose();
  }
}

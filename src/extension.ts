// src/extension.ts
import * as vscode from 'vscode';
import { PinService } from './services/PinService';
import { DecorationService } from './services/DecorationService';
import { UIService } from './services/UIService';
import { CommandController } from './controllers/CommandController';

let pinService: PinService;
let decorationService: DecorationService;
let uiService: UIService;
let commandController: CommandController;

export function activate(context: vscode.ExtensionContext) {
  console.log('✨ PinPoint extension activada');

  // Inicializar servicios
  pinService = new PinService(context);
  decorationService = new DecorationService();
  uiService = new UIService();

  // Inicializar controlador de comandos
  commandController = new CommandController(
    pinService,
    decorationService,
    uiService,
    context
  );

  // Escuchar cambios en pins
  pinService.onPinChange((event) => {
    console.log(`📌 Pin event: ${event}`);
    updateAllDecorations();
  });

  // Actualizar decoraciones cuando se abre un archivo
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });

  // Actualizar decoraciones cuando cambia el contenido
  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });

  // Actualizar decoraciones al iniciar
  updateAllDecorations();

  console.log('✨ PinPoint inicializado correctamente');
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
  console.log('🛑 PinPoint extension desactivada');

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
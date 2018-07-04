"use strict";

import {
  window,
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  Disposable
} from "vscode";

const multiComands: { name: string; actions: string[] }[] = [
  {
    name: "newLine",
    actions: ["lineBreakInsert", "cursorDown"]
  },
  {
    name: "copy",
    actions: ["editor.action.clipboardCopyAction", "emacs.exitMarkMode"]
  }
];

const statusBarItem: StatusBarItem = window.createStatusBarItem(
  StatusBarAlignment.Left
);
statusBarItem.text = "mark mode";

let markMode = false;

const updateMarkMode = (enable: boolean): void => {
  markMode = enable;
  commands.executeCommand("setContext", "emacs.markMode", markMode);
  markMode ? statusBarItem.show() : statusBarItem.hide();
};

const registerMultiCommand = (
  commandName: string,
  actions: string[]
): Disposable => {
  return commands.registerCommand(`emacs.${commandName}`, async () => {
    const promises = actions.map(action => commands.executeCommand(action));
    for (let promise of promises) {
      await promise;
    }
  });
};

export function activate(context: ExtensionContext) {
  multiComands.forEach(({ name, actions }) => {
    registerMultiCommand(name, actions);
  });

  context.subscriptions.push(
    commands.registerCommand("emacs.enterMarkMode", () => {
      updateMarkMode(true);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("emacs.exitMarkMode", () => {
      if (!markMode) {
        return;
      }
      updateMarkMode(false);
      commands.executeCommand("cancelSelection");
    })
  );

  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(event => {
      const hasSelection = !event.selections.every(
        selection => selection.isEmpty
      );
      if (markMode && !hasSelection) {
        // TODO: exchange
        updateMarkMode(false);
      } else if (!markMode && hasSelection) {
        updateMarkMode(true);
      }
    })
  );
}

export function deactivate() {}

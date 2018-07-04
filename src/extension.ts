"use strict";

import {
  window,
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem
} from "vscode";

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

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("emacsMarkMode.enter", () => {
      updateMarkMode(true);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("emacsMarkMode.exit", () => {
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

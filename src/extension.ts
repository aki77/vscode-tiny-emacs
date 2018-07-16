"use strict";

import {
  window,
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  Disposable
} from "vscode";

const emacsComands: { name: string; actions: string[] }[] = [
  {
    name: "newLine",
    actions: ["lineBreakInsert", "cursorDown", "cursorEnd"]
  },
  {
    name: "copy",
    actions: ["editor.action.clipboardCopyAction", "emacs.exitMarkMode"]
  },
  // NOTE: Workaround of window.showInputBox
  {
    name: "paste",
    actions: ["editor.action.clipboardPasteAction"]
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

const registerEmacsCommand = (
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

const hasMultipleSelections = () => {
  const editor = window.activeTextEditor;
  const selections = editor ? editor.selections : [];
  const hasSelection = selections.some(selection => !selection.isEmpty);
  return selections.length > 0 && hasSelection;
};

export function activate(context: ExtensionContext) {
  emacsComands.forEach(({ name, actions }) => {
    context.subscriptions.push(registerEmacsCommand(name, actions));
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

      if (hasMultipleSelections()) {
        // NOTE: clear selection, keep cursors
        commands.executeCommand("cursorRight");
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

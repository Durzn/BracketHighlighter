// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Highlighter from './Highlighter';
import * as DecorationHandler from './DecorationHandler';
import * as GlobalsHandler from './GlobalsHandler';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';
import * as ConfigHandler from './ConfigHandler';

var globals: GlobalsHandler.GlobalsHandler;

function handleTextSelectionEvent() {
	let activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		return;
	}
	if (globals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(globals.decorationTypes);
		globals.decorationStatus = false;
	}
	let selection = activeEditor.selection;
	let selectionText = getTextAroundSelection(activeEditor, selection);
	let startSymbol = extractStartSymbol(selectionText);
	if (startSymbol !== "" && selectionText.length <= 2) {
		let startPosition = getStartPosition(selection, selectionText, startSymbol);
		let symbolHandler = new SymbolHandler.SymbolHandler();
		let highlighter = new Highlighter.Highlighter();
		let decorationHandler = new DecorationHandler.DecorationHandler();
		let symbolFinder = new SymbolFinder.SymbolFinder();
		let counterPartSymbol = symbolHandler.getCounterPart(startSymbol);
		let textRanges: Array<vscode.Range> = symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol, counterPartSymbol, startPosition);
		let decorationTypes = highlighter.highlightRanges(activeEditor, decorationHandler, textRanges);
		globals.decorationStatus = true;
		for (let decorationType of decorationTypes) {
			globals.decorationTypes.push(decorationType);
		}
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	globals = new GlobalsHandler.GlobalsHandler();
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function extractStartSymbol(selectionText: string): string {
	let symbolHandler = new SymbolHandler.SymbolHandler();
	let validSymbols = symbolHandler.getValidSymbols();
	for (let validSymbol of validSymbols) {

		if (selectionText.includes(validSymbol)) {
			return validSymbol;
		}
	}
	return "";
}


function getTextAroundSelection(activeEditor: vscode.TextEditor, selection: vscode.Selection): string {
	let leftOffset = -1;
	let rightOffset = 1;
	if (selection.start.character === 0) {
		leftOffset = 0;
	}
	let startPosition: vscode.Position = selection.start.translate(0, leftOffset);
	let endPosition: vscode.Position = selection.end.translate(0, rightOffset);
	let range = selection.with(startPosition, endPosition);
	return activeEditor.document.getText(range);
}

function getStartPositionStartSymbol(selection: vscode.Selection, selectionText: string, startSymbol: string): vscode.Position {
	let position = selection.start.character;
	if (selectionText.length === 1) {
		if (selection.start.character !== 0) {
			position -= 1;
		}
	}
	else if (selectionText.length === 2) {
		if (selectionText.startsWith(startSymbol) === true) {
			position -= 1;
		}
	}
	return selection.start.with(selection.start.line, position);
}

function getStartPositionEndSymbol(selection: vscode.Selection, selectionText: string, startSymbol: string): vscode.Position {
	let position = selection.start.character;
	if (selectionText.length === 1) {
		if (position === 0) {
			position += 1;
		}
	}
	else if (selectionText.length === 2) {
		if (selectionText.startsWith(startSymbol) === false) {
			position += 1;
		}
	}
	return selection.start.with(selection.start.line, position);
}

function getStartPosition(selection: vscode.Selection, selectionText: string, startSymbol: string): vscode.Position {
	let symbolHandler = new SymbolHandler.SymbolHandler();
	let isStartSymbol = symbolHandler.isValidStartSymbol(startSymbol);
	if (isStartSymbol) {
		return getStartPositionStartSymbol(selection, selectionText, startSymbol);
	}
	else {
		return getStartPositionEndSymbol(selection, selectionText, startSymbol);
	}
}
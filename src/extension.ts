// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Highlighter from './Highlighter';
import * as DecorationHandler from './DecorationHandler';
import { bracketHighlightGlobals } from './GlobalsHandler';
import { SearchDirection } from './GlobalsHandler';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';
import ConfigHandler from './ConfigHandler';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('BracketHighlighter.toggleExtensionStatus', () => {
		bracketHighlightGlobals.extensionEnabled = !bracketHighlightGlobals.extensionEnabled;
		let configHandler = new ConfigHandler();
		configHandler.setExtensionEnabledStatus(bracketHighlightGlobals.extensionEnabled);
		removePreviousDecorations();
	});
	vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
	context.subscriptions.push(disposable);
}

/* TODO: 
option to set and description for custom opening/closing symbols 
error handling if letter occurs multiple times in symbols
*/

// this method is called when your extension is deactivated
export function deactivate() { }

function handleConfigChangeEvent() {
	bracketHighlightGlobals.blurOutOfScopeText = bracketHighlightGlobals.configHandler.blurOutOfScopeText();
	bracketHighlightGlobals.opactiy = bracketHighlightGlobals.configHandler.getOpacity();
	bracketHighlightGlobals.activeWhenDebugging = bracketHighlightGlobals.configHandler.activeWhenDebugging();
	bracketHighlightGlobals.maxLineSearchCount = bracketHighlightGlobals.configHandler.getMaxLineSearchCount();
	bracketHighlightGlobals.decorationOptions = bracketHighlightGlobals.configHandler.getDecorationOptions();
	bracketHighlightGlobals.enabledLanguages = bracketHighlightGlobals.configHandler.getEnabledLanguages();
	bracketHighlightGlobals.reverseSearchEnabled = bracketHighlightGlobals.configHandler.reverseSearchEnabled();
	bracketHighlightGlobals.allowedStartSymbols = bracketHighlightGlobals.configHandler.getAllowedStartSymbols();
	bracketHighlightGlobals.allowedEndSymbols = bracketHighlightGlobals.configHandler.getAllowedEndSymbols();
	bracketHighlightGlobals.highlightScopeFromText = bracketHighlightGlobals.configHandler.highlightScopeFromText();
	bracketHighlightGlobals.extensionEnabled = bracketHighlightGlobals.configHandler.isExtensionEnabled();
}

function handleTextSelectionEvent() {
	/******************************************* Early abort reasons **********************************************************************/
	if (bracketHighlightGlobals.extensionEnabled === false) {
		return;
	}
	let activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		return;
	}
	let debugMode = vscode.debug.activeDebugSession;
	if (debugMode !== undefined && bracketHighlightGlobals.activeWhenDebugging === false) {
		removePreviousDecorations();
		return;
	}
	if (bracketHighlightGlobals.enabledLanguages.length === 1 && bracketHighlightGlobals.enabledLanguages.includes("")) {
	}
	else if (bracketHighlightGlobals.enabledLanguages.includes(activeEditor.document.languageId) === false) {
		return;
	}
	let currentSelection = activeEditor.selection;
	if (bracketHighlightGlobals.handleTextSelectionEventActive === false) {
		return;
	}
	/*************************************************************************************************************************************/

	removePreviousDecorations();
	let startSymbol = getStartSymbolFromSelection(activeEditor, currentSelection);
	if (startSymbol !== "" && (currentSelection.active.isEqual(currentSelection.anchor))) {
		let symbolHandler = new SymbolHandler.SymbolHandler();
		if (symbolHandler.isValidStartSymbol(startSymbol)) {
			bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
		}
		else {
			bracketHighlightGlobals.searchDirection = SearchDirection.BACKWARDS;
		}
		let startPosition = getStartPosition(activeEditor, currentSelection, startSymbol);
		let counterPartSymbol = symbolHandler.getCounterPart(startSymbol);
		handleHighlightFromSymbol(activeEditor, startSymbol, counterPartSymbol, startPosition);
	}
	else if (bracketHighlightGlobals.highlightScopeFromText === true) {
		let startPosition = currentSelection.start;
		handleHighlightFromText(activeEditor, startPosition, bracketHighlightGlobals.allowedStartSymbols, bracketHighlightGlobals.allowedEndSymbols);
	}
}

function handleHighlightFromText(activeEditor: vscode.TextEditor, startPosition: vscode.Position, allowedStartSymbols: Array<string>, allowedEndSymbols: Array<string>) {
	let symbolHandler = new SymbolHandler.SymbolHandler();
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let textLines = activeEditor.document.getText(new vscode.Range(activeEditor.document.positionAt(0), startPosition)).split("\n");
	let symbolData = symbolFinder.findDepth1Backwards(startPosition, textLines, allowedStartSymbols, allowedEndSymbols);
	bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
	handleHighlightFromSymbol(activeEditor, symbolData.symbol, symbolHandler.getCounterPart(symbolData.symbol), symbolData.symbolPosition);
}

function handleHighlightFromSymbol(activeEditor: vscode.TextEditor, startSymbol: string, counterPartSymbol: string, startPosition: vscode.Position) {
	let highlighter = new Highlighter.Highlighter();
	let decorationHandler = new DecorationHandler.DecorationHandler();
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let textRanges: Array<vscode.Range> = symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol, counterPartSymbol, startPosition);

	let decorationTypes = highlighter.highlightRanges(activeEditor, decorationHandler, textRanges);
	bracketHighlightGlobals.decorationStatus = true;
	for (let decorationType of decorationTypes) {
		bracketHighlightGlobals.decorationTypes.push(decorationType);
	}

	if (bracketHighlightGlobals.blurOutOfScopeText === true) {
		if (bracketHighlightGlobals.searchDirection === SearchDirection.BACKWARDS) {
			textRanges = textRanges.reverse();
		}
		let textRangeBegin = new vscode.Range(activeEditor.document.positionAt(0), textRanges[0].start);
		let textRangeEnd = new vscode.Range(textRanges[textRanges.length - 1].end, activeEditor.document.positionAt(activeEditor.document.getText().length));
		let decorationType: Array<vscode.TextEditorDecorationType> = [
			vscode.window.createTextEditorDecorationType({
				opacity: bracketHighlightGlobals.opactiy
			}),
			vscode.window.createTextEditorDecorationType({
				opacity: bracketHighlightGlobals.opactiy
			})
		];
		highlighter.highlightRange(activeEditor, decorationType[0], textRangeBegin);
		highlighter.highlightRange(activeEditor, decorationType[1], textRangeEnd);
		bracketHighlightGlobals.decorationTypes.push(decorationType[0]);
		bracketHighlightGlobals.decorationTypes.push(decorationType[1]);
	}
}

function removePreviousDecorations() {
	if (bracketHighlightGlobals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(bracketHighlightGlobals.decorationTypes);
		bracketHighlightGlobals.decorationStatus = false;
	}
}

function getStartSymbolFromSelection(activeEditor: vscode.TextEditor, selection: vscode.Selection): string {
	let symbolHandler = new SymbolHandler.SymbolHandler;
	let validSymbols = symbolHandler.getValidSymbols();
	let longestSymbolLength = validSymbols.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
	let selectionLineText = activeEditor.document.getText(new vscode.Range(new vscode.Position(selection.start.line, 0), new vscode.Position(selection.start.line, selection.start.character + longestSymbolLength))); /* TODO: grab longest from config */
	let stringPosition = selection.start.character;
	let selectionSymbol = selectionLineText[stringPosition];
	if (selectionSymbol === " " || selectionSymbol === undefined) {
		if (selection.start.character > 0) {
			stringPosition--;
			selectionSymbol = selectionLineText[stringPosition];
		}
		else {
			return "";
		}
	}
	/* Necessary to make the extension consistent */
	else if (selectionSymbol === ";") {
		if (selection.start.character > 0) {
			stringPosition--;
			selectionSymbol = selectionLineText[stringPosition];
		}

	}
	const containsSymbol = (symbol: string) => symbol.indexOf(selectionSymbol) !== -1;
	validSymbols = validSymbols.filter(containsSymbol);
	let tempValidSymbols = validSymbols;
	while (validSymbols.some(containsSymbol)) {
		if (stringPosition === 0) {
			selectionSymbol = " " + selectionSymbol;
			break;
		}
		else {
			stringPosition--;
		}
		selectionSymbol = selectionLineText[stringPosition] + selectionSymbol;
		tempValidSymbols = tempValidSymbols.filter(containsSymbol);
		if (tempValidSymbols.length !== 0) {
			validSymbols = validSymbols.filter(containsSymbol);
		}
	}
	selectionSymbol = selectionSymbol.substr(1, selectionSymbol.length - 1);
	stringPosition = selection.start.character;
	while (validSymbols.some(containsSymbol)) {
		stringPosition++;
		if (selectionLineText[stringPosition] === undefined) {
			selectionSymbol = selectionSymbol + " ";
			break;
		}
		selectionSymbol = selectionSymbol + selectionLineText[stringPosition];
		tempValidSymbols = tempValidSymbols.filter(containsSymbol);
		if (tempValidSymbols.length !== 0) {
			validSymbols = validSymbols.filter(containsSymbol);
		}
	}
	selectionSymbol = selectionSymbol.substr(0, selectionSymbol.length - 1);
	let startSymbol = selectionSymbol;
	if (symbolHandler.isValidStartSymbol(startSymbol) || symbolHandler.isValidEndSymbol(startSymbol)) {
		return startSymbol;
	}
	return "";
}

function getPositionInTextForwardSearch(activeEditor: vscode.TextEditor, selection: vscode.Selection, startSymbol: string): vscode.Position {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let symbolLength = startSymbol.length;
	let internalOffset = 0;
	let oldSelectionStartPosition: vscode.Position = selection.start;
	let selectionSymbol: string = activeEditor.document.getText(new vscode.Range(selection.start, oldSelectionStartPosition.translate(0, 1)));
	if (selectionSymbol === " " || selectionSymbol === "") {
		/* Selection is at the end of the symbol */
		return selection.start.translate(0, -symbolLength);
	}
	let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
	while (letterIndices.length > 1) {
		if (oldSelectionStartPosition.character > 0) {
			let newSelectionStartPosition = oldSelectionStartPosition.translate(0, -1);
			selectionSymbol = activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition)) + selectionSymbol;
			letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
			oldSelectionStartPosition = newSelectionStartPosition;
			internalOffset++;
		}
		else {
			break;
		}
	}
	if (letterIndices[0] !== -1) {
		return selection.start.translate(0, -letterIndices[0] - internalOffset);
	}

	return selection.start;
}

function getPositionInTextBackwardSearch(activeEditor: vscode.TextEditor, selection: vscode.Selection, startSymbol: string): vscode.Position {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let symbolLength = startSymbol.length;
	let internalOffset = 0;
	let selectionSymbol = activeEditor.document.getText(new vscode.Range(selection.start, selection.start.translate(0, 1)));
	if (selectionSymbol === "" || selectionSymbol === " ") {
		/* Selection is at the end of the symbol */
		return selection.start;
	}
	/* Necessary to make the extension consistent */
	else if (selectionSymbol === ";") {
		selectionSymbol = activeEditor.document.getText(new vscode.Range(selection.start, selection.start.translate(0, -1)));
		internalOffset--;
	}
	let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
	/* Search until unique sequence is found in string */
	while (letterIndices.length > 1) {
		selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(selection.start, selection.start.translate(0, 1)));
		letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
		internalOffset++;
	}
	if (letterIndices[0] !== -1) {
		return selection.start.translate(0, symbolLength - letterIndices[0] + internalOffset);
	}

	return selection.start;
}

function getStartPosition(activeEditor: vscode.TextEditor, selection: vscode.Selection, startSymbol: string): vscode.Position {
	let shiftDirection =  1;
	let shiftLength;
	let position = selection.start;
	if (bracketHighlightGlobals.searchDirection === SearchDirection.FORWARDS) {
		shiftDirection = -1;
		shiftLength = position.character - getPositionInTextForwardSearch(activeEditor, selection, startSymbol).character;
	}
	else {
		shiftLength = getPositionInTextBackwardSearch(activeEditor, selection, startSymbol).character - position.character;
	}
	return selection.start.translate(0, shiftDirection * shiftLength);
}
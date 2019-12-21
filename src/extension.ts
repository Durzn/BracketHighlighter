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
	removePreviousDecorations();
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
	let startSymbol = getStartSymbolFromSelection(activeEditor, currentSelection.start, 0);
	if (startSymbol.startSymbol !== "" && (currentSelection.active.isEqual(currentSelection.anchor))) {
		let symbolHandler = new SymbolHandler.SymbolHandler();
		if (symbolHandler.isValidStartSymbol(startSymbol.startSymbol)) {
			bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
		}
		else {
			bracketHighlightGlobals.searchDirection = SearchDirection.BACKWARDS;
		}
		let startPosition = getStartPosition(activeEditor, currentSelection.start, startSymbol.startSymbol, startSymbol.offset);
		let counterPartSymbol = symbolHandler.getCounterPart(startSymbol.startSymbol);
		handleHighlightFromSymbol(activeEditor, startSymbol.startSymbol, counterPartSymbol, startPosition);
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

function getStartSymbolFromSelection(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, functionCount: number): {
	startSymbol: string, offset: number
} {
	if (functionCount >= 2) {
		return { startSymbol: "", offset: 0 };
	}
	let symbolHandler = new SymbolHandler.SymbolHandler;
	let validSymbols = symbolHandler.getValidSymbols();
	let longestSymbolLength = validSymbols.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
	let selectionLineText = activeEditor.document.getText(new vscode.Range(new vscode.Position(selectionStart.line, 0), new vscode.Position(selectionStart.line, selectionStart.character + longestSymbolLength))); /* TODO: grab longest from config */
	let stringPosition = selectionStart.character;
	let selectionSymbol = selectionLineText[stringPosition];
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
	if (selectionSymbol === undefined) {
		return getStartSymbolFromSelection(activeEditor, selectionStart.translate(0, -1), functionCount + 1);
	}
	selectionSymbol = selectionSymbol.substr(1, selectionSymbol.length - 1);
	stringPosition = selectionStart.character;
	while (validSymbols.some(containsSymbol) && selectionSymbol !== "") {
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
		return { startSymbol: startSymbol, offset: -functionCount };
	}
	else {
		return getStartSymbolFromSelection(activeEditor, selectionStart.translate(0, -1), functionCount + 1);
	}
}

function getPositionInTextForwardSearch(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, startSymbol: string, offset: number): vscode.Position {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let internalOffset = -offset;
	let oldSelectionStartPosition: vscode.Position = selectionStart;
	let startPosition = selectionStart.translate(0, offset);
	let endPosition = selectionStart;
	if (offset === 0) {
		endPosition = endPosition.translate(0, 1);
	}
	let selectionSymbol: string = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
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
	oldSelectionStartPosition = selectionStart;
	while (letterIndices.length > 1) {
		let newSelectionStartPosition = oldSelectionStartPosition.translate(0, 1);
		selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition));
		letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
		oldSelectionStartPosition = newSelectionStartPosition;
	}
	if (letterIndices[0] !== -1) {
		return selectionStart.translate(0, -letterIndices[0] - internalOffset);
	}

	return selectionStart;
}

function getPositionInTextBackwardSearch(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, startSymbol: string, offset: number): vscode.Position {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let symbolLength = startSymbol.length;
	let internalOffset = offset;
	let oldSelectionStartPosition: vscode.Position = selectionStart;
	let startPosition = selectionStart.translate(0, offset);
	let endPosition = selectionStart;
	if (offset === 0) {
		endPosition = endPosition.translate(0, 1);
	}
	let selectionSymbol = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
	let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
	/* Search until unique sequence is found in string */
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
	oldSelectionStartPosition = selectionStart;
	while (letterIndices.length > 1) {
		let newSelectionStartPosition = oldSelectionStartPosition.translate(0, 1);
		selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition));
		letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
		oldSelectionStartPosition = newSelectionStartPosition;
	}
	if (letterIndices[0] !== -1) {
		return selectionStart.translate(0, symbolLength - letterIndices[0] + internalOffset);
	}

	return selectionStart;
}

function getStartPosition(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, startSymbol: string, offset: number): vscode.Position {
	let shiftDirection = 1;
	let shiftLength;
	if (bracketHighlightGlobals.searchDirection === SearchDirection.FORWARDS) {
		shiftDirection = -1;
		shiftLength = selectionStart.character - getPositionInTextForwardSearch(activeEditor, selectionStart, startSymbol, offset).character;
	}
	else {
		shiftLength = getPositionInTextBackwardSearch(activeEditor, selectionStart, startSymbol, offset).character - selectionStart.character;
	}
	return selectionStart.translate(0, shiftDirection * shiftLength);
}
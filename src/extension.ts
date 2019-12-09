// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Highlighter from './Highlighter';
import * as DecorationHandler from './DecorationHandler';
import GlobalsHandler, { bracketHighlightGlobals } from './GlobalsHandler';
import { SearchDirection } from './GlobalsHandler';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';

var disableTimer: any = null;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
}

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
}

function handleTextSelectionEvent() {
	/******************************************* Early abort reasons **********************************************************************/
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
	if (bracketHighlightGlobals.lastSelection === undefined) {
		bracketHighlightGlobals.lastSelection = currentSelection;
	}
	if (currentSelection.start !== bracketHighlightGlobals.lastSelection.start) {
		//onSelectionChangeEvent(currentSelection, bracketHighlightGlobals.lastSelection);
	}
	if (bracketHighlightGlobals.handleTextSelectionEventActive === false) {
		return;
	}
	/*************************************************************************************************************************************/

	removePreviousDecorations();
	let selectionText = getTextAroundSelection(activeEditor, currentSelection);
	let startSymbol = extractStartSymbol(selectionText);
	if (startSymbol !== "" && selectionText.length <= 2) {
		let symbolHandler = new SymbolHandler.SymbolHandler();
		if (symbolHandler.isValidStartSymbol(startSymbol)) {
			bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
		}
		else {
			bracketHighlightGlobals.searchDirection = SearchDirection.BACKWARDS;
		}
		let startPosition = getStartPosition(currentSelection, selectionText, startSymbol);
		let counterPartSymbol = symbolHandler.getCounterPart(startSymbol);
		handleHighlightFromSymbol(activeEditor, startSymbol, counterPartSymbol, startPosition);
		bracketHighlightGlobals.lastSelection = currentSelection;
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

function setTextSelectionEventHandling(state: boolean) {
	bracketHighlightGlobals.handleTextSelectionEventActive = state;
}

function onSelectionChangeEvent(currentSelection: vscode.Selection, lastSelection: vscode.Selection) {
	let currentSelectionPos = currentSelection.anchor;
	let lastSelectionPos = lastSelection.anchor;
	if (currentSelectionPos.line === lastSelectionPos.line && currentSelectionPos.character !== lastSelectionPos.character) {
		if (disableTimer !== null) {
			clearTimeout(disableTimer);
			bracketHighlightGlobals.disableTimer = null;
		}
		setTextSelectionEventHandling(false);
		disableTimer = setTimeout(function () {
			setTextSelectionEventHandling(true);
			bracketHighlightGlobals.lastSelection = undefined;
			handleTextSelectionEvent();
			disableTimer = null;
		}, 500);
	}
}

function removePreviousDecorations() {
	if (bracketHighlightGlobals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(bracketHighlightGlobals.decorationTypes);
		bracketHighlightGlobals.decorationStatus = false;
	}
}

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
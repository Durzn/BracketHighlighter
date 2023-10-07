// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Highlighter from './Highlighter';
import DecorationHandler, { DecorationType } from './DecorationHandler';
import { bracketHighlightGlobals, DecorationStatus } from './GlobalsHandler';
import SymbolFinder from './SymbolFinder';
import ActionHandler from './ActionHandler';
import * as Util from './Util';
import ConfigHandler, { HighlightSymbol } from './ConfigHandler';


export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
}

export function deactivate() { }


/******************************************************************************************************************************************
* Handles the config change event
******************************************************************************************************************************************/
function handleConfigChangeEvent() {
	bracketHighlightGlobals.onConfigChange();
	removePreviousDecorations();
}

/******************************************************************************************************************************************
* Handles the text selection event
******************************************************************************************************************************************/
function handleTextSelectionEvent() {

	let configuredSymbols = bracketHighlightGlobals.configuredSymbols;

	/******************************************* Early abort reasons **********************************************************************/
	if (bracketHighlightGlobals.extensionEnabled === false) {
		return;
	}
	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor === undefined || !activeEditor) {
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
		onSelectionChangeEvent(currentSelection, bracketHighlightGlobals.highlightRanges);
	}
	bracketHighlightGlobals.lastSelection = currentSelection;
	if (bracketHighlightGlobals.handleTextSelectionEventActive === false) {
		return;
	}
	if (configuredSymbols.length <= 0) {
		return;
	}
	/*************************************************************************************************************************************/


	removePreviousDecorations();

	let symbolStart: Util.SymbolWithRange | undefined = undefined;
	let symbolAtCursor = getSymbolAtCursor(activeEditor, currentSelection.active, configuredSymbols);
	if (symbolAtCursor) {
		symbolStart = symbolAtCursor;
	}
	else {
		symbolStart = findSymbolUpwards(activeEditor, currentSelection.active, configuredSymbols);
	}
	if (symbolStart) {
		let symbolEnd = findSymbolDownwards(activeEditor, currentSelection.active, configuredSymbols);
		if (symbolEnd) {
			let symbolDecorationHandler = new DecorationHandler(DecorationType.SYMBOLS);
			let rangeToHighlight = new vscode.Range(symbolStart.range.start, symbolEnd.range.end);
			bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, symbolDecorationHandler, [rangeToHighlight]));
			bracketHighlightGlobals.highlightRanges.push(rangeToHighlight);
			bracketHighlightGlobals.decorationStatus = DecorationStatus.active;
		}
	}
}

/******************************************************************************************************************************************
* Blurs a given range
*	activeEditor: Currently used editor
*	range: Range to blur
******************************************************************************************************************************************/
function blurRange(activeEditor: vscode.TextEditor, range: vscode.Range) {
	let decorationType: vscode.TextEditorDecorationType =
		vscode.window.createTextEditorDecorationType({
			opacity: bracketHighlightGlobals.opacity
		});
	Highlighter.highlightRange(activeEditor, decorationType, range);
	bracketHighlightGlobals.decorationTypes.push(decorationType);
}

/******************************************************************************************************************************************
* Removes all previous decorations
******************************************************************************************************************************************/
function removePreviousDecorations() { /* TODO: extend this for multiple editors */
	if (bracketHighlightGlobals.decorationStatus === DecorationStatus.active) {
		Highlighter.removeHighlights(bracketHighlightGlobals.decorationTypes);
		bracketHighlightGlobals.decorationStatus = DecorationStatus.inactive;
		bracketHighlightGlobals.highlightRanges = [];
	}
}

/**
 * 
 */
function findSymbolUpwards(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): Util.SymbolWithRange | undefined {
	let maxLineSearch = new ConfigHandler().getMaxLineSearchCount();
	let text: string = activeEditor.document.getText(new vscode.Range(selectionStart.translate(-maxLineSearch), selectionStart));
	let textArray: string[] = text.split('\n');
	let reversedText = textArray.reverse(); /* Reverse the text as the expectation is that the symbol is usually closer to the cursor. */
	let lineCounter = 0;
	for (let line of reversedText) {
		for (let symbol of configuredSymbols) {
			let symbolInLine = getSymbolInLine(line, symbol, symbol.start, selectionStart.line + lineCounter);
			if (symbolInLine) {
				return symbolInLine;
			}
		}
		lineCounter++;
	}
	return undefined;
}
/**
 * 
 */
function findSymbolDownwards(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): Util.SymbolWithRange | undefined {
	let maxLineSearch = new ConfigHandler().getMaxLineSearchCount();
	let text: string[] = activeEditor.document.getText(new vscode.Range(selectionStart, selectionStart.translate(maxLineSearch))).split('\n');
	let lineCounter = 0;
	for (let line of text) {
		for (let symbol of configuredSymbols) {
			let symbolInLine = getSymbolInLine(line, symbol, symbol.end, selectionStart.line + lineCounter);
			if (symbolInLine) {
				return symbolInLine;
			}
		}
		lineCounter++;
	}
	return undefined;
}

/**
 * 
 */
function getSymbolInLine(line: string, symbol: HighlightSymbol, symbolStartOrEnd: string, lineNumber: number): Util.SymbolWithRange | undefined {
	let matchRange = SymbolFinder.getMatchRangeClosestToPosition(line, symbol, symbolStartOrEnd, new vscode.Position(lineNumber, 0));
	if (matchRange) {
		/* Always take the latest finding */
		return new Util.SymbolWithRange(symbol, matchRange);
	}
	return undefined;
}

/******************************************************************************************************************************************
* Corrects the start position to the symbol. Will put the cursor before a starting symbol (includes it) and behind a closing symbol (includes it). Differentiates between forward and backward search
*	activeEditor: Currently used editor
*	selectionStart: Selection from where to start the search
*	startSymbol: Symbol to search for
*	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
******************************************************************************************************************************************/
function getSymbolAtCursor(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): Util.SymbolWithRange | undefined {
	let lineText = activeEditor.document.lineAt(selectionStart).text;
	let textStart: number | undefined = undefined;
	let textEnd: number | undefined = undefined;
	/* Find start of text ahead of cursor */
	for (let i = selectionStart.character - 1; i >= 0; i--) {
		if (i === 0 || lineText[i] === ' ') {
			textStart = i;
		}
	}
	/* Find start of text ahead of cursor */
	for (let i = selectionStart.character - 1; i <= lineText.length; i++) {
		if (i === lineText.length || lineText[i] === ' ') {
			textEnd = i;
		}
	}
	if (textStart === undefined || textEnd === undefined) {
		return undefined;
	}
	let selectionTextRange = new vscode.Range(selectionStart.with(selectionStart.line, textStart), selectionStart.with(selectionStart.line, textEnd));
	let selectionTextRangeText = activeEditor.document.getText(selectionTextRange);
	for (let symbol of configuredSymbols) {
		let matchRange = SymbolFinder.getMatchRangeClosestToPosition(selectionTextRangeText, symbol, symbol.start, new vscode.Position(selectionStart.line, 0));
		if (matchRange) {
			/* Always take the latest finding */
			return new Util.SymbolWithRange(symbol, matchRange);
		}
	}

	return undefined;
}

/******************************************************************************************************************************************
* Handles the text selection event
*	state: State to toggle to. Enables or disables the extension if set.
******************************************************************************************************************************************/
function setTextSelectionEventHandling(state: boolean) {
	bracketHighlightGlobals.handleTextSelectionEventActive = state;
}

/******************************************************************************************************************************************
* Checks if the current selection is in the previously highlighted range
*	currentSelection: Selection to check
******************************************************************************************************************************************/
function isSelectionInPreviousRange(currentSelection: vscode.Selection, previousRanges: vscode.Range[]): boolean {
	let selectionContained: boolean = false;
	for (let highlightRange of previousRanges) {
		selectionContained = highlightRange.contains(currentSelection);
	}
	return selectionContained;
}

/******************************************************************************************************************************************
* Clears the timeout of the global timer handle and resets the timer.
******************************************************************************************************************************************/
function clearTimer() {
	clearTimeout(bracketHighlightGlobals.disableTimer);
	bracketHighlightGlobals.disableTimer = null;
}

/******************************************************************************************************************************************
* Business logic, which shall be executed once the timeout with the configured time span occurs.
******************************************************************************************************************************************/
function timeoutFunction() {
	setTextSelectionEventHandling(true);
	bracketHighlightGlobals.lastSelection = undefined;
	handleTextSelectionEvent();
	bracketHighlightGlobals.disableTimer = null;
}

/******************************************************************************************************************************************
* Handles the selection change event. Enables/Disables the extension for a certain amount of time.
*	currentSelection: Selection used to determine if highlighting is necessary
******************************************************************************************************************************************/
function onSelectionChangeEvent(currentSelection: vscode.Selection, previousRanges: vscode.Range[]) {
	if (isSelectionInPreviousRange(currentSelection, previousRanges)) {
		if (bracketHighlightGlobals.disableTimer !== null) {
			clearTimer();
		}
		setTextSelectionEventHandling(false);
		bracketHighlightGlobals.disableTimer = setTimeout(
			timeoutFunction,
			bracketHighlightGlobals.timeOutValue
		);
	}
	else {
		if (bracketHighlightGlobals.disableTimer !== null) {
			clearTimer();
		}
		setTextSelectionEventHandling(true);
	}
}
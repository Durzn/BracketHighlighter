// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Highlighter from './Highlighter';
import DecorationHandler, { DecorationType } from './DecorationHandler';
import { bracketHighlightGlobals, DecorationStatus } from './GlobalsHandler';
import SymbolFinder, { SearchFuncType } from './SymbolFinder';
import { SymbolWithRangeInDepth, EntryWithRange, EntryWithDepth, SymbolWithRange, SymbolWithIndex, EntryWithRangeInDepth, Util } from './Util';
import ConfigHandler, { HighlightEntry, HighlightSymbol } from './ConfigHandler';


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

	for (let selection of activeEditor.selections) {
		let symbolStart: SymbolWithRange | undefined = undefined;
		let activeSelection = selection.active
		let symbolAtCursor = findSymbolAtRightOfCursor(activeEditor, activeSelection, configuredSymbols);
		if (symbolAtCursor) {
			symbolStart = symbolAtCursor;
		}
		else {
			/* Move the selection BEHIND the cursor, so the start symbol is not accounted for twice! */
			symbolStart = findSymbolUpwards(activeEditor, activeSelection, configuredSymbols);
		}
		if (symbolStart) {
			/* Move the selection BEHIND the cursor, so the start symbol is not accounted for twice! */
			activeSelection = activeSelection.translate(0, symbolStart.symbol.startSymbol.symbol.length);
			let symbolEnd = findSymbolDownwards(activeEditor, symbolStart.symbol, activeSelection);
			if (symbolEnd) {
				let symbolDecorationHandler = new DecorationHandler(DecorationType.SYMBOLS);
				let rangeToHighlight = new vscode.Range(symbolStart.range.start, symbolEnd.range.end);
				bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, symbolDecorationHandler, [rangeToHighlight]));
				bracketHighlightGlobals.highlightRanges.push(rangeToHighlight);
				bracketHighlightGlobals.decorationStatus = DecorationStatus.active;
			}
		}
	}
}

/******************************************************************************************************************************************
* Corrects the start position to the symbol. Will put the cursor before a starting symbol (includes it) and behind a closing symbol (includes it). Differentiates between forward and backward search
*	activeEditor: Currently used editor
*	selectionStart: Selection from where to start the search
*	startSymbol: Symbol to search for
*	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
******************************************************************************************************************************************/
function findSymbolAtRightOfCursor(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): SymbolWithRange | undefined {
	let line = activeEditor.document.lineAt(selectionStart);
	let selectionRangeText = line.text;
	for (let symbol of configuredSymbols) {
		let indicesOfSymbol = SymbolFinder.regexIndicesOf(selectionRangeText, new RegExp(Util.makeRegexString(symbol.startSymbol), "g"));
		if (indicesOfSymbol.length > 0) {
			let indices = indicesOfSymbol.map((index) => index.start);
			let symbolLength = indicesOfSymbol[0].symbol.length;
			for (let index of indices) {
				let cursorIsLeftOfSymbol = (selectionStart.character >= index) && (selectionStart.character < (index + symbolLength));
				if (cursorIsLeftOfSymbol) {
					let range = new vscode.Range(selectionStart.with(selectionStart.line, index), selectionStart.with(selectionStart.line, index + symbolLength));
					return new SymbolWithRange(symbol, range);
				}
			}
		}
	}

	return undefined;
}

/**
 * Corrects the cursor position so that the selection will be AFTER the symbol.
 */
function correctCursorPosition(activeEditor: vscode.TextEditor, selection: vscode.Position, foundEntry: HighlightEntry): vscode.Position {
	let currentSelection = selection;
	let text = activeEditor.document.getText(new vscode.Range(new vscode.Position(currentSelection.line, currentSelection.character - 1), new vscode.Position(currentSelection.line, currentSelection.character + foundEntry.symbol.length)));
	let foundEntryRegex: RegExp = new RegExp(Util.makeRegexString(foundEntry), "g");
	let match = foundEntryRegex.exec(text);
	if (match) {
		currentSelection = currentSelection.translate(0, foundEntry.symbol.length + 1);
	}
	return currentSelection;
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
function findSymbolUpwards(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): SymbolWithRange | undefined {
	let maxLineSearch = new ConfigHandler().getMaxLineSearchCount();
	let text: string = activeEditor.document.getText(new vscode.Range(selectionStart.translate(-Math.min(...[maxLineSearch, selectionStart.line])), selectionStart));
	let eolCharacter = activeEditor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
	let textArray: string[] = text.split(eolCharacter);
	let reversedText = textArray.reverse(); /* Reverse the text as the expectation is that the symbol is usually closer to the cursor. */

	for (let symbol of configuredSymbols) {
		let currentDepth = 0;
		let lineCounter = 0;
		let tempSelection = selectionStart;
		for (let line of reversedText) {
			let symbolInLine = getSymbolInLineWithDepthBefore(line, symbol.startSymbol, symbol.endSymbol, tempSelection, currentDepth);
			currentDepth = symbolInLine.depth;
			if (symbolInLine.range) {
				return new SymbolWithRange(symbol, symbolInLine.range);
			}
			lineCounter++;
			let newLine = selectionStart.line - lineCounter;
			if (newLine < 0) {
				break;
			}
			tempSelection = selectionStart.with(newLine, 0);
		}
	}
	return undefined;
}
/**
 * 
 */
function findSymbolDownwards(activeEditor: vscode.TextEditor, targetSymbol: HighlightSymbol, selectionStart: vscode.Position): EntryWithRange | undefined {
	let maxLineSearch = new ConfigHandler().getMaxLineSearchCount();
	let stringStartOffset = selectionStart.character;
	let eolCharacter = activeEditor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
	/* If the cursor is on the right of the symbol, it would not be found without this offset! */
	let cursorBehindSymbolOffset = targetSymbol.endSymbol.symbol.length < selectionStart.character ? targetSymbol.endSymbol.symbol.length : 0;
	let text: string[] = activeEditor.document.getText(new vscode.Range(selectionStart.translate(0, -cursorBehindSymbolOffset), selectionStart.translate(Math.min(...[maxLineSearch, activeEditor.document.lineCount])))).split(eolCharacter);
	let lineCounter = 0;
	let tempSelection = selectionStart;
	let currentDepth = 0;
	for (let line of text) {
		let symbolInLine = getSymbolInLineWithDepthBehind(line, targetSymbol.endSymbol, targetSymbol.startSymbol, tempSelection, currentDepth);
		currentDepth = symbolInLine.depth;
		if (symbolInLine.range) {
			return new EntryWithRange(symbolInLine.symbol, symbolInLine.range);
		}
		lineCounter++;
		let newLine = selectionStart.line + lineCounter;
		if (newLine > activeEditor.document.lineCount) {
			return undefined;
		}
		tempSelection = selectionStart.with(newLine, 0);
		stringStartOffset = 0;
	}
	return undefined;
}

/**
 * 
 */
function getSymbolInLineWithDepthBefore(line: string, entryToSearch: HighlightEntry, counterPartEntry: HighlightEntry, cursorPosition: vscode.Position, currentDepth: number): EntryWithRangeInDepth {
	let regexToCheck: RegExp = new RegExp(`${Util.makeRegexString(entryToSearch)}`, "g");
	let counterPartRegex: RegExp = new RegExp(`${Util.makeRegexString(counterPartEntry)}`, "g");
	let matchIndices = SymbolFinder.regexIndicesOf(line, regexToCheck);
	let counterPartIndices = SymbolFinder.regexIndicesOf(line, counterPartRegex);

	let allIndices = matchIndices.concat(counterPartIndices);
	allIndices = allIndices.sort(function (a, b) {
		let line = cursorPosition.line;
		let pos1 = new vscode.Position(line, a.start);
		let pos2 = new vscode.Position(line, b.start);
		return pos1.compareTo(pos2);
	}).reverse();

	for (let i = 0; i < allIndices.length; i++) {
		if (matchIndices.includes(allIndices[i])) {
			currentDepth++;
			if (currentDepth === 1) {
				let rangeStart = allIndices[i].start;
				let rangeLength = allIndices[i].symbol.length;
				return new EntryWithRangeInDepth(entryToSearch, new vscode.Range(cursorPosition.with(cursorPosition.line, rangeStart), cursorPosition.with(cursorPosition.line, rangeStart + rangeLength)), currentDepth);
			}
		}
		else {
			currentDepth--;
		}

	}

	return new EntryWithRangeInDepth(entryToSearch, undefined, currentDepth);
}

/**
 * 
 */
function getSymbolInLineWithDepthBehind(line: string, entryToSearch: HighlightEntry, counterPartEntry: HighlightEntry, cursorPosition: vscode.Position, currentDepth: number): EntryWithRangeInDepth {
	let regexToCheck: RegExp = new RegExp(`${Util.makeRegexString(entryToSearch)}`, "g");
	let counterPartRegex: RegExp = new RegExp(`${Util.makeRegexString(counterPartEntry)}`, "g");
	let matchIndices = SymbolFinder.regexIndicesOf(line, regexToCheck);
	let counterPartIndices = SymbolFinder.regexIndicesOf(line, counterPartRegex);

	let allIndices = matchIndices.concat(counterPartIndices);
	allIndices = allIndices.sort(function (a, b) { return new vscode.Position(cursorPosition.line, a.start).compareTo(new vscode.Position(cursorPosition.line, b.start)); });

	for (let i = 0; i < allIndices.length; i++) {
		if (matchIndices.includes(allIndices[i])) {
			currentDepth++;
			if (currentDepth === 1) {
				let rangeStart = allIndices[i].start;
				let rangeLength = allIndices[i].symbol.length;
				return new EntryWithRangeInDepth(entryToSearch, new vscode.Range(cursorPosition.translate(0, rangeStart), cursorPosition.translate(0, rangeStart + rangeLength)), currentDepth);
			}
		}
		else {
			currentDepth--;
		}

	}

	return new EntryWithRangeInDepth(entryToSearch, undefined, currentDepth);
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
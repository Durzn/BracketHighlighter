// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Highlighter from './Highlighter';
import DecorationHandler, { DecorationType } from './DecorationHandler';
import { bracketHighlightGlobals, DecorationStatus, SymbolAndContentRange } from './GlobalsHandler';
import SymbolFinder from './SymbolFinder';
import { EntryWithRange, SymbolWithRange, EntryWithRangeInDepth, Util } from './Util';
import ConfigHandler, { HighlightEntry, HighlightSymbol } from './ConfigHandler';
import { configCache } from './ConfigCache';


export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
}

export function deactivate() { }


/******************************************************************************************************************************************
* Handles the config change event
******************************************************************************************************************************************/
function handleConfigChangeEvent() {
	configCache.onConfigChange();
	removePreviousDecorations();
}

/******************************************************************************************************************************************
* Handles the text selection event
******************************************************************************************************************************************/
function handleTextSelectionEvent() {

	let configuredSymbols = configCache.configuredSymbols;

	/******************************************* Early abort reasons **********************************************************************/
	if (configCache.extensionEnabled === false) {
		return;
	}
	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor === undefined || !activeEditor) {
		return;
	}
	let debugMode = vscode.debug.activeDebugSession;
	if (debugMode !== undefined && configCache.activeWhenDebugging === false) {
		removePreviousDecorations();
		return;
	}
	if (configCache.enabledLanguages.length === 1 && configCache.enabledLanguages.includes("")) {
	}
	else if (configCache.enabledLanguages.includes(activeEditor.document.languageId) === false) {
		return;
	}
	let currentSelection = activeEditor.selection;
	if (bracketHighlightGlobals.lastSelection === undefined) {
		bracketHighlightGlobals.lastSelection = currentSelection;
	}
	if (currentSelection.start !== bracketHighlightGlobals.lastSelection.start) {
		for (let range of bracketHighlightGlobals.ranges) {
			let ranges = range.contentRanges.concat(range.symbolRanges);
			onSelectionChangeEvent(currentSelection, ranges);
		}
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
		let activeSelection = selection.active;
		let lol = findSymbolAtRightOfCursor(activeEditor, activeSelection, configuredSymbols);
		symbolStart = lol.symbolWithRange;
		activeSelection = lol.correctedPosition;
		if (!symbolStart) {
			symbolStart = findSymbolUpwards(activeEditor, activeSelection, configuredSymbols);
		}
		if (symbolStart) {
			/* Move the selection BEHIND the cursor, so the start symbol is not accounted for twice! */
			activeSelection = symbolStart.range.end.translate(0, 1);
			let symbolEnd = findSymbolDownwards(activeEditor, symbolStart.symbol, activeSelection);
			if (symbolEnd) {
				let symbolsToHighlight = [symbolStart.range, symbolEnd.range];
				let startPosition = symbolStart.range.end;
				let endPosition = symbolEnd.range.start;

				/* Fix weird edge case when ranges overlap where single characters would be highlighted according to content colors instead of symbol colors. */
				if (symbolEnd.range.start.character > 0) {
					endPosition = symbolEnd.range.start.translate(0, -1);
				}
				
				let contentToHighlight = [new vscode.Range(startPosition, endPosition)];
				if (configCache.ignoreContent) {
					contentToHighlight = [];
				}

				bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, new DecorationHandler(DecorationType.SYMBOLS), symbolsToHighlight));
				bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, new DecorationHandler(DecorationType.CONTENT), contentToHighlight));
				bracketHighlightGlobals.ranges.push(new SymbolAndContentRange(symbolsToHighlight, contentToHighlight));
			}
		}
	}

	if (bracketHighlightGlobals.ranges.length > 0) {
		bracketHighlightGlobals.decorationStatus = DecorationStatus.active;
	}

	if (configCache.blurOutOfScopeText) {
		let combinedRanges = [];
		for (let highlightPair of bracketHighlightGlobals.ranges) {
			/* Highlighting always consists of startSymbol and endSymbol! */
			combinedRanges.push(new vscode.Range(highlightPair.symbolRanges[0].start, highlightPair.symbolRanges[1].end));
		}
		let blurRanges = getRangesToBlur(activeEditor, combinedRanges);
		for (let rangeToBlur of blurRanges) {
			blurRange(activeEditor, rangeToBlur);
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
function findSymbolAtRightOfCursor(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[]): { symbolWithRange: SymbolWithRange | undefined, correctedPosition: vscode.Position } {
	let line = activeEditor.document.lineAt(selectionStart);
	let selectionRangeText = line.text;
	for (let symbol of configuredSymbols) {
		let indicesOfStartSymbol = SymbolFinder.regexIndicesOf(selectionRangeText, new RegExp(Util.makeRegexString(symbol.startSymbol), "g"));
		let indicesOfEndSymbol = SymbolFinder.regexIndicesOf(selectionRangeText, new RegExp(Util.makeRegexString(symbol.endSymbol), "g"));
		if (indicesOfStartSymbol.length > 0) {
			let indices = indicesOfStartSymbol.map((index) => index.start);
			let symbolLength = indicesOfStartSymbol[0].symbol.length;
			for (let index of indices) {
				let cursorIsLeftOfSymbol = (selectionStart.character >= index) && (selectionStart.character < (index + symbolLength));
				if (cursorIsLeftOfSymbol) {
					let range = new vscode.Range(selectionStart.with(selectionStart.line, index), selectionStart.with(selectionStart.line, index + symbolLength));
					return { symbolWithRange: new SymbolWithRange(symbol, range), correctedPosition: selectionStart };
				}
			}
		}
		if (indicesOfEndSymbol.length > 0) {
			let indices = indicesOfEndSymbol.map((index) => index.start);
			let symbolLength = indicesOfEndSymbol[0].symbol.length;
			for (let index of indices) {
				let cursorIsLeftOfSymbol = (selectionStart.character >= index) && (selectionStart.character < (index + symbolLength));
				if (cursorIsLeftOfSymbol) {
					return { symbolWithRange: undefined, correctedPosition: selectionStart.with(selectionStart.line, index) };
				}
			}
		}
	}

	return { symbolWithRange: undefined, correctedPosition: selectionStart };
}

function getRangesToBlur(activeEditor: vscode.TextEditor, rangesToHighlight: vscode.Range[]): vscode.Range[] {
	let rangesToBlur = [];

	if (rangesToHighlight.length <= 0) {
		return [];
	}
	/* Sort the array, so gaps area easy to fill */
	rangesToHighlight = rangesToHighlight.sort(function (range1, range2) {
		return range1.start.line - range2.start.line;
	});

	/* Blur everything to the first highlight range */
	let startPosition = new vscode.Position(0, 0);
	let endPosition = new vscode.Position(rangesToHighlight[0].start.line, rangesToHighlight[0].start.character);
	rangesToBlur.push(new vscode.Range(startPosition, endPosition));

	/* Blur everything between the highlight ranges */
	let holeIndices: number = rangesToHighlight.length - 1;
	let currentIndex: number = 0;
	while (currentIndex < holeIndices) {
		startPosition = new vscode.Position(rangesToHighlight[currentIndex].end.line, rangesToHighlight[currentIndex].end.character);
		endPosition = new vscode.Position(rangesToHighlight[currentIndex + 1].start.line, rangesToHighlight[currentIndex + 1].start.character);
		rangesToBlur.push(new vscode.Range(startPosition, endPosition));
		currentIndex++;
	}

	/* Blur everything from the last highlight range to the end of the file */
	let lineCount: number = activeEditor.document.lineCount;
	let lastLine: vscode.TextLine = activeEditor.document.lineAt(lineCount - 1);
	startPosition = new vscode.Position(rangesToHighlight[currentIndex].end.line, rangesToHighlight[currentIndex].end.character);
	endPosition = new vscode.Position(lastLine.range.start.line, lastLine.range.end.character);
	rangesToBlur.push(new vscode.Range(startPosition, endPosition));

	return rangesToBlur;
}

/******************************************************************************************************************************************
* Blurs a given range
*	activeEditor: Currently used editor
*	range: Range to blur
******************************************************************************************************************************************/
function blurRange(activeEditor: vscode.TextEditor, range: vscode.Range) {
	let decorationType: vscode.TextEditorDecorationType =
		vscode.window.createTextEditorDecorationType({
			opacity: configCache.opacity
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
		bracketHighlightGlobals.ranges = [];
		bracketHighlightGlobals.decorationTypes = [];
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
			configCache.timeOutValue
		);
	}
	else {
		if (bracketHighlightGlobals.disableTimer !== null) {
			clearTimer();
		}
		setTextSelectionEventHandling(true);
	}
}
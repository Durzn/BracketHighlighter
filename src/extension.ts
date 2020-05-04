// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Highlighter from './Highlighter';
import * as DecorationHandler from './DecorationHandler';
import GlobalsHandler, { bracketHighlightGlobals } from './GlobalsHandler';
import { SearchDirection } from './GlobalsHandler';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';
import ConfigHandler from './ConfigHandler';


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
	if (bracketHighlightGlobals.lastSelection === undefined) {
		bracketHighlightGlobals.lastSelection = currentSelection;
	}
	if (currentSelection.start !== bracketHighlightGlobals.lastSelection.start) {
		onSelectionChangeEvent(currentSelection, bracketHighlightGlobals.lastSelection);
	}
	bracketHighlightGlobals.lastSelection = currentSelection;
	if (bracketHighlightGlobals.handleTextSelectionEventActive === false) {
		return;
	}
	/*************************************************************************************************************************************/


	removePreviousDecorations();
	let rangesForBlur: vscode.Range[] = [];
	let rangesForHighlight: vscode.Range[] = [];
	let startSymbol: { symbol: string, offset: number } = { symbol: "", offset: 0 };
	let counterPartSymbol: string = "";
	for (let selection of activeEditor.selections) {
		startSymbol = getStartSymbolFromPosition(activeEditor, selection.start, 0);
		let scopeRanges = getScopeRanges(activeEditor, selection, startSymbol, counterPartSymbol);
		rangesForHighlight = scopeRanges.highlightRanges;
		rangesForBlur = scopeRanges.blurRanges;
	}
	handleHighlightRanges(activeEditor, rangesForHighlight);
	blurNonHighlightedRanges(activeEditor, rangesForBlur);
}


/******************************************************************************************************************************************
* Gets ranges to highlight and ranges to blur from given selection and symbols
*	activeEditor:
*	selection:
*	startSymbol:
******************************************************************************************************************************************/
function getScopeRanges(activeEditor: vscode.TextEditor, selection: vscode.Selection, startSymbol: { symbol: string, offset: number }, counterPartSymbol: string): { highlightRanges: vscode.Range[], blurRanges: vscode.Range[] } {
	let selectionRange: vscode.Range[] = [];
	let rangesForBlur: vscode.Range[] = [];
	let rangesForHighlight: vscode.Range[] = [];
	let symbolFinder = new SymbolFinder.SymbolFinder();
	if (startSymbol.symbol !== "" && (selection.active.isEqual(selection.anchor))) {
		let symbolHandler = new SymbolHandler.SymbolHandler();
		bracketHighlightGlobals.searchDirection = (symbolHandler.isValidStartSymbol(startSymbol.symbol)) ? SearchDirection.FORWARDS : SearchDirection.BACKWARDS;
		let startPosition = getStartPosition(activeEditor, selection.start, startSymbol.symbol, startSymbol.offset);
		counterPartSymbol = symbolHandler.getCounterPart(startSymbol.symbol);
		selectionRange = symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol.symbol, counterPartSymbol, startPosition);
	}
	else if (bracketHighlightGlobals.highlightScopeFromText === true) {
		let startPosition = selection.start;
		let symbolHandler = new SymbolHandler.SymbolHandler();
		let symbolFinder = new SymbolFinder.SymbolFinder();
		let textLines = activeEditor.document.getText(new vscode.Range(activeEditor.document.positionAt(0), startPosition)).split("\n");
		let symbolData = symbolFinder.findDepth1Backwards(startPosition, textLines, bracketHighlightGlobals.allowedStartSymbols, bracketHighlightGlobals.allowedEndSymbols);
		startSymbol.symbol = symbolData.symbol;
		counterPartSymbol = symbolHandler.getCounterPart(symbolData.symbol);
		bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
		selectionRange = symbolFinder.findMatchingSymbolPosition(activeEditor, symbolData.symbol, counterPartSymbol, symbolData.symbolPosition);
	}
	if (bracketHighlightGlobals.searchDirection === SearchDirection.BACKWARDS) {
		selectionRange = selectionRange.reverse();
	}
	if (bracketHighlightGlobals.ignoreContent) {
		rangesForBlur = rangesForBlur.concat(selectionRange);
		if (bracketHighlightGlobals.searchDirection === SearchDirection.BACKWARDS) {
			rangesForHighlight = rangesForHighlight.concat(filterSymbols(selectionRange, counterPartSymbol.length, startSymbol.symbol.length));
		}
		else {
			rangesForHighlight = rangesForHighlight.concat(filterSymbols(selectionRange, startSymbol.symbol.length, counterPartSymbol.length));
		}
	}
	else {
		rangesForHighlight = rangesForHighlight.concat(selectionRange);
		rangesForBlur = rangesForHighlight;
	}
	return { highlightRanges: rangesForHighlight, blurRanges: rangesForBlur };
}

/******************************************************************************************************************************************
* Gets the indices of given ranges where the line numbers are not contiguous.
*	ranges:
******************************************************************************************************************************************/
function getHoleIndices(ranges: vscode.Range[]): number[] {
	let indices: number[] = [];
	for (let index = 0; index < ranges.length - 1; index++) {
		if (ranges[index + 1].start.line - ranges[index].start.line > 1) {
			indices = indices.concat(index);
		}
	}
	return indices;
}

/******************************************************************************************************************************************
* Blurs a given range
*	activeEditor:
*	range:
******************************************************************************************************************************************/
function blurRange(activeEditor: vscode.TextEditor, range: vscode.Range) {
	let highlighter = new Highlighter.Highlighter();
	let decorationType: vscode.TextEditorDecorationType =
		vscode.window.createTextEditorDecorationType({
			opacity: bracketHighlightGlobals.opactiy
		});
	highlighter.highlightRange(activeEditor, decorationType, range);
	bracketHighlightGlobals.decorationTypes.push(decorationType);
}

/******************************************************************************************************************************************
* Takes ranges which were highlighted and blurs all ranges which weren't highlighted
*	activeEditor:
*	highlightRanges:
******************************************************************************************************************************************/
function blurNonHighlightedRanges(activeEditor: vscode.TextEditor, highlightRanges: vscode.Range[]) {
	if (bracketHighlightGlobals.blurOutOfScopeText === true) {
		if (bracketHighlightGlobals.searchDirection === SearchDirection.BACKWARDS) {
			highlightRanges = highlightRanges.reverse();
		}
		highlightRanges = highlightRanges.sort(function (range1, range2) {
			return range1.start.line - range2.start.line;
		});
		let startPosition = new vscode.Position(0, 0);
		let endPosition = new vscode.Position(highlightRanges[0].start.line, highlightRanges[0].start.character);
		let holeIndices = getHoleIndices(highlightRanges);
		let range: vscode.Range = new vscode.Range(startPosition, endPosition);
		blurRange(activeEditor, range);
		let currentIndex = 0;
		while (currentIndex < holeIndices.length) {
			startPosition = new vscode.Position(highlightRanges[holeIndices[currentIndex]].end.line, highlightRanges[holeIndices[currentIndex]].end.character);
			endPosition = new vscode.Position(highlightRanges[holeIndices[currentIndex] + 1].start.line, highlightRanges[holeIndices[currentIndex] + 1].start.character);
			range = new vscode.Range(startPosition, endPosition);
			blurRange(activeEditor, range);
			currentIndex++;
		}
		let lineCount = activeEditor.document.lineCount;
		let lastLine = activeEditor.document.lineAt(lineCount - 1);
		startPosition = new vscode.Position(highlightRanges[highlightRanges.length - 1].start.line, highlightRanges[highlightRanges.length - 1].end.character);
		endPosition = new vscode.Position(lastLine.range.start.line, lastLine.range.end.character);
		range = new vscode.Range(startPosition, endPosition);
		blurRange(activeEditor, range);
	}
}

/******************************************************************************************************************************************
* Filters all symbols between opening and closing symbols.
*	textRanges:
*	startSymbolLength:
*	counterPartSymbolLength:
******************************************************************************************************************************************/
function filterSymbols(textRanges: vscode.Range[], startSymbolLength: number, counterPartSymbolLength: number): vscode.Range[] {
	let returnRanges: vscode.Range[] = [];
	let startPosition: vscode.Position;
	let endPosition: vscode.Position;
	if (textRanges.length === 0) {
		return []; /* Shouldn't be able to happen */
	}
	else if (textRanges.length === 1) {
		startPosition = textRanges[0].start;
		endPosition = textRanges[0].end;
	}
	else {
		startPosition = textRanges[0].start;
		endPosition = textRanges[textRanges.length - 1].end;
	}
	let endPositionOpeningBracket = startPosition.translate(0, startSymbolLength);
	let startPositionClosingBracket = endPosition.translate(0, -counterPartSymbolLength);

	let startRange = new vscode.Range(startPosition, endPositionOpeningBracket);
	let endRange = new vscode.Range(startPositionClosingBracket, endPosition);
	returnRanges.push(startRange);
	returnRanges.push(endRange);
	return returnRanges;
}

/******************************************************************************************************************************************
* Highlights ranges with the configured decorations
*	activeEditor: Editor containing the ranges
*	textRanges: Ranges to highlight
******************************************************************************************************************************************/
function handleHighlightRanges(activeEditor: vscode.TextEditor, textRanges: vscode.Range[]) {
	let highlighter = new Highlighter.Highlighter();
	let decorationHandler = new DecorationHandler.DecorationHandler();
	let decorationTypes = highlighter.highlightRanges(activeEditor, decorationHandler, textRanges);
	bracketHighlightGlobals.decorationStatus = true;
	for (let decorationType of decorationTypes) {
		bracketHighlightGlobals.decorationTypes.push(decorationType);
	}
}

/******************************************************************************************************************************************
* Removes all previous decorations
******************************************************************************************************************************************/
function removePreviousDecorations() { /* TODO: extend this for multiple editors */
	if (bracketHighlightGlobals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(bracketHighlightGlobals.decorationTypes);
		bracketHighlightGlobals.decorationStatus = false;
	}
}

/******************************************************************************************************************************************
* Gets a valid start symbol and its offset from the given selection. Returns "" if no symbol is found.
*	activeEditor: Editor containting the selectionStart
*	selectionStart: Where searching for symbols shall start
*	functionCount: Number specifying how often the function has been called (used to find symbols around the selectionStart)
******************************************************************************************************************************************/
function getStartSymbolFromPosition(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, functionCount: number): {
	symbol: string, offset: number
} {
	if (functionCount >= 2) {
		return { symbol: "", offset: 0 };
	}
	let symbolHandler = new SymbolHandler.SymbolHandler;
	let validSymbols = symbolHandler.getValidSymbols();
	let longestSymbolLength = validSymbols.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
	let startPosition = new vscode.Position(selectionStart.line, 0);
	let endPosition = new vscode.Position(selectionStart.line, selectionStart.character + longestSymbolLength);
	let selectionLineText = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
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
		if (selectionStart.character === 0) {
			return { symbol: "", offset: 0 };
		}
		return getStartSymbolFromPosition(activeEditor, selectionStart.translate(0, -1), functionCount + 1);
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
	let symbol = selectionSymbol;
	if (symbolHandler.isValidStartSymbol(symbol) || symbolHandler.isValidEndSymbol(symbol)) {
		return { symbol: symbol, offset: -functionCount };
	}
	else {
		if (selectionStart.character === 0) {

			return { symbol: "", offset: 0 };
		}
		return getStartSymbolFromPosition(activeEditor, selectionStart.translate(0, -1), functionCount + 1);
	}
}

/******************************************************************************************************************************************
* 
*	activeEditor: Editor containting the selectionStart
*	selectionStart: 
*	startSymbol: 
*	offset: 
******************************************************************************************************************************************/
function getPositionInTextForwardSearch(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, startSymbol: string, offset: number): vscode.Position {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let internalOffset = -offset;
	let oldSelectionStartPosition: vscode.Position = selectionStart.translate(0, offset);
	let newSelectionStartPosition: vscode.Position = selectionStart.translate(0, offset);
	let startPosition = oldSelectionStartPosition;
	let endPosition = selectionStart;
	if (offset === 0) {
		endPosition = endPosition.translate(0, 1);
	}
	let selectionSymbol: string = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
	let letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
	while (letterIndices.length > 1) {
		if (oldSelectionStartPosition.character > 0) {
			newSelectionStartPosition = oldSelectionStartPosition.translate(0, -1);
			selectionSymbol = activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition)) + selectionSymbol;
			letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
			oldSelectionStartPosition = newSelectionStartPosition;
			internalOffset++;
		}
		else {
			break;
		}
	}
	if (letterIndices.length === 0 && selectionSymbol.length > 0) {
		selectionSymbol = selectionSymbol.slice(1, selectionSymbol.length);
		letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
		return selectionStart.translate(0, -(internalOffset - 1));
	}
	oldSelectionStartPosition = selectionStart;
	while (letterIndices.length > 1) {
		let newSelectionStartPosition = oldSelectionStartPosition.translate(0, 1);
		selectionSymbol = selectionSymbol + activeEditor.document.getText(new vscode.Range(oldSelectionStartPosition, newSelectionStartPosition));
		letterIndices = symbolFinder.findIndicesOfSymbol(startSymbol, selectionSymbol);
		oldSelectionStartPosition = newSelectionStartPosition;
	}
	if (letterIndices.length > 0 && letterIndices[0] !== -1) {
		return selectionStart.translate(0, -letterIndices[0] - internalOffset);
	}

	return oldSelectionStartPosition;
}

/******************************************************************************************************************************************
* 
*	activeEditor:
*	selectionStart:
*	startSymbol:
*	offset:
******************************************************************************************************************************************/
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

/******************************************************************************************************************************************
* 
*	activeEditor:
*	selectionStart:
*	startSymbol:
*	offset:
******************************************************************************************************************************************/
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

/******************************************************************************************************************************************
* Handles the text selection event
*	state: State to toggle to.
******************************************************************************************************************************************/
function setTextSelectionEventHandling(state: boolean) {
	bracketHighlightGlobals.handleTextSelectionEventActive = state;
}

/******************************************************************************************************************************************
* Handles the selection change event. Enables/Disables the extension for a certain amount of time.
******************************************************************************************************************************************/
function onSelectionChangeEvent(currentSelection: vscode.Selection, lastSelection: vscode.Selection) {
	let currentSelectionPos = currentSelection.anchor;
	let lastSelectionPos = lastSelection.anchor;
	if (currentSelectionPos.line === lastSelectionPos.line &&
		(currentSelectionPos.character === lastSelectionPos.character ||
			currentSelectionPos.character === lastSelectionPos.character - 1 ||
			currentSelectionPos.character === lastSelectionPos.character + 1)) {
		if (bracketHighlightGlobals.disableTimer !== null) {
			clearTimeout(bracketHighlightGlobals.disableTimer);
			bracketHighlightGlobals.disableTimer = null;
		}
		setTextSelectionEventHandling(false);
		bracketHighlightGlobals.disableTimer = setTimeout(function () {
			setTextSelectionEventHandling(true);
			bracketHighlightGlobals.lastSelection = undefined;
			handleTextSelectionEvent();
			bracketHighlightGlobals.disableTimer = null;
		}, bracketHighlightGlobals.timeOutValue);
	}
	else {
		if (bracketHighlightGlobals.disableTimer !== null) {
			clearTimeout(bracketHighlightGlobals.disableTimer);
			bracketHighlightGlobals.disableTimer = null;
		}
		setTextSelectionEventHandling(true);
	}
}
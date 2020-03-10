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
	bracketHighlightGlobals.timeOutValue = bracketHighlightGlobals.configHandler.getTimeOutValue();

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
	let rangesToHighlight: vscode.Range[] = [];
	let numberOfSelections = 0;
	for (let selection of activeEditor.selections) {
		numberOfSelections++;
		let startSymbol = getStartSymbolFromPosition(activeEditor, selection.start, 0);
		if (startSymbol.startSymbol !== "" && (selection.active.isEqual(selection.anchor))) {
			let symbolHandler = new SymbolHandler.SymbolHandler();
			if (symbolHandler.isValidStartSymbol(startSymbol.startSymbol)) {
				bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
			}
			else {
				bracketHighlightGlobals.searchDirection = SearchDirection.BACKWARDS;
			}
			let startPosition = getStartPosition(activeEditor, selection.start, startSymbol.startSymbol, startSymbol.offset);
			let counterPartSymbol = symbolHandler.getCounterPart(startSymbol.startSymbol);
			rangesToHighlight = rangesToHighlight.concat(findRangesFromSymbol(activeEditor, startSymbol.startSymbol, counterPartSymbol, startPosition));
		}
		else if (bracketHighlightGlobals.highlightScopeFromText === true) {
			let startPosition = selection.start;
			rangesToHighlight = rangesToHighlight.concat(findRangesFromText(activeEditor, startPosition, bracketHighlightGlobals.allowedStartSymbols, bracketHighlightGlobals.allowedEndSymbols));
		}
	}
	handleHighlightRanges(activeEditor, rangesToHighlight);
	blurNonHighlightedRanges(activeEditor, rangesToHighlight, numberOfSelections);
}

function removeHighlightRangesFromRanges(activeEditor: vscode.TextEditor, highlightRanges: vscode.Range[], allRanges: vscode.Range[]): vscode.Range[] {
	let index = 0;
	for (; index < highlightRanges.length - 1; index++) {
		if (highlightRanges[index].start.line - highlightRanges[index + 1].start.line > 1) {
			break;
		}
	}
	allRanges = allRanges.filter(function (range) {
		if (range.start.line < highlightRanges[index].start.line) {
			return false;
		}
		return true;
	});
	return allRanges;
}

function getHoleIndices(activeEditor: vscode.TextEditor, ranges: vscode.Range[]): number[] {
	let indices: number[] = [];
	for (let index = 0; index < ranges.length - 1; index++) {
		if (ranges[index + 1].start.line - ranges[index].start.line > 1) {
			indices = indices.concat(index);
		}
	}
	return indices;
}

function blurRange(activeEditor: vscode.TextEditor, range: vscode.Range) {
	let highlighter = new Highlighter.Highlighter();
	let decorationType: vscode.TextEditorDecorationType =
		vscode.window.createTextEditorDecorationType({
			opacity: bracketHighlightGlobals.opactiy
		});
	highlighter.highlightRange(activeEditor, decorationType, range);
	bracketHighlightGlobals.decorationTypes.push(decorationType);
}

function blurNonHighlightedRanges(activeEditor: vscode.TextEditor, highlightRanges: vscode.Range[], numberOfSelections: number) {
	if (bracketHighlightGlobals.blurOutOfScopeText === true) {
		if (bracketHighlightGlobals.searchDirection === SearchDirection.BACKWARDS) {
			highlightRanges = highlightRanges.reverse();
		}
		highlightRanges = highlightRanges.sort(function (range1, range2) {
			return range1.start.line - range2.start.line;
		});
		let startPosition = new vscode.Position(0, 0);
		let endPosition = new vscode.Position(highlightRanges[0].start.line, highlightRanges[0].start.character);
		let holeIndices = getHoleIndices(activeEditor, highlightRanges);
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

function findRangesFromText(activeEditor: vscode.TextEditor, startPosition: vscode.Position, allowedStartSymbols: Array<string>, allowedEndSymbols: Array<string>): vscode.Range[] {
	let symbolHandler = new SymbolHandler.SymbolHandler();
	let symbolFinder = new SymbolFinder.SymbolFinder();
	let textLines = activeEditor.document.getText(new vscode.Range(activeEditor.document.positionAt(0), startPosition)).split("\n");
	let symbolData = symbolFinder.findDepth1Backwards(startPosition, textLines, allowedStartSymbols, allowedEndSymbols);
	bracketHighlightGlobals.searchDirection = SearchDirection.FORWARDS;
	return findRangesFromSymbol(activeEditor, symbolData.symbol, symbolHandler.getCounterPart(symbolData.symbol), symbolData.symbolPosition);
}

function handleHighlightRanges(activeEditor: vscode.TextEditor, textRanges: vscode.Range[]) {
	let highlighter = new Highlighter.Highlighter();
	let decorationHandler = new DecorationHandler.DecorationHandler();
	let decorationTypes = highlighter.highlightRanges(activeEditor, decorationHandler, textRanges);
	bracketHighlightGlobals.decorationStatus = true;
	for (let decorationType of decorationTypes) {
		bracketHighlightGlobals.decorationTypes.push(decorationType);
	}
}

function findRangesFromSymbol(activeEditor: vscode.TextEditor, startSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): vscode.Range[] {
	let symbolFinder = new SymbolFinder.SymbolFinder();
	return symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol, counterPartSymbol, startPosition);
}

function removePreviousDecorations() { /* TODO: extend this for multiple editors */
	if (bracketHighlightGlobals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(bracketHighlightGlobals.decorationTypes);
		bracketHighlightGlobals.decorationStatus = false;
	}
}

function getStartSymbolFromPosition(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, functionCount: number): {
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
		if (selectionStart.character === 0) {
			return { startSymbol: "", offset: 0 };
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
	let startSymbol = selectionSymbol;
	if (symbolHandler.isValidStartSymbol(startSymbol) || symbolHandler.isValidEndSymbol(startSymbol)) {
		return { startSymbol: startSymbol, offset: -functionCount };
	}
	else {
		if (selectionStart.character === 0) {

			return { startSymbol: "", offset: 0 };
		}
		return getStartSymbolFromPosition(activeEditor, selectionStart.translate(0, -1), functionCount + 1);
	}
}

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

function setTextSelectionEventHandling(state: boolean) {
	bracketHighlightGlobals.handleTextSelectionEventActive = state;
}

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
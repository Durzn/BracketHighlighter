// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Highlighter from './Highlighter';
import * as DecorationHandler from './DecorationHandler';
import * as GlobalsHandler from './GlobalsHandler';
import { SearchDirection } from './GlobalsHandler';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';
import * as ConfigHandler from './ConfigHandler';
import HighlightRange from './HighlightRange';

var globals = new GlobalsHandler.GlobalsHandler(new DecorationHandler.DecorationHandler());

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
	vscode.window.onDidChangeTextEditorVisibleRanges(handleVisibleRangesChangeEvent);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getHighlightedRangesInView(highlightRanges: Array<HighlightRange>, visibleRange: vscode.Range): Array<HighlightRange> {
	let isContained = false;
	let startIndex = 0;
	let endIndex = 0;
	/* Search first contained highlight range */
	for (startIndex = 0; startIndex < highlightRanges.length; startIndex++) {
		isContained = isHighlightRangeInRange(highlightRanges[startIndex], visibleRange);
		if (isContained === true) {
			break;
		}
	}
	/* Find all contained highlight ranges */
	for (endIndex = startIndex; endIndex < highlightRanges.length; endIndex++) {
		isContained = isHighlightRangeInRange(highlightRanges[endIndex], visibleRange);
		if (isContained === false) {
			break;
		}
	}
	let containedRanges: Array<HighlightRange> = [];
	for (let i = startIndex; i < endIndex; i++) {
		containedRanges.push(highlightRanges[i]);
	}
	return containedRanges;
}

function isHighlightRangeInRange(highlightRange: HighlightRange, visibleRange: vscode.Range): boolean {
	if (highlightRange.decorationRange.start.line >= visibleRange.start.line && highlightRange.decorationRange.end.line <= visibleRange.end.line) {
		return true;
	}
	return false;
}

function isHighlightRangeInHighlightRanges(range1: HighlightRange, range2: Array<HighlightRange>): boolean {
	for (let visibleRange of range2) {
		let decorationRange = range1.decorationRange;
		if (decorationRange.start.line >= visibleRange.decorationRange.start.line && decorationRange.end.line <= visibleRange.decorationRange.end.line) {
			return true;
		}
	}
	return false;
}

function getNewlyVisibleRanges(currentRanges: Array<HighlightRange>, containedRanges: Array<HighlightRange>): Array<HighlightRange> {
	let newRanges: Array<HighlightRange> = [];
	for (let containedRange of containedRanges) {
		if (isHighlightRangeInHighlightRanges(containedRange, currentRanges) === false) {
			newRanges.push(containedRange);
		}
	}
	return newRanges;
}

function handleVisibleRangesChangeEvent() {
	let activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		return;
	}
	let configHandler = new ConfigHandler.ConfigHandler();
	if (activeEditor.visibleRanges === undefined) {
		return;
	}
	let visibleRange = activeEditor.visibleRanges[0];
	let additionalLines = 12;
	let visibleRangeStart = visibleRange.start;
	if (additionalLines < visibleRange.start.line) {
		visibleRangeStart = visibleRange.start.translate(-additionalLines, 0);
	}
	else {
		visibleRangeStart.with(0, 0);
	}
	let visibleRangeEnd = visibleRange.end.translate(additionalLines, 0);
	visibleRange = new vscode.Range(visibleRangeStart, visibleRangeEnd);
	let highlighter = new Highlighter.Highlighter();
	let highlightedRangesInView = getHighlightedRangesInView(globals.highlightedRanges, visibleRange);
	let rangesToDecorate = getNewlyVisibleRanges(globals.currentlyHighlightedRanges, highlightedRangesInView);
	let rangesToUndecorate = getNewlyVisibleRanges(highlightedRangesInView, globals.currentlyHighlightedRanges);
	for (let rangeToUndecorate of rangesToUndecorate) {
		let removeIndex = globals.currentlyHighlightedRanges.indexOf(rangeToUndecorate);
		if (removeIndex !== -1) {
			globals.currentlyHighlightedRanges.splice(removeIndex, 1);
			highlighter.removeHighlight(rangeToUndecorate.decorationType);
		}
	}
	for (let rangeToDecorate of rangesToDecorate) {
		let tempRangesToDecorate = [rangeToDecorate];
		highlighter.highlightRanges(activeEditor, globals.decorationHandler, tempRangesToDecorate);
		globals.currentlyHighlightedRanges.push(rangeToDecorate);
	}
	if (configHandler.blurOutOfScopeText() === true) {
		handleBlurredText(activeEditor, highlightedRangesInView, visibleRange);
	}
	if (globals.currentlyHighlightedRanges.length > 0) {

		globals.decorationStatus = true;
	}
}

function handleBlurredText(activeEditor: vscode.TextEditor, highlightedRangesInView: Array<HighlightRange>, visibleRange: vscode.Range) {
	let highlighter = new Highlighter.Highlighter();
	highlighter.removeHighlights(globals.blurredRanges);
	globals.blurredRanges = [];
	if (highlightedRangesInView.length === 0 && globals.decorationStatus === true) {
		let blurredRange = new vscode.Range(visibleRange.start, visibleRange.end);
		changeOpacityForRange(activeEditor, blurredRange);
	}
	else {
		if (visibleRange.start.line < highlightedRangesInView[0].decorationRange.start.line) {
			let startPosition = visibleRange.start;
			let endPosition = highlightedRangesInView[0].decorationRange.start;
			let textRangeBegin = new vscode.Range(startPosition, endPosition);
			changeOpacityForRange(activeEditor, textRangeBegin);
		}
		if (highlightedRangesInView[highlightedRangesInView.length - 1].decorationRange.end.line <= visibleRange.end.line) {
			let startPosition = highlightedRangesInView[highlightedRangesInView.length - 1].decorationRange.end;
			let endPosition = visibleRange.end;
			let textRangeEnd = new vscode.Range(startPosition, endPosition);
			changeOpacityForRange(activeEditor, textRangeEnd);
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

function handleTextSelectionEvent() {
	let debugMode = vscode.debug.activeDebugSession;
	let configHandler = new ConfigHandler.ConfigHandler();
	if (debugMode !== undefined && configHandler.activeWhenDebugging() === false) {
		removePreviousDecorations();
		return;
	}
	let activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
		return;
	}
	let fileLanguageId: string = activeEditor.document.languageId;
	if (configHandler.isLanguageEnabled(fileLanguageId) === false) {
		return;
	}
	removePreviousDecorations();
	let selection = activeEditor.selection;
	let selectionText = getTextAroundSelection(activeEditor, selection);
	let startSymbol = extractStartSymbol(selectionText);
	if (startSymbol !== "" && selectionText.length <= 2) {
		let symbolHandler = new SymbolHandler.SymbolHandler();
<<<<<<< Updated upstream
=======
		if (symbolHandler.isValidStartSymbol(startSymbol)) {
			globals.searchDirection = GlobalsHandler.SearchDirection.FORWARDS;
		}
		else {
			globals.searchDirection = GlobalsHandler.SearchDirection.BACKWARDS;
		}
		let startPosition = getStartPosition(selection, selectionText, startSymbol);
		let highlighter = new Highlighter.Highlighter();
		let decorationHandler = new DecorationHandler.DecorationHandler();
>>>>>>> Stashed changes
		let symbolFinder = new SymbolFinder.SymbolFinder();
		let counterPartSymbol = symbolHandler.getCounterPart(startSymbol);
		let textRanges: Array<vscode.Range> = symbolFinder.findMatchingSymbolPosition(activeEditor, startSymbol, counterPartSymbol, startPosition);
		if (symbolHandler.isValidEndSymbol(startSymbol) === true) {
			globals.searchDirection = SearchDirection.BACKWARDS;
			textRanges = textRanges.reverse();
		}
<<<<<<< Updated upstream
		else {
			globals.searchDirection = SearchDirection.FORWARDS;
		}
		let highlightRanges = [];
		for (let textRange of textRanges) {
			highlightRanges.push(new HighlightRange(textRange, globals.decorationHandler.getDecorationType()));
=======

		if (configHandler.blurOutOfScopeText() === true) {
			if (globals.searchDirection === GlobalsHandler.SearchDirection.BACKWARDS) {
				textRanges = textRanges.reverse();
			}
			let textRangeBegin = new vscode.Range(activeEditor.document.positionAt(0), textRanges[0].start);
			let textRangeEnd = new vscode.Range(textRanges[textRanges.length - 1].end, activeEditor.document.positionAt(activeEditor.document.getText().length));
			changeOpacityForRange(activeEditor, textRangeBegin);
			changeOpacityForRange(activeEditor, textRangeEnd);
>>>>>>> Stashed changes
		}
		globals.highlightedRanges = highlightRanges;
		handleVisibleRangesChangeEvent();
	}
}

function changeOpacityForRange(activeEditor: vscode.TextEditor, textRange: vscode.Range): void {
	let configHandler = new ConfigHandler.ConfigHandler();
	let decorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
		opacity: configHandler.getOpacity()
	});
	let highlighter = new Highlighter.Highlighter();
	let highlightRange = new HighlightRange(textRange, decorationType);
	highlighter.highlightRange(activeEditor, decorationType, highlightRange);
	globals.blurredRanges.push(highlightRange);
}

function removePreviousDecorations() {
	if (globals.decorationStatus === true) {
		let highlighter = new Highlighter.Highlighter();
		highlighter.removeHighlights(globals.currentlyHighlightedRanges);
		highlighter.removeHighlights(globals.blurredRanges);
		globals.decorationStatus = false;
		globals.highlightedRanges = [];
		globals.currentlyHighlightedRanges = [];
		globals.blurredRanges = [];
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
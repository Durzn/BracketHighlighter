// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Highlighter from './Highlighter';
import DecorationHandler, { DecorationType } from './DecorationHandler';
import { bracketHighlightGlobals, DecorationStatus, RangeIndex, SymbolAndContentRange } from './GlobalsHandler';
import SymbolFinder from './SymbolFinder';
import { EntryWithRange, SymbolWithRange, EntryWithRangeInDepth, Util } from './Util';
import ConfigHandler, { HighlightEntry, HighlightSymbol } from './ConfigHandler';
import { configCache } from './ConfigCache';
import ActionHandler from './ActionHandler';


export function activate(context: vscode.ExtensionContext) {
	let actionHandler = new ActionHandler();
	let onToggleExtensionStatusDisposable = vscode.commands.registerCommand('BracketHighlighter.toggleExtensionStatus', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onActivateHotkey(editor);
		}
		removePreviousDecorations();
	});
	let onJumpOutOfOpeningSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpOutOfOpeningSymbol', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onJumpOutOfOpeningSymbolHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	let onJumpOutOfClosingSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpOutOfClosingSymbol', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onJumpOutOfClosingSymbolHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	let onJumpToOpeningSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpToOpeningSymbol', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onJumpToOpeningSymbolHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	let onJumpToClosingSymbolDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpToClosingSymbol', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onJumpToClosingSymbolHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	let onjumpBetweenOpeningAndClosingSymbolsDisposable = vscode.commands.registerCommand('BracketHighlighter.jumpBetweenOpeningAndClosingSymbols', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	let onSelectTextBetweenSymbols = vscode.commands.registerCommand('BracketHighlighter.selectTextInSymbols', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			actionHandler.onSelectTextBetweenSymbolsHotkey(editor, bracketHighlightGlobals.ranges);
		}
	});
	vscode.workspace.onDidChangeConfiguration(handleConfigChangeEvent);
	vscode.window.onDidChangeTextEditorSelection(handleTextSelectionEvent);
	context.subscriptions.push(onToggleExtensionStatusDisposable);
	context.subscriptions.push(onJumpOutOfOpeningSymbolDisposable);
	context.subscriptions.push(onJumpOutOfClosingSymbolDisposable);
	context.subscriptions.push(onJumpToOpeningSymbolDisposable);
	context.subscriptions.push(onJumpToClosingSymbolDisposable);
	context.subscriptions.push(onjumpBetweenOpeningAndClosingSymbolsDisposable);
	context.subscriptions.push(onSelectTextBetweenSymbols);
}

export function deactivate() { }


/******************************************************************************************************************************************
* Handles the config change event
******************************************************************************************************************************************/
function handleConfigChangeEvent() {
	configCache.onConfigChange();
	removePreviousDecorations();
}

function preconditionsFulfilled(): boolean {

	let configuredSymbols = configCache.configuredSymbols;
	let activeEditor = vscode.window.activeTextEditor;
	let debugMode = vscode.debug.activeDebugSession;

	if (!activeEditor) {
		return false;
	}

	if (configCache.extensionEnabled === false) {
		return false;
	}
	if (debugMode !== undefined && configCache.activeWhenDebugging === false) {
		return false;
	}
	if (configCache.enabledLanguages.length === 1 && configCache.enabledLanguages.includes("")) {
	}
	else if (configCache.enabledLanguages.includes(activeEditor.document.languageId) === false) {
		return false;
	}
	if (bracketHighlightGlobals.handleTextSelectionEventActive === false) {
		return false;
	}
	if (configuredSymbols.length <= 0) {
		return false;
	}

	return true;
}

/******************************************************************************************************************************************
* Handles the text selection event
******************************************************************************************************************************************/
function handleTextSelectionEvent() {

	if (!preconditionsFulfilled()) {
		return;
	}

	let activeEditor = vscode.window.activeTextEditor!; /* Assured not to be undefined by preconditions */
	let configuredSymbols = configCache.configuredSymbols;
	let currentSelection = activeEditor.selection;
	bracketHighlightGlobals.lastSelection = currentSelection;

	if (currentSelection.start !== bracketHighlightGlobals.lastSelection.start) {
		for (let range of bracketHighlightGlobals.ranges) {
			let ranges: vscode.Range[] = range.symbolRanges;
			if (range.contentRange) {
				ranges = ranges.concat(range.contentRange);
			}
			onSelectionChangeEvent(currentSelection, ranges);
		}
	}


	removePreviousDecorations();

	for (let selection of activeEditor.selections) {
		let symbolStart: SymbolWithRange | undefined = undefined;
		let activeSelection = selection.active;
		let startSymbolObj = SymbolFinder.findSymbolAtCursor(activeEditor, activeSelection, configuredSymbols, configCache.isInsideOfOpeningSymbolIgnored, configCache.isInsideOfClosingSymbolIgnored);
		symbolStart = startSymbolObj.symbolWithRange;
		activeSelection = startSymbolObj.correctedPosition;
		if (!symbolStart) {
			if (configCache.highlightScopeFromText || startSymbolObj.overrideScopeSearch) {
				symbolStart = SymbolFinder.findSymbolUpwards(activeEditor, activeSelection, configuredSymbols, configCache.maxLineSearchCount);
			}
		}
		if (symbolStart) {
			/* Move the selection BEHIND the cursor, so the start symbol is not accounted for twice! */
			activeSelection = symbolStart.range.end.translate(0, 1);
			let symbolEnd = SymbolFinder.findSymbolDownwards(activeEditor, symbolStart.symbol, activeSelection, configCache.maxLineSearchCount);
			if (symbolEnd) {
				let symbolsToHighlight = [symbolStart.range, symbolEnd.range];
				let startPosition = symbolStart.range.end;
				let endPosition = symbolEnd.range.start;

				let contentToHighlight: vscode.Range | undefined = new vscode.Range(startPosition, endPosition);
				bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, new DecorationHandler(DecorationType.SYMBOLS), symbolsToHighlight));

				if (configCache.ignoreContent) {
					contentToHighlight = undefined;
				}
				else {
					bracketHighlightGlobals.decorationTypes = bracketHighlightGlobals.decorationTypes.concat(Highlighter.highlightRanges(activeEditor, new DecorationHandler(DecorationType.CONTENT), [contentToHighlight]));
				}

				let symbolPair = new SymbolAndContentRange([symbolStart.range, symbolEnd.range], contentToHighlight);
				let rangeAlreadyIncluded: boolean = bracketHighlightGlobals.ranges.some(pair => pair.symbolRanges[0]?.isEqual(symbolPair.symbolRanges[0]) && pair.symbolRanges[1]?.isEqual(symbolPair.symbolRanges[1]));
				/* Prevent the same symbol pairs being added twice */
				if (!rangeAlreadyIncluded) {
					bracketHighlightGlobals.ranges.push(symbolPair);
				}
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
			combinedRanges.push(new vscode.Range(highlightPair.symbolRanges[RangeIndex.OPENSYMBOL].start, highlightPair.symbolRanges[RangeIndex.CLOSESYMBOL].end));
		}
		let blurRanges = getRangesToBlur(activeEditor, combinedRanges);
		for (let rangeToBlur of blurRanges) {
			blurRange(activeEditor, rangeToBlur);
		}
	}
}


function getRangesToBlur(activeEditor: vscode.TextEditor, rangesToHighlight: vscode.Range[]): vscode.Range[] {
	let rangesToBlur = [];

	if (rangesToHighlight.length <= 0) {
		return [];
	}
	/* Sort the array, so gaps area easy to fill */
	rangesToHighlight = rangesToHighlight.sort((range1: vscode.Range, range2: vscode.Range) => {
		return range1.start.compareTo(range2.start);
	});

	/* Blur everything to the first highlight range */
	let startPosition = new vscode.Position(0, 0);
	let endPosition = new vscode.Position(rangesToHighlight[0].start.line, rangesToHighlight[0].start.character);
	rangesToBlur.push(new vscode.Range(startPosition, endPosition));

	/* Blur everything between the highlight ranges */
	let holeIndices: number = rangesToHighlight.length - 1;
	let currentIndex: number = 0;
	for (; currentIndex < holeIndices; currentIndex++) {
		startPosition = rangesToHighlight[currentIndex].end;
		endPosition = rangesToHighlight[currentIndex + 1].start;
		rangesToBlur.push(new vscode.Range(startPosition, endPosition));
	}

	/* Blur everything from the last highlight range to the end of the file */
	let lineCount: number = activeEditor.document.lineCount;
	let lastLine: vscode.TextLine = activeEditor.document.lineAt(lineCount - 1);
	startPosition = rangesToHighlight[currentIndex].end;
	endPosition = lastLine.range.end;
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
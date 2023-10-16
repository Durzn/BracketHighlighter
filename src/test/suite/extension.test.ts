import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { handleTextSelectionEvent } from '../../extension';
import { SymbolAndContentRange, bracketHighlightGlobals } from '../../GlobalsHandler';
import { ConfiguredSymbols } from './ConfiguredSymbols';
import ConfigCache, { configCache } from '../../ConfigCache';

suite('The Extension will search at the cursor and ', () => {

    function executeContentTest(cache: ConfigCache) {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        configCache.ignoreContent = cache.ignoreContent;
        configCache.configuredSymbols = cache.configuredSymbols;

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(12, 0), new vscode.Position(12, 0));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[1]; /* 'cat' symbol expected */
        let rangeOpen = new vscode.Range(new vscode.Position(12, 0), new vscode.Position(12, symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(15, 0), new vscode.Position(15, symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    }

    test('highlight the correct range', () => {
        let cache = new ConfigCache();
        cache.configuredSymbols = ConfiguredSymbols;
        cache.ignoreContent = false;
        executeContentTest(cache);
    });


    test('highlight the correct range without its content in a normal scope.', () => {
        let cache = new ConfigCache();
        cache.configuredSymbols = ConfiguredSymbols;
        cache.ignoreContent = true;
        executeContentTest(cache);
    });

    test('highlight the correct range even if it is in the very first line of the file.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(0, 3), new vscode.Position(0, 3));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[0]; /* '/*' symbol expected */
        assert(symbol.startSymbol.canBeSubstring);
        let rangeOpen = new vscode.Range(new vscode.Position(0, 3), new vscode.Position(0, 3 + symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(1, 6), new vscode.Position(1, 6 + symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });


    test('highlight the correct range if the symbol is allowed to be a substring.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(0, 3), new vscode.Position(0, 3));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[0]; /* '/*' symbol expected */
        assert(symbol.startSymbol.canBeSubstring);
        let rangeOpen = new vscode.Range(new vscode.Position(0, 3), new vscode.Position(0, 3 + symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(1, 6), new vscode.Position(1, 6 + symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range if the symbol is a regular expression.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(4, 0), new vscode.Position(4, 0));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[8]; /* '\\bdo\\b(?!:)' symbol expected */
        assert(symbol.startSymbol.isRegex);
        let rangeOpen = new vscode.Range(new vscode.Position(4, 0), new vscode.Position(4, 2));
        let rangeClose = new vscode.Range(new vscode.Position(9, 0), new vscode.Position(9, 3));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range if the symbol is a regular expression and supports multiple ending symbols.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(17, 0), new vscode.Position(17, 0));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[7]; /* 'pthread_mutex_lock' symbol expected */
        assert(symbol.startSymbol.isRegex);
        let rangeOpen = new vscode.Range(new vscode.Position(17, 0), new vscode.Position(17, 18));
        let rangeClose = new vscode.Range(new vscode.Position(21, 0), new vscode.Position(21, 20));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });
});

suite('The Extension will search from the scope ', () => {

    test('highlight the correct range', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(63, 7), new vscode.Position(63, 7));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[0]; /* '/*' symbol expected */
        assert(symbol.startSymbol.canBeSubstring);
        let rangeOpen = new vscode.Range(new vscode.Position(62, 0), new vscode.Position(62, symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(64, 0), new vscode.Position(64, symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range even if it is in the very first line of the file.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(0, 8), new vscode.Position(0, 8));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[0]; /* '/*' symbol expected */
        assert(symbol.startSymbol.canBeSubstring);
        let rangeOpen = new vscode.Range(new vscode.Position(0, 3), new vscode.Position(0, 3 + symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(1, 6), new vscode.Position(1, 6 + symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });


    test('highlight the correct range if the symbol is allowed to be a substring.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(52, 38), new vscode.Position(52, 38));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[5]; /* '(' symbol expected */
        assert(symbol.startSymbol.canBeSubstring);
        let rangeOpen = new vscode.Range(new vscode.Position(52, 32), new vscode.Position(52, 32 + symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(52, 57), new vscode.Position(52, 57 + symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range if the symbol is a regular expression.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(5, 7), new vscode.Position(5, 7));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[8]; /* '\\bdo\\b(?!:)' symbol expected */
        assert(symbol.startSymbol.isRegex);
        let rangeOpen = new vscode.Range(new vscode.Position(4, 0), new vscode.Position(4, 2));
        let rangeClose = new vscode.Range(new vscode.Position(9, 0), new vscode.Position(9, 3));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range if the symbol is a regular expression and supports multiple ending symbols.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(19, 9), new vscode.Position(19, 9));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[7]; /* 'pthread_mutex_lock' symbol expected */
        assert(symbol.startSymbol.isRegex);
        let rangeOpen = new vscode.Range(new vscode.Position(18, 3), new vscode.Position(18, 21));
        let rangeClose = new vscode.Range(new vscode.Position(20, 3), new vscode.Position(20, 21));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });

    test('highlight the correct range if there are multiple configured symbols on the same line.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart: vscode.Selection = new vscode.Selection(new vscode.Position(67, 57), new vscode.Position(67, 57));

        /* Expectation setup */
        let symbol = ConfiguredSymbols[4]; /* '{' symbol expected */
        let rangeOpen = new vscode.Range(new vscode.Position(67, 15), new vscode.Position(67, 15 + symbol.startSymbol.symbol.length));
        let rangeClose = new vscode.Range(new vscode.Position(67, 109), new vscode.Position(67, 109 + symbol.endSymbol.symbol.length));
        let expectedRange: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen, rangeClose],
            undefined);

        /* Execution */
        editor.selection = selectionStart;
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges[0], expectedRange);
    });
});



suite('The Extension will work with multiple cursors ', () => {

    test('and highlight each range', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        configCache.configuredSymbols = ConfiguredSymbols;
        configCache.ignoreContent = true;
        let selectionStart1: vscode.Selection = new vscode.Selection(new vscode.Position(41, 10), new vscode.Position(41, 10));
        let selectionStart2: vscode.Selection = new vscode.Selection(new vscode.Position(47, 10), new vscode.Position(47, 10));

        /* Expectation setup */
        let symbol1 = ConfiguredSymbols[3]; /* 'do' symbol expected */
        let symbol2 = ConfiguredSymbols[4]; /* '{' symbol expected */
        let rangeOpen1 = new vscode.Range(new vscode.Position(39, 0), new vscode.Position(39, symbol1.startSymbol.symbol.length));
        let rangeClose1 = new vscode.Range(new vscode.Position(44, 0), new vscode.Position(44, symbol1.endSymbol.symbol.length));
        let expectedRange1: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen1, rangeClose1],
            undefined);
        let rangeOpen2 = new vscode.Range(new vscode.Position(46, 0), new vscode.Position(46, symbol2.startSymbol.symbol.length));
        let rangeClose2 = new vscode.Range(new vscode.Position(48, 0), new vscode.Position(48, symbol2.endSymbol.symbol.length));
        let expectedRange2: SymbolAndContentRange = new SymbolAndContentRange(
            [rangeOpen2, rangeClose2],
            undefined);

        /* Execution */
        editor.selections = [selectionStart1, selectionStart2];
        handleTextSelectionEvent();

        /* Asserts */
        let activeRanges = bracketHighlightGlobals.activeRanges;
        assert.deepStrictEqual(activeRanges, [expectedRange1, expectedRange2]);
    });
});
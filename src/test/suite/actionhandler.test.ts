import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import ActionHandler from '../../ActionHandler';
import { SymbolAndContentRange } from '../../GlobalsHandler';
import { HighlightEntry, HighlightSymbol, JumpBetweenStrategy } from '../../ConfigHandler';
// import * as myExtension from '../extension';

suite('ActionHandler will correctly', () => {

    test('jump out of the opening symbol.', () => {
        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);

        /* Execution */
        handler.onJumpOutOfOpeningSymbolHotkey(editor, ranges);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump out of the closing symbol.', () => {
        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolEndRange.end, symbolEndRange.end);

        /* Execution */
        handler.onJumpOutOfClosingSymbolHotkey(editor, ranges);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the opening symbol.', () => {
        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolStartRange.end, symbolStartRange.end);

        /* Execution */
        handler.onJumpToOpeningSymbolHotkey(editor, ranges);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the closing symbol.', () => {
        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);

        /* Execution */
        handler.onJumpToClosingSymbolHotkey(editor, ranges);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('select all the text between symbols.', () => {
        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(contentRange.end, contentRange.start);

        /* Execution */
        handler.onSelectTextBetweenSymbolsHotkey(editor, ranges);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the inner side of the opening/closing symbol.', () => {

        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 2));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        let configuredSymbols: HighlightSymbol[] = [new HighlightSymbol(new HighlightEntry("/*", false, true), new HighlightEntry("*/", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);

        /* Execution */
        editor.selection = new vscode.Selection(symbolStartRange.end, symbolStartRange.end);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges, configuredSymbols);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the start of the opening/closing symbol as default strategy.', () => {

        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 2));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        let configuredSymbols: HighlightSymbol[] = [new HighlightSymbol(new HighlightEntry("/*", false, true), new HighlightEntry("*/", false, true), JumpBetweenStrategy.TO_SYMBOL_START)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);

        /* Execution */
        editor.selection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges, configuredSymbols);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the outer side of the opening/closing symbol.', () => {

        /* Environment */
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 2));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        let configuredSymbols: HighlightSymbol[] = [new HighlightSymbol(new HighlightEntry("/*", false, true), new HighlightEntry("*/", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE)];

        /* Expectation setup */
        let expectedSelection = new vscode.Selection(symbolEndRange.end, symbolEndRange.end);

        /* Execution */
        editor.selection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges, configuredSymbols);

        /* Asserts */
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });
});
import * as assert from 'assert';
import * as vscode from 'vscode';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import SymbolFinder from '../../SymbolFinder';
import { EntryWithRange, SymbolWithIndex, SymbolWithRange, Util } from '../../Util';
import { HighlightEntry, HighlightSymbol, JumpBetweenStrategy } from '../../ConfigHandler';
import { ConfiguredSymbols } from './ConfiguredSymbols';

suite('SymbolFinder will correctly', () => {
    test('find all indices of a RegExp in a given string.', () => {
        /* Environment */

        /* Setup */
        let testString = "/* test string /* asd */";
        let regex = new RegExp(Util.escapeSymbol("/*"), "g");

        /* Expectation setup */
        let expectedSymbols: SymbolWithIndex[] = [new SymbolWithIndex("/*", 0), new SymbolWithIndex("/*", 15)];

        /* Execution */
        let result: SymbolWithIndex[] = SymbolFinder.regexIndicesOf(testString, regex);

        /* Asserts */
        assert.deepStrictEqual(result, expectedSymbols);
    });
});

suite('SymbolFinder upwards search will correctly', () => {

    test('find the correct symbol  when the cursor is on the inside of the symbol.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let selectionStart: vscode.Position = new vscode.Position(27, 1);
        let maxLineSearchCount = 1000;

        /* Expectation setup */
        let expectedSymbol: SymbolWithRange = new SymbolWithRange(
            new HighlightSymbol(new HighlightEntry("{", false, true),
                new HighlightEntry("}", false, true),
                JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
            new vscode.Range(new vscode.Position(27, 0), new vscode.Position(27, 1))
        );

        /* Execution */
        let result: SymbolWithRange | undefined = SymbolFinder.findSymbolUpwards(editor, selectionStart, ConfiguredSymbols, maxLineSearchCount);

        /* Asserts */
        assert.notStrictEqual(result, undefined);
        assert.deepStrictEqual(result, expectedSymbol);
    });

    test('find the correct symbol search when in a nested scope', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let selectionStart: vscode.Position = new vscode.Position(7, 0);
        let maxLineSearchCount = 1000;

        /* Expectation setup */
        let expectedSymbol: SymbolWithRange = new SymbolWithRange(
            new HighlightSymbol(new HighlightEntry("{", false, true),
                new HighlightEntry("}", false, true),
                JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
            new vscode.Range(new vscode.Position(6, 4), new vscode.Position(6, 5))
        );

        /* Execution */
        let result: SymbolWithRange | undefined = SymbolFinder.findSymbolUpwards(editor, selectionStart, ConfiguredSymbols, maxLineSearchCount);

        /* Asserts */
        assert.notStrictEqual(result, undefined);
        assert.deepStrictEqual(result, expectedSymbol);
    });
});

suite('SymbolFinder downwards search will correctly', () => {

    test('find the correct symbol.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let selectionStart: vscode.Position = new vscode.Position(12, 3);
        let maxLineSearchCount = 1000;

        /* Expectation setup */
        let expectedRange = new vscode.Range(new vscode.Position(15, 0), new vscode.Position(15, 3));
        let expectedEntry: EntryWithRange = new EntryWithRange(
            new HighlightEntry("dog", false, false),
            expectedRange
        );
        let expectedSymbol: SymbolWithRange = new SymbolWithRange(
            new HighlightSymbol(new HighlightEntry("cat", false, false),
                new HighlightEntry("dog", false, false),
                JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
            expectedRange
        );

        /* Execution */
        let result: EntryWithRange | undefined = SymbolFinder.findSymbolDownwards(editor, expectedSymbol.symbol, selectionStart, maxLineSearchCount);

        /* Asserts */
        assert.notStrictEqual(result, undefined);
        assert.deepStrictEqual(result, expectedEntry);
    });

    test('find the correct symbol in a nested scope', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let selectionStart: vscode.Position = new vscode.Position(7, 5);
        let maxLineSearchCount = 1000;

        /* Expectation setup */
        let expectedRange = new vscode.Range(new vscode.Position(8, 4), new vscode.Position(8, 5));
        let expectedEntry: EntryWithRange = new EntryWithRange(
            new HighlightEntry("}", false, true),
            expectedRange
        );
        let expectedSymbol: SymbolWithRange = new SymbolWithRange(
            new HighlightSymbol(new HighlightEntry("{", false, true),
                new HighlightEntry("}", false, true),
                JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
            expectedRange
        );

        /* Execution */
        let result: EntryWithRange | undefined = SymbolFinder.findSymbolDownwards(editor, expectedSymbol.symbol, selectionStart, maxLineSearchCount);

        /* Asserts */
        assert.notStrictEqual(result, undefined);
        assert.deepStrictEqual(result, expectedEntry);
    });
});
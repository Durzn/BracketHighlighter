import * as assert from 'assert';
import * as vscode from 'vscode';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import SymbolFinder from '../../SymbolFinder';
import { SymbolWithIndex, SymbolWithRange, Util } from '../../Util';
import { HighlightEntry, HighlightSymbol, JumpBetweenStrategy } from '../../ConfigHandler';


let configuredSymbols: HighlightSymbol[] = [
    new HighlightSymbol(new HighlightEntry("/*", false, true), new HighlightEntry("*/", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("cat", false, false), new HighlightEntry("dog", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("start", false, false), new HighlightEntry("stop", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("do", false, false), new HighlightEntry("end", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("{", false, true), new HighlightEntry("}", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("(", false, true), new HighlightEntry(")", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("[", false, true), new HighlightEntry("]", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE)];

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

    test('find the correct symbol on the upwards search when.', () => {
        /* Environment */
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);

        /* Setup */
        let selectionStart: vscode.Position = new vscode.Position(38, 1);
        let maxLineSearchCount = 1000;

        /* Expectation setup */
        let expectedSymbol: SymbolWithRange = new SymbolWithRange(
            new HighlightSymbol(new HighlightEntry("{", false, true),
                new HighlightEntry("}", false, true),
                JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
            new vscode.Range(new vscode.Position(38, 0), new vscode.Position(38, 1))
        );

        /* Execution */
        let result: SymbolWithRange | undefined = SymbolFinder.findSymbolUpwards(editor, selectionStart, configuredSymbols, maxLineSearchCount);

        /* Asserts */
        assert.notStrictEqual(result, undefined);
        assert.deepStrictEqual(result, expectedSymbol);
    });
});
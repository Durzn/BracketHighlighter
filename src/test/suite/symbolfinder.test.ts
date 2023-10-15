import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import SymbolFinder from '../../SymbolFinder';
import { SymbolWithIndex, Util } from '../../Util';

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
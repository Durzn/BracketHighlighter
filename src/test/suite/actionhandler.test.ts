import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import ActionHandler from '../../ActionHandler';
import { SymbolAndContentRange } from '../../GlobalsHandler';
// import * as myExtension from '../extension';

suite('ActionHandler will correctly', () => {
    after(() => {
        vscode.window.showInformationMessage('All tests done!');
    });

    test('jump out of the opening symbol.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        handler.onJumpOutOfOpeningSymbolHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump out of the closing symbol.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        handler.onJumpOutOfClosingSymbolHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolEndRange.end, symbolEndRange.end);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the opening symbol.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        handler.onJumpToOpeningSymbolHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolStartRange.end, symbolStartRange.end);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the closing symbol.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        handler.onJumpToClosingSymbolHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('select all the text between symbols.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        handler.onSelectTextBetweenSymbolsHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(contentRange.end, contentRange.start);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the inner side of the opening/closing symbol.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        editor.selection = new vscode.Selection(symbolStartRange.end, symbolStartRange.end);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the start of the opening/closing symbol as default strategy.', () => {
        let handler = new ActionHandler();
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        editor.selection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolEndRange.start, symbolEndRange.start);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });

    test('jump to the outer side of the opening/closing symbol.', () => {
        /* TODO */
        let handler = new ActionHandler();
        return;
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let symbolStartRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 2));
        let symbolEndRange = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 5));
        let contentRange = new vscode.Range(symbolStartRange.end, symbolEndRange.start);
        let ranges = [new SymbolAndContentRange([symbolStartRange, symbolEndRange], contentRange)];
        editor.selection = new vscode.Selection(symbolStartRange.start, symbolStartRange.start);
        handler.onjumpBetweenOpeningAndClosingSymbolsHotkey(editor, ranges);
        let expectedSelection = new vscode.Selection(symbolEndRange.end, symbolEndRange.end);
        assert.deepStrictEqual(editor.selections[0], expectedSelection);
    });
});
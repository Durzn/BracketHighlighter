import * as vscode from 'vscode';
import { bracketHighlightGlobals } from './GlobalsHandler';
import { ConfigHandler } from './ConfigHandler';
import * as Util from './Util';

export default class HotkeyHandler {

    public onActivateHotkey() {
        bracketHighlightGlobals.extensionEnabled = !bracketHighlightGlobals.extensionEnabled;
        let configHandler = new ConfigHandler();
        configHandler.setExtensionEnabledStatus(bracketHighlightGlobals.extensionEnabled);
    }

    public onJumpOutOfOpeningSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }
        let newSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions();
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }

    public onJumpOutOfClosingSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }
        let newSelectionPositions = this.getClosingSymbolOutsideSelectionPositions();
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }

    public onJumpToOpeningSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }
        let newSelectionPositions = this.getOpeningSymbolInsideSelectionPositions();
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }
    public onJumpToClosingSymbolHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }
        let newSelectionPositions = this.getClosingSymbolInsideSelectionPositions();
        this.setSelectionPositions(activeEditor, newSelectionPositions);
    }

    public onjumpBetweenOpeningAndClosingSymbolsHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }

        let openingOutsideSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions();
        let closingOutsideSelectionPositions = this.getClosingSymbolOutsideSelectionPositions();
        let openingInsideSelectionPositions = this.getOpeningSymbolInsideSelectionPositions();
        let closingInsideSelectionPositions = this.getClosingSymbolInsideSelectionPositions();

        let map = new Map<vscode.Position[], vscode.Position[]>();
        map.set(openingOutsideSelectionPositions, closingOutsideSelectionPositions);
        map.set(openingInsideSelectionPositions, closingInsideSelectionPositions);
        map.set(closingInsideSelectionPositions, openingInsideSelectionPositions);
        map.set(closingOutsideSelectionPositions, openingOutsideSelectionPositions);

        let newSelectionPositions = openingOutsideSelectionPositions;
        for (let [key, value] of map) {
            if (activeEditor.selections[0].start.isEqual(key[0])) {
                newSelectionPositions = value;
                break;
            }
        }

        this.setSelectionPositions(activeEditor, newSelectionPositions);
        activeEditor.revealRange(activeEditor.selections[0]);
    }

    public onSelectTextBetweenSymbolsHotkey() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || bracketHighlightGlobals.highlightRanges.length <= 0) {
            return;
        }
        let selectionRanges: vscode.Range[] = [];
        for (let index = 0; index < bracketHighlightGlobals.highlightRanges.length; index++) {
            let range = bracketHighlightGlobals.highlightRanges[index];
            let symbol = this.getStartSymbol(index);
            let selectionStart = range[0].start;
            let selectionEnd = range[range.length - 1].end;
            let counterPartSymbol = this.getEndSymbolAtPosition(activeEditor, symbol, selectionEnd);

            selectionStart = this.correctStartPosition(symbol, selectionStart);
            selectionEnd = this.correctEndPosition(counterPartSymbol, selectionEnd);

            selectionRanges.push(new vscode.Range(selectionStart, selectionEnd));
        }
        this.setSelectionRanges(activeEditor, selectionRanges);
    }

    private getOpeningSymbolOutsideSelectionPositions(): vscode.Position[] {
        let newSelectionPositions: vscode.Position[] = [];
        for (let range of bracketHighlightGlobals.highlightRanges) {
            newSelectionPositions.push(range[0].start);
        }
        return newSelectionPositions;
    }

    private getClosingSymbolOutsideSelectionPositions(): vscode.Position[] {
        let newSelectionPositions: vscode.Position[] = [];
        for (let range of bracketHighlightGlobals.highlightRanges) {
            newSelectionPositions.push(range[range.length - 1].end);
        }
        return newSelectionPositions;
    }

    private getOpeningSymbolInsideSelectionPositions(): vscode.Position[] {
        let newSelectionPositions: vscode.Position[] = [];
        for (let index = 0; index < bracketHighlightGlobals.highlightRanges.length; index++) {
            let range = bracketHighlightGlobals.highlightRanges[index];
            let symbol = this.getStartSymbol(index);
            let newSelectionPosition = range[0].start;
            newSelectionPosition = this.correctStartPosition(symbol, newSelectionPosition);
            newSelectionPosition = newSelectionPosition.translate(0, 1);
            newSelectionPositions.push(newSelectionPosition);
        }
        return newSelectionPositions;
    }

    private getClosingSymbolInsideSelectionPositions(): vscode.Position[] {
        let newSelectionPositions: vscode.Position[] = [];
        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && bracketHighlightGlobals.highlightRanges.length > 0) {
            for (let index = 0; index < bracketHighlightGlobals.highlightRanges.length; index++) {
                let range = bracketHighlightGlobals.highlightRanges[index];
                let symbol = this.getStartSymbol(index);
                let newSelectionPosition = range[range.length - 1].end;
                let counterPartSymbol = this.getEndSymbolAtPosition(activeEditor, symbol, newSelectionPosition);
                newSelectionPosition = this.correctEndPosition(counterPartSymbol, newSelectionPosition);
                let offset = -1;
                if (newSelectionPosition.character === 0) {
                    offset = 0;
                }
                newSelectionPosition = newSelectionPosition.translate(0, offset);
                newSelectionPositions.push(newSelectionPosition);
            }
        }
        return newSelectionPositions;
    }

    private setSelectionPositions(activeEditor: vscode.TextEditor, newPositions: vscode.Position[]) {
        let newSelections: vscode.Selection[] = [];
        for (let i = 0; i < newPositions.length; i++) {
            newSelections.push(new vscode.Selection(newPositions[i], newPositions[i]));
        }
        activeEditor.selections = newSelections;
    }


    private setSelectionRanges(activeEditor: vscode.TextEditor, newRanges: vscode.Range[]) {
        let newSelections: vscode.Selection[] = [];
        for (let i = 0; i < newRanges.length; i++) {
            let startOffset = 1;
            let endOffset = -1;
            if (newRanges[i].end.character === 0) {
                endOffset = 0;
            }
            newSelections.push(new vscode.Selection(newRanges[i].end.translate(0, endOffset), newRanges[i].start.translate(0, startOffset)));
        }
        activeEditor.selections = newSelections;
    }

    private getEndSymbolAtPosition(activeEditor: vscode.TextEditor, symbol: string, position: vscode.Position): string {
        return Util.getSymbolFromPosition_legacy(activeEditor, position, Util.SymbolType.ENDSYMBOL, 0).symbol;
    }

    private correctStartPosition(startSymbol: string, startPosition: vscode.Position): vscode.Position {

        return startPosition.translate(0, startSymbol.length - 1);
    }
    private correctEndPosition(endSymbol: string, endPosition: vscode.Position): vscode.Position {

        return endPosition.translate(0, -endSymbol.length + 1);
    }

    private getStartSymbol(index: number): string {
        return bracketHighlightGlobals.highlightSymbols[index];
    }
}

export { HotkeyHandler };
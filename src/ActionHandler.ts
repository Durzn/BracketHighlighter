import * as vscode from 'vscode';
import { bracketHighlightGlobals } from './GlobalsHandler';
import { ConfigHandler, JumpBetweenStrategy } from './ConfigHandler';
import * as Util from './Util';
import assert = require('assert');

/*
    foo() {
          ^ opening symbol / start symbol
         ^ start of opening symbol / outside of opening symbol
           ^ end of opening symbol / inside of opening symbol
    }
    ^ closing symbol / end symbol
   ^ start of closing symbol / inside of closing symbol
     ^ end of closing symbol / outside of closing symbol
*/

type SymbolRangePair = [opening: vscode.Range, closing: vscode.Range];

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

        const openingOutsideSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions();
        const closingOutsideSelectionPositions = this.getClosingSymbolOutsideSelectionPositions();
        const openingInsideSelectionPositions = this.getOpeningSymbolInsideSelectionPositions();
        const closingInsideSelectionPositions = this.getClosingSymbolInsideSelectionPositions();
        assert(openingOutsideSelectionPositions.length === openingInsideSelectionPositions.length
            && closingOutsideSelectionPositions.length === closingInsideSelectionPositions.length
            && openingOutsideSelectionPositions.length === closingInsideSelectionPositions.length);
        assert(openingOutsideSelectionPositions[0].line === openingInsideSelectionPositions[0].line);
        assert(closingOutsideSelectionPositions[0].line === closingInsideSelectionPositions[0].line);

        const symbolRangePairs: SymbolRangePair[] = [];
        for (let i = 0; i < openingOutsideSelectionPositions.length; i++) {
            const openingSymbolRange = new vscode.Range(openingOutsideSelectionPositions[i], openingInsideSelectionPositions[i]);
            const closingSymbolRange = new vscode.Range(closingInsideSelectionPositions[i], closingOutsideSelectionPositions[i]);
            const symbolRangePair: SymbolRangePair = [openingSymbolRange, closingSymbolRange];
            symbolRangePairs.push(symbolRangePair);
        }

        const cursorPositionsBySymbolRangePair = new Map<SymbolRangePair, vscode.Position>();
        for (let i = 0; i < activeEditor.selections.length; i++) {
            const cursorPosition = activeEditor.selections[i].active;
            for (let j = 0; j < symbolRangePairs.length; j++) {
                const symbolRangePair = symbolRangePairs[j];
                if (cursorPositionsBySymbolRangePair.has(symbolRangePair)) {
                    continue;
                }
                if (symbolRangePair[0].contains(cursorPosition) || symbolRangePair[1].contains(cursorPosition)) {
                    cursorPositionsBySymbolRangePair.set(symbolRangePair, cursorPosition);
                }
            }
        }

        const newSelectionPositions: vscode.Position[] = [];
        for (const [symbolPair, cusorPosition] of cursorPositionsBySymbolRangePair) {
            const highlightedOpenSymbol = activeEditor.document.getText(symbolPair[0]);
            let strategy = bracketHighlightGlobals.preferredJumpBetweenStrategiesBySymbol.get(highlightedOpenSymbol);
            if (strategy === undefined)
                strategy = bracketHighlightGlobals.defaultJumpBetweenStrategy;
            const newCursorPosition = this.calculateOppositeCursorPosition(symbolPair, cusorPosition, strategy);
            newSelectionPositions.push(newCursorPosition);
        }
        this.setSelectionPositions(activeEditor, newSelectionPositions, true);
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

    private calculateOppositeCursorPosition(symbolPairs: SymbolRangePair, cursorPosition: vscode.Position, strategy: JumpBetweenStrategy): vscode.Position {
        const opening = symbolPairs[0];
        const closing = symbolPairs[1];
        let newCursorPosition: vscode.Position;

        if (strategy == JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE) {
            switch (cursorPosition) {
                case opening.start: newCursorPosition = closing.end; break;
                case closing.end: newCursorPosition = opening.start; break;
                case opening.end: newCursorPosition = closing.start; break;
                case closing.start: newCursorPosition = opening.end; break;
                default:
                    if (opening.contains(cursorPosition)) {
                        const distanceToStart = cursorPosition.character - opening.start.character;
                        const distanceToEnd = opening.end.character - cursorPosition.character;
                        assert(distanceToStart >= 0);
                        assert(distanceToEnd >= 0);
                        if (distanceToStart < distanceToEnd)
                            newCursorPosition = closing.end;
                        else
                            newCursorPosition = closing.start;
                    }
                    else if (closing.contains(cursorPosition)) {
                        const distanceToStart = cursorPosition.character - closing.start.character;
                        const distanceToEnd = closing.end.character - cursorPosition.character;
                        assert(distanceToStart >= 0);
                        assert(distanceToEnd >= 0);
                        if (distanceToStart < distanceToEnd)
                            newCursorPosition = opening.end;
                        else
                            newCursorPosition = opening.start;
                    }
                    else {
                        newCursorPosition = cursorPosition;
                    }
            }
        }
        else {
            if (opening.contains(cursorPosition))
                newCursorPosition = closing.start;
            else if (closing.contains(cursorPosition))
                newCursorPosition = opening.start;
            else
                newCursorPosition = cursorPosition;
        }
        return newCursorPosition;
    }

    private setSelectionPositions(activeEditor: vscode.TextEditor, newPositions: vscode.Position[], revealRange: boolean = false) {
        let newSelections: vscode.Selection[] = [];
        for (let i = 0; i < newPositions.length; i++) {
            newSelections.push(new vscode.Selection(newPositions[i], newPositions[i]));
        }
        if (newSelections.length > 0) {
            activeEditor.selections = newSelections;
            if (revealRange) {
                activeEditor.revealRange(activeEditor.selections[0]);
            }
        }
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
        return Util.getSymbolFromPosition(activeEditor, position, Util.SymbolType.ENDSYMBOL).symbol;
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
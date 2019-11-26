import * as vscode from 'vscode';
import * as SymbolHandler from './SymbolHandler';

enum Direction {
    Forward = 0,
    Backward = 1,
}

export default class SymbolFinder {

    private depth: number;

    constructor() {
        this.depth = 0;
    }

    private reverseString(text: string): string {
        let splitString = text.split("");
        let reverseString = splitString.reverse();
        let joinString = reverseString.join("");
        return joinString;
    }

    private getFirstLetterPosition(startPosition: vscode.Position, textLine: string): vscode.Position {
        let regExp = /[^\s]+/g;
        let lineOffset = textLine.search(regExp);
        if (lineOffset !== -1) {
            return startPosition.translate(0, lineOffset);
        }
        return startPosition;
    }

    private findIndicesOfSymbol(text: string, symbol: string): Array<number> {
        let indices: Array<number> = [];
        let startIndex: number = 0;
        let symbolLength: number = symbol.length;
        let index: number = text.indexOf(symbol, startIndex);
        while (index !== -1) {
            indices.push(index);
            startIndex = index + symbolLength;
            index = text.indexOf(symbol, startIndex);
        }
        return indices;
    }

    private handleLine(textLine: string, symbol: string, counterPartSymbol: string, direction: Direction, startPosition: vscode.Position): vscode.Position {
        let stepDirection;
        let startIndices = this.findIndicesOfSymbol(textLine, symbol);
        let counterPartIndices = this.findIndicesOfSymbol(textLine, counterPartSymbol);
        let tempPosition = startPosition;
        let startIndicesCount = startIndices.length;
        let counterPartIndicesCount = counterPartIndices.length;
        let lastIndex = Math.min(startIndicesCount, counterPartIndicesCount);
        let startSymbolIndex = 0;
        let counterPartIndex = 0;
        let counterPartSymbolIndex = 0;

        for (; startSymbolIndex < lastIndex;) {
            if (startIndices[startSymbolIndex] < counterPartIndices[counterPartSymbolIndex]) {
                this.depth++;
                startSymbolIndex++;
            }
            else {
                this.depth--;
                if (this.depth === 0) {
                    counterPartIndex = counterPartIndices[counterPartSymbolIndex];
                    if (direction === Direction.Backward) {
                        counterPartIndex = -counterPartIndex;
                    }
                    return tempPosition.with(tempPosition.line, startPosition.character + counterPartIndex);
                }
                counterPartSymbolIndex++;
            }
        }
        for (; startSymbolIndex < startIndicesCount; startSymbolIndex++) {
            this.depth++;
        }
        for (; counterPartSymbolIndex < counterPartIndicesCount; counterPartSymbolIndex++) {
            this.depth--;
            if (this.depth === 0) {
                counterPartIndex = counterPartIndices[counterPartSymbolIndex];
                if (direction === Direction.Backward) {
                    counterPartIndex = -counterPartIndex;
                }
                return tempPosition.with(tempPosition.line, startPosition.character + counterPartIndex);
            }
        }
        return tempPosition.with(tempPosition.line, textLine.length);
    }

    private iterateLines(textLines: Array<string>, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position, direction: Direction): Array<vscode.Range> {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove;
        if (direction === Direction.Forward) {
            lineMove = 1;
        }
        else {
            lineMove = -1;
        }
        for (let textLine of textLines) {
            if (direction === Direction.Backward) {
                textLine = this.reverseString(textLine);
            }
            else {
                tempPosition = this.getFirstLetterPosition(tempPosition, textLine);
            }
            let endPosition = this.handleLine(textLine, validSymbol, counterPartSymbol, direction, tempPosition);
            if (this.depth <= 0) {
                if (endPosition.character === 0) {
                    lineMove = 0;
                }
                ranges.push(new vscode.Range(tempPosition, endPosition.translate(0, lineMove)));
                return ranges;
            }
            ranges.push(new vscode.Range(tempPosition, endPosition));
            tempPosition = tempPosition.with(tempPosition.line + lineMove, 0);
        }
        return ranges;
    }

    private findForwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(activeEditor.document.getText().length);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        return this.iterateLines(textLines, validSymbol, counterPartSymbol, startPosition, Direction.Forward);
    }


    private findBackwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(0);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        textLines = textLines.reverse();
        return this.iterateLines(textLines, validSymbol, counterPartSymbol, startPosition, Direction.Backward);
    }

    public findMatchingSymbolPosition(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let symbolHandler = new SymbolHandler.SymbolHandler();
        if (symbolHandler.isValidStartSymbol(validSymbol) === true) {
            return this.findForwards(activeEditor, validSymbol, counterPartSymbol, startPosition);
        }
        else if (symbolHandler.isValidEndSymbol(validSymbol) === true) {
            return this.findBackwards(activeEditor, validSymbol, counterPartSymbol, startPosition);
        }
        return [];
    }

}


export { SymbolFinder };
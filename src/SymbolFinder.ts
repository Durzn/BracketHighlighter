import * as vscode from 'vscode';
import * as SymbolHandler from './SymbolHandler';
import { bracketHighlightGlobals, SearchDirection } from './GlobalsHandler';

export default class SymbolFinder {

    private depth: number;
    private lineCounter: number;

    constructor() {
        this.depth = 0;
        this.lineCounter = 0;
    }

    private getFirstLetterPosition(startPosition: vscode.Position, textLine: string): vscode.Position {
        let regExp = /[^\s]*[\S]+/g;
        let lineOffset = textLine.search(regExp);
        if (lineOffset > 0) {
            return startPosition.with(startPosition.line, lineOffset);
        }
        return startPosition;
    }

    public findIndicesOfSymbol(text: string, symbol: string): Array<number> {
        if (symbol === "") {
            return [-1];
        }
        let indices: Array<number> = [];
        let startIndex: number = 0;
        let symbolLength: number = symbol.length;
        let index: number = text.indexOf(symbol, startIndex);
        while (index !== -1) {
            indices.push(index);
            startIndex++;
            index = text.indexOf(symbol, startIndex);
        }
        /* remove duplicates*/
        indices = indices.filter(function (item, pos) {
            return indices.indexOf(item) === pos;
        });
        return indices;
    }

    private iterateLinesForward(textLines: Array<string>, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = 1;
        let maxLineCount = bracketHighlightGlobals.maxLineSearchCount;
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            tempPosition = this.getFirstLetterPosition(tempPosition, textLine);
            let endPosition = this.handleLineForward(textLine, validSymbol, counterPartSymbol, tempPosition, depthCounter);
            if (this.depth === depthCounter) {
                if (endPosition.character === 0) {
                    lineMove = 0;
                }
                ranges.push(new vscode.Range(tempPosition, endPosition.translate(0, counterPartSymbol.length)));
                return ranges;
            }
            ranges.push(new vscode.Range(tempPosition, endPosition));
            tempPosition = tempPosition.with(tempPosition.line + lineMove, 0);
            this.lineCounter++;
        }
        return [];
    }

    private iterateLinesBackward(textLines: Array<string>, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = -1;
        let maxLineCount = bracketHighlightGlobals.maxLineSearchCount;
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            tempPosition = tempPosition.with(tempPosition.line, textLine.length);
            let endPosition = this.handleLineBackward(textLine, validSymbol, counterPartSymbol, tempPosition, depthCounter);
            if (this.depth === depthCounter) {
                ranges.push(new vscode.Range(tempPosition, endPosition));
                return ranges;
            }
            endPosition = this.getFirstLetterPosition(endPosition, textLine);
            ranges.push(new vscode.Range(tempPosition, endPosition));
            if (tempPosition.line + lineMove < 0) {
                lineMove = 0;
            }
            tempPosition = tempPosition.with(tempPosition.line + lineMove, tempPosition.character);
        }
        return [];
    }

    private handleLineBackward(textLine: string, symbol: string, counterPartSymbol: string, startPosition: vscode.Position, depthCounter: number): vscode.Position {
        let startIndices = this.findIndicesOfSymbol(textLine, symbol);
        let counterPartIndices = this.findIndicesOfSymbol(textLine, counterPartSymbol);

        let allIndices = startIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) { return b - a; });
        for (let index of allIndices) {
            if (startIndices.includes(index)) {
                this.depth++;
            }
            else {
                this.depth--;
            }
            if (this.depth === depthCounter) {
                return startPosition.with(startPosition.line, index);
            }
        }
        let characterOffset = textLine.length;
        if (characterOffset > startPosition.character) {
            characterOffset = startPosition.character;
        }
        characterOffset = -characterOffset;
        return startPosition.translate(0, characterOffset);
    }

    private handleLineForward(textLine: string, symbol: string, counterPartSymbol: string, startPosition: vscode.Position, depthCounter: number): vscode.Position {
        let startIndices = this.findIndicesOfSymbol(textLine, symbol);
        let counterPartIndices = this.findIndicesOfSymbol(textLine, counterPartSymbol);

        let allIndices = startIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) { return a - b; });
        for (let index of allIndices) {
            if (startIndices.includes(index)) {
                this.depth++;
            }
            else {
                this.depth--;
                if (this.depth === depthCounter) {
                    if (this.lineCounter === 0) {
                        return startPosition.translate(0, index);
                    }
                    return startPosition.with(startPosition.line, index);
                }
            }
        }
        let characterOffset = textLine.length;
        return startPosition.translate(0, characterOffset);
    }

    private findForwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(activeEditor.document.getText().length);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        return this.iterateLinesForward(textLines, validSymbol, counterPartSymbol, startPosition, 0);
    }


    private findBackwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(0);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        textLines = textLines.reverse();
        return this.iterateLinesBackward(textLines, validSymbol, counterPartSymbol, startPosition, 0);
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

    public findDepth1Backwards(startPosition: vscode.Position, textLines: Array<string>, symbols: Array<string>, counterPartSymbols: Array<string>): {
        symbol: string, symbolPosition: vscode.Position
    } {
        textLines = textLines.reverse();
        let symbolHandler = new SymbolHandler.SymbolHandler();
        let textRanges: Array<Array<vscode.Range>> = [];
        for (let startSymbol of symbols) {
            textRanges.push(this.iterateLinesBackward(textLines, startSymbol, symbolHandler.getCounterPart(startSymbol), startPosition, 1));
            this.depth = 0;
        }
        let minLength = Number.MAX_SAFE_INTEGER;
        let symbolIndex = 0;
        for (let i = 0; i < textRanges.length; i++) {
            if (textRanges[i].length < minLength && textRanges[i].length !== 0) {
                minLength = textRanges[i].length;
                symbolIndex = i;
            }
        }
        let textRangeLine = textRanges[symbolIndex][textRanges[symbolIndex].length - 1].start.line;
        let textRangeCharacter = textRanges[symbolIndex][textRanges[symbolIndex].length - 1].start.character;
        /* edge case where the bracket is in the corner and would otherwise be skipped */
        if (textRangeLine === 1 && textRangeCharacter === 1) {
            textRangeLine = 0;
            textRangeCharacter = 0;
        }
        return {
            symbol: symbols[symbolIndex],
            symbolPosition: new vscode.Position(textRangeLine, textRangeCharacter),
        };
    }
}



export { SymbolFinder };
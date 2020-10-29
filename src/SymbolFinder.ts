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
        let regexMode = bracketHighlightGlobals.regexMode;
        let indices: Array<number> = [];
        let startIndex: number = 0;
        let index: number = text.indexOf(symbol, startIndex);
        while (index !== -1) {
            if (regexMode) {
                /* If it's the first symbol, it cannot be escaped */
                if (index === 0) {
                    indices.push(index);
                }
                else if (text.charAt(index - 1) !== "\\") {
                    indices.push(index);
                }
            }
            else {
                indices.push(index);
            }
            startIndex++;
            index = text.indexOf(symbol, startIndex);
        }
        /* remove duplicates */
        indices = indices.filter(function (item, pos) {
            return indices.indexOf(item) === pos;
        });
        return indices;
    }

    private iterateLinesForward(textLines: Array<string>, validSymbols: Array<string>, counterPartSymbol: string, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
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
            let endPosition = this.handleLineForward(textLine, validSymbols, counterPartSymbols, tempPosition, depthCounter);
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

    private iterateLinesBackward(textLines: Array<string>, validSymbols: Array<string>, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
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
            let endPosition = this.handleLineBackward(textLine, validSymbols, counterPartSymbols, tempPosition, depthCounter);
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

    private handleLineBackward(textLine: string, validSymbols: Array<string>, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): vscode.Position {
        let startIndices: number[] = [];
        for (let validSymbol of validSymbols) {
            startIndices = startIndices.concat(this.findIndicesOfSymbol(textLine, validSymbol));
        }
        let counterPartIndices: number[] = [];
        for (let counterPartSymbol of counterPartSymbols) {
            counterPartIndices = counterPartIndices.concat(this.findIndicesOfSymbol(textLine, counterPartSymbol));
        }
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

    public isSymbolEscaped(symbol: string): boolean {
        if (symbol.length > 0 && symbol.charAt(0) === "\\") {
            return true;
        }
        return false;
    }

    private handleLineForward(textLine: string, validSymbols: Array<string>, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): vscode.Position {
        let startIndices: number[] = [];
        for (let validSymbol of validSymbols) {
            startIndices = startIndices.concat(this.findIndicesOfSymbol(textLine, validSymbol));
        }
        let counterPartIndices: number[] = [];
        for (let counterPartSymbol of counterPartSymbols) {
            counterPartIndices = counterPartIndices.concat(this.findIndicesOfSymbol(textLine, counterPartSymbol));
        }
        let allIndices: number[] = startIndices.concat(counterPartIndices);
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

    private findForwards(activeEditor: vscode.TextEditor, validSymbols: Array<string>, counterPartSymbol: string, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(activeEditor.document.getText().length);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        return this.iterateLinesForward(textLines, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, depthCounter);
    }


    private findBackwards(activeEditor: vscode.TextEditor, validSymbols: Array<string>, counterPartSymbols: Array<string>, startPosition: vscode.Position, depthCounter: number): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(0);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        textLines = textLines.reverse();
        return this.iterateLinesBackward(textLines, validSymbols, counterPartSymbols, startPosition, depthCounter);
    }

    public findMatchingSymbolPosition(activeEditor: vscode.TextEditor, validSymbol: string, validSymbols: Array<string>, counterPartSymbol: string, counterPartSymbols: Array<string>, startPosition: vscode.Position): Array<vscode.Range> {
        let symbolHandler = new SymbolHandler.SymbolHandler();
        this.depth = 0;
        if (symbolHandler.isValidStartSymbol(validSymbol) === true) {
            return this.findForwards(activeEditor, validSymbols, counterPartSymbol, counterPartSymbols, startPosition, 0);
        }
        else if (symbolHandler.isValidEndSymbol(validSymbol) === true) {
            return this.findBackwards(activeEditor, validSymbols, counterPartSymbols, startPosition, 0);
        }
        return [];
    }

    public findDepth1Backwards(activeEditor: vscode.TextEditor, startPosition: vscode.Position, textLines: Array<string>, symbols: Array<string>, counterPartSymbols: Array<string>): {
        symbol: string, symbolPosition: vscode.Position
    } {
        textLines = textLines.reverse();
        let textRanges: Array<Array<vscode.Range>> = [];
        let foundSymbols: Array<string> = [];
        let symbolHandler = new SymbolHandler.SymbolHandler();
        for (let startSymbol of symbols) {
            let counterPartSymbols = symbolHandler.getCounterParts(startSymbol);
            let possibleRange = this.findBackwards(activeEditor, [startSymbol], counterPartSymbols, startPosition, 1);
            if (possibleRange.length <= 0) {
                continue;
            }
            let rangeText = activeEditor.document.getText(possibleRange[possibleRange.length - 1]);
            if (rangeText.includes(startSymbol)) {
                textRanges.push(possibleRange);
                foundSymbols.push(startSymbol);
            }
            this.depth = 0;
        }
        let minLength = Number.MAX_SAFE_INTEGER;
        let symbolIndex: number = 0;
        let symbolPosition: number = 0;
        let lineNumber: number = 0;
        if (textRanges.length === 0) {
            return {
                symbol: "",
                symbolPosition: new vscode.Position(0, 0),
            };
        }
        for (let i = 0; i < textRanges.length; i++) {
            let textRange = textRanges[i];
            if (textRange.length === 0) {
                continue;
            }
            let tempLineNumber: number = textRange[textRange.length - 1].start.line;
            let textLine: vscode.TextLine = activeEditor.document.lineAt(tempLineNumber);
            let symbolIndices: number[] = this.findIndicesOfSymbol(textLine.text, foundSymbols[i]);
            let tempSymbolPosition: number = symbolIndices[symbolIndices.length - 1];
            /* If two symbols are on the same line: choose the one closest to the end of the line! */
            /* If one symbol is on a higher line number: Use this symbol, since it will be closer to the cursor (since the search is upwards!) */
            if (tempLineNumber > lineNumber || (tempSymbolPosition > symbolPosition && tempLineNumber === lineNumber)) {
                minLength = textRange.length;
                symbolIndex = i;
                symbolPosition = tempSymbolPosition;
                lineNumber = tempLineNumber;
            }
        }
        let textRangeLine = textRanges[symbolIndex][textRanges[symbolIndex].length - 1].start.line;
        let textRangeCharacter = textRanges[symbolIndex][textRanges[symbolIndex].length - 1].start.character;
        return {
            symbol: foundSymbols[symbolIndex],
            symbolPosition: new vscode.Position(textRangeLine, textRangeCharacter),
        };
    }
}



export { SymbolFinder };
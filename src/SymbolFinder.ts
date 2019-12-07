import * as vscode from 'vscode';
import * as SymbolHandler from './SymbolHandler';
import * as ConfigHandler from './ConfigHandler';

export default class SymbolFinder {

    private depth: number;
    private lineCounter: number;

    constructor() {
        this.depth = 0;
        this.lineCounter = 0;
    }

    private reverseString(text: string): string {
        let splitString = text.split("");
        let reverseString = splitString.reverse();
        let joinString = reverseString.join("");
        return joinString;
    }

    private getFirstLetterPosition(startPosition: vscode.Position, textLine: string): vscode.Position {
        let regExp = /[^\s]*[\S]+/g;
        let lineOffset = textLine.search(regExp);
        if (lineOffset > 0) {
            return startPosition.with(startPosition.line, lineOffset);
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

    private iterateLinesBackward(textLines: Array<string>, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = -1;
        let configHandler = new ConfigHandler.ConfigHandler();
        let maxLineCount = configHandler.getMaxLineSearchCount();
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            textLine = this.reverseString(textLine);
            tempPosition = tempPosition.with(tempPosition.line, textLine.length);
            let endPosition = this.handleLineBackward(textLine, validSymbol, counterPartSymbol, tempPosition);
            if (this.depth <= 0) {
                if (endPosition.character === 0) {
                    lineMove = 0;
                }
                ranges.push(new vscode.Range(tempPosition, endPosition.translate(0, lineMove)));
                return ranges;
            }
            textLine = this.reverseString(textLine);
            endPosition = this.getFirstLetterPosition(endPosition, textLine);
            ranges.push(new vscode.Range(tempPosition, endPosition));
            tempPosition = tempPosition.with(tempPosition.line + lineMove, tempPosition.character);
        }
        return ranges;
    }

    private handleLineBackward(textLine: string, symbol: string, counterPartSymbol: string, startPosition: vscode.Position): vscode.Position {
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
                if (this.depth === 0) {
                    return startPosition.translate(0, -index);
                }
            }
        }
        let characterOffset = textLine.length;
        if (characterOffset > startPosition.character) {
            characterOffset = startPosition.character;
        }
        characterOffset = -characterOffset;
        return startPosition.translate(0, characterOffset);
    }

    private handleLineForward(textLine: string, symbol: string, counterPartSymbol: string, startPosition: vscode.Position): vscode.Position {
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
                if (this.depth === 0) {
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

    private iterateLinesForward(textLines: Array<string>, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let tempPosition = startPosition;
        let ranges = [];
        let lineMove = 1;
        let configHandler = new ConfigHandler.ConfigHandler();
        let maxLineCount = configHandler.getMaxLineSearchCount();
        let currentTextLineCount = 0;
        for (let textLine of textLines) {
            currentTextLineCount++;
            if (currentTextLineCount > maxLineCount) {
                return [];
            }
            tempPosition = this.getFirstLetterPosition(tempPosition, textLine);
            let endPosition = this.handleLineForward(textLine, validSymbol, counterPartSymbol, tempPosition);
            if (this.depth <= 0) {
                if (endPosition.character === 0) {
                    lineMove = 0;
                }
                ranges.push(new vscode.Range(tempPosition, endPosition.translate(0, 1)));
                return ranges;
            }
            ranges.push(new vscode.Range(tempPosition, endPosition));
            tempPosition = tempPosition.with(tempPosition.line + lineMove, 0);
            this.lineCounter++;
        }
        return ranges;
    }

    private findForwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(activeEditor.document.getText().length);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        return this.iterateLinesForward(textLines, validSymbol, counterPartSymbol, startPosition);
    }


    private findBackwards(activeEditor: vscode.TextEditor, validSymbol: string, counterPartSymbol: string, startPosition: vscode.Position): Array<vscode.Range> {
        let endPosition = activeEditor.document.positionAt(0);
        let textRange: vscode.Range = new vscode.Range(startPosition, endPosition);
        let text = activeEditor.document.getText(textRange);
        let textLines = text.split("\n");
        textLines = textLines.reverse();
        return this.iterateLinesBackward(textLines, validSymbol, counterPartSymbol, startPosition);
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
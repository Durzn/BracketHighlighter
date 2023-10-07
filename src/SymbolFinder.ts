import * as vscode from 'vscode';
import { HighlightSymbol } from './ConfigHandler';

class SymbolWithIndex {
    constructor(public readonly symbol: string, public readonly start: number) { }
}

export default class SymbolFinder {

    public static regexIndexOf(text: string, regex: RegExp, startpos: number): SymbolWithIndex | undefined {
        let match = regex.exec(text);
        if (match) {
            return new SymbolWithIndex(match[0], match.index);
        }
        return undefined;
    }

    public static findIndicesOfSymbolRegExp(line: string, regex: RegExp): SymbolWithIndex[] {
        let indices: SymbolWithIndex[] = [];
        let startIndex: number = 0;
        let index: SymbolWithIndex | undefined = this.regexIndexOf(line, regex, startIndex);
        while (index !== undefined) {
            indices.push(index);
            startIndex++;
            index = this.regexIndexOf(line, regex, startIndex);
        }
        /* remove duplicates */
        indices = indices.filter(function (item, pos) {
            return indices.indexOf(item) === pos;
        });
        return indices;
    }

    public static isSymbolEscaped(symbol: string): boolean {
        if (symbol.length > 0 && symbol.charAt(0) === "\\") {
            return true;
        }
        return false;
    }

    public static escapeSymbol(symbol: string) {
        return symbol.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    public static getRangeOfRegexClosestToPosition(line: string, regex: RegExp, startPosition: vscode.Position): vscode.Range | undefined {
        let range: vscode.Range | undefined = undefined;
        let symbolsWithIndex = this.findIndicesOfSymbolRegExp(line, regex);
        if (symbolsWithIndex.length > 0) {
            let closestOffsetToPosition = symbolsWithIndex.reduce((prev, curr) => Math.abs(curr.start - startPosition.character) < Math.abs(prev.start - startPosition.character) ? curr : prev);
            range = new vscode.Range(startPosition, startPosition.with(startPosition.line, closestOffsetToPosition.start + closestOffsetToPosition.symbol.length));
        }
        return range;
    }

    public static getMatchRangeClosestToPosition(line: string, symbol: HighlightSymbol, symbolStartOrEnd: string, startPosition: vscode.Position): vscode.Range | undefined {
        let symbolToCheck: string | undefined = undefined;
        if (symbol.isRegex) {
            symbolToCheck = symbolStartOrEnd;
        }
        else {
            symbolToCheck = `\\b${this.escapeSymbol(symbolStartOrEnd)}\\b`;
        }
        return this.getRangeOfRegexClosestToPosition(line, new RegExp(`${symbolToCheck}`, "g"), startPosition);
    }
}

export { SymbolFinder };
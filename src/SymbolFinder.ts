import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

class SymbolWithIndex {
    constructor(public readonly symbol: string, public readonly start: number) { }
}

export type SearchFuncType = (line: string, regex: RegExp, cursorPosition: vscode.Position) => vscode.Range | undefined;

export default class SymbolFinder {

    public static regexIndexOf(text: string, regex: RegExp): SymbolWithIndex | undefined {
        let match = regex.exec(text);
        if (match) {
            return new SymbolWithIndex(match[0], match.index);
        }
        return undefined;
    }

    public static findIndicesOfSymbolRegExp(line: string, regex: RegExp, startPos: number): SymbolWithIndex[] {
        let indices: SymbolWithIndex[] = [];
        let index: SymbolWithIndex | undefined = SymbolFinder.regexIndexOf(line.slice(startPos), regex);
        if (index) {
            indices.push(index);
        }
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

    /**
     * Get the complete symbol (potentially multiple characters long => a range) closest behind the given position
     * @param line 
     * @param regex 
     * @param cursorPosition 
     * @returns The range closest to the given position
     */
    public static getRangeOfRegexClosestToPositionBehind(line: string, regex: RegExp, cursorPosition: vscode.Position): vscode.Range | undefined {
        let range: vscode.Range | undefined = undefined;
        let symbolsWithIndex = SymbolFinder.findIndicesOfSymbolRegExp(line, regex, 0);
        if (symbolsWithIndex.length > 0) {
            let closestOffsetToPosition = symbolsWithIndex.reduce((prev, curr) => Math.abs(curr.start - cursorPosition.character) < Math.abs(prev.start - cursorPosition.character) ? curr : prev);
            let rangeStart = line.length + cursorPosition.character + closestOffsetToPosition.start;
            let rangeLength = closestOffsetToPosition.symbol.length;
            range = new vscode.Range(cursorPosition.translate(0, rangeStart), cursorPosition.with(0, rangeStart + rangeLength));
        }
        return range;
    }

    /**
     * Get the complete symbol (potentially multiple characters long => a range) closest before the given position
     * @param line 
     * @param regex 
     * @param cursorPosition 
     * @returns The range closest to the given position
     */
    public static getRangeOfRegexClosestToPositionBefore(line: string, regex: RegExp, cursorPosition: vscode.Position): vscode.Range | undefined {
        let range: vscode.Range | undefined = undefined;
        let symbolsWithIndex = SymbolFinder.findIndicesOfSymbolRegExp(line, regex, 0);
        if (symbolsWithIndex.length > 0) {
            let closestOffsetToPosition = symbolsWithIndex.reduce((prev, curr) => Math.abs(curr.start - cursorPosition.character) < Math.abs(prev.start - cursorPosition.character) ? curr : prev);
            let rangeStart = line.length - cursorPosition.character + closestOffsetToPosition.start;
            let rangeLength = closestOffsetToPosition.symbol.length;
            range = new vscode.Range(cursorPosition.translate(0, rangeStart), cursorPosition.translate(0, rangeStart + rangeLength));
        }
        return range;
    }

    public static getMatchRangeClosestToPosition(line: string, entry: HighlightEntry, cursorPosition: vscode.Position, searchFunc: SearchFuncType): vscode.Range | undefined {
        let symbolToCheck: string = entry.symbol;
        if (!entry.isRegex) {
            if (entry.canBeSubstring) {
                symbolToCheck = `${SymbolFinder.escapeSymbol(entry.symbol)}`;
            }
            else {
                symbolToCheck = `\\b${SymbolFinder.escapeSymbol(entry.symbol)}\\b`;
            }
        }
        return searchFunc(line, new RegExp(`${symbolToCheck}`, "g"), cursorPosition);
    }
}

export { SymbolFinder };
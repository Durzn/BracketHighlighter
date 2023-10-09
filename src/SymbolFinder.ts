import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

class SymbolWithIndex {
    constructor(public readonly symbol: string, public readonly start: number) { }
}

export type SearchFuncType = (line: string, regex: RegExp, cursorPosition: vscode.Position) => vscode.Range | undefined;

export default class SymbolFinder {

    public static regexIndicesOf(text: string, regex: RegExp): SymbolWithIndex[] {
        let symbols: SymbolWithIndex[] = [];
        let matches: RegExpExecArray | null;
        while ((matches = regex.exec(text)) !== null) {
            symbols.push(new SymbolWithIndex(matches[0], matches.index));
        }
        return symbols;
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
     * Get the complete symbol (potentially multiple characters long => a range) closest before the given position
     * @param line 
     * @param regex 
     * @param cursorPosition 
     * @returns The range closest to the given position
     */
    public static getRangeOfRegexClosestToPositionBefore(line: string, regex: RegExp, cursorPosition: vscode.Position): vscode.Range | undefined {
        let range: vscode.Range | undefined = undefined;
        let symbolsWithIndex = SymbolFinder.regexIndicesOf(line, regex);
        if (symbolsWithIndex.length > 0) {
            let closestOffsetToPosition = symbolsWithIndex.reduce((prev, curr) => Math.abs(curr.start - cursorPosition.character) < Math.abs(prev.start - cursorPosition.character) ? curr : prev);
            let rangeStart = closestOffsetToPosition.start;
            let rangeLength = closestOffsetToPosition.symbol.length;
            range = new vscode.Range(cursorPosition.with(cursorPosition.line, rangeStart), cursorPosition.with(cursorPosition.line, rangeStart + rangeLength));
        }
        return range;
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
        let symbolsWithIndex = SymbolFinder.regexIndicesOf(line, regex);
        if (symbolsWithIndex.length > 0) {
            let closestOffsetToPosition = symbolsWithIndex.reduce((prev, curr) => Math.abs(curr.start - cursorPosition.character) < Math.abs(prev.start - cursorPosition.character) ? curr : prev);
            let rangeStart = closestOffsetToPosition.start;
            let rangeLength = closestOffsetToPosition.symbol.length;
            range = new vscode.Range(cursorPosition.translate(0, rangeStart), cursorPosition.translate(0, rangeStart + rangeLength));
        }
        return range;
    }

    public static makeRegexString(entry: HighlightEntry): string {
        let symbol: string = entry.symbol;
        if (!entry.isRegex) {
            if (entry.canBeSubstring) {
                symbol = `${SymbolFinder.escapeSymbol(entry.symbol)}`;
            }
            else {
                symbol = `\\b${SymbolFinder.escapeSymbol(entry.symbol)}\\b`;
            }
        }
        return symbol;
    }

    public static getMatchRangeClosestToPosition(line: string, entry: HighlightEntry, cursorPosition: vscode.Position, searchFunc: SearchFuncType): vscode.Range | undefined {
        let symbolToCheck: string = SymbolFinder.makeRegexString(entry);
        return searchFunc(line, new RegExp(`${symbolToCheck}`, "g"), cursorPosition);
    }
}

export { SymbolFinder };
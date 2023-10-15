import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

export class SymbolWithRange {
    constructor(public readonly symbol: HighlightSymbol, public readonly range: vscode.Range) {
    }
}
export class SymbolWithDepth {
    constructor(public readonly symbol: HighlightSymbol, public depth: number) {
    }
}

export class SymbolWithIndex {
    constructor(public readonly symbol: string, public readonly start: number) { }
}
export class EntryWithRange {
    constructor(public readonly symbol: HighlightEntry, public readonly range: vscode.Range) {
    }
}
export class EntryWithRangeInDepth {
    constructor(public readonly symbol: HighlightEntry, public readonly range: vscode.Range | undefined, public depth: number) {
    }
}

export class Util {

    public static escapeSymbol(symbol: string) {
        return symbol.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    public static makeRegexString(entry: HighlightEntry): string {
        let symbol: string = entry.symbol;
        if (!entry.isRegex) {
            if (entry.canBeSubstring) {
                symbol = `${Util.escapeSymbol(entry.symbol)}`;
            }
            else {
                symbol = `\\b${Util.escapeSymbol(entry.symbol)}\\b`;
            }
        }
        return symbol;
    }
}
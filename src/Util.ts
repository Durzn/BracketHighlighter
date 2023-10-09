import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

export class SymbolWithRange {
    constructor(public readonly symbol: HighlightSymbol, public readonly range: vscode.Range) {
    }
}
export class SymbolWithRangeInDepth {
    constructor(public readonly symbol: HighlightSymbol, public readonly range: vscode.Range, public depth: number) {
    }
}
export class EntryWithDepth {
    constructor(public readonly symbol: HighlightEntry, public depth: number) {
    }
}
export class EntryWithRange {
    constructor(public readonly symbol: HighlightEntry, public readonly range: vscode.Range) {
    }
}

import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

export class SymbolWithRangeInDepth {
    constructor(public readonly symbol: HighlightSymbol, public readonly range: vscode.Range) {
    }
}
export class EntryWithRangeInDepth {
    constructor(public readonly symbol: HighlightEntry, public readonly range: vscode.Range) {
    }
}
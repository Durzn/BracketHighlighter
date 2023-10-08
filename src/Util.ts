import * as vscode from 'vscode';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

export enum SymbolType {
    STARTSYMBOL,
    ENDSYMBOL,
    ALLSYMBOLS
}

export class SymbolWithPosition {
    constructor(public readonly symbol: HighlightSymbol, public readonly position: vscode.Position) {
    }
}
export class EntryWithRange {
    constructor(public readonly symbol: HighlightEntry, public readonly range: vscode.Range) {
    }
}
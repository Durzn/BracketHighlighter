import * as vscode from 'vscode';
import { HighlightSymbol } from './ConfigHandler';

export enum SymbolType {
    STARTSYMBOL,
    ENDSYMBOL,
    ALLSYMBOLS
}

export class SymbolWithPosition {
    constructor(public readonly symbol: HighlightSymbol, public readonly position: vscode.Position) {
    }
}
export class SymbolWithRange {
    constructor(public readonly symbol: HighlightSymbol, public readonly range: vscode.Range) {
    }
}
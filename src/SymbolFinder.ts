import * as vscode from 'vscode';
import { SymbolWithIndex } from './Util';

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
}

export { SymbolFinder };
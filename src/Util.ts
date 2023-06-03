import * as vscode from 'vscode';
import { bracketHighlightGlobals } from './GlobalsHandler';
import SymbolFinder from './SymbolFinder';

export enum SymbolType {
    STARTSYMBOL,
    ENDSYMBOL,
    ALLSYMBOLS
}

export class SymbolWithOffset {
    symbol: string;
    relativeOffset: number;
    absoluteOffset: number;

    constructor(symbol: string, absoluteOffset: number, relativeOffset: number) {
        this.symbol = symbol;
        this.absoluteOffset = absoluteOffset;
        this.relativeOffset = relativeOffset;
    }
}

function getClosestSymbolFromPosition(symbols: Array<SymbolWithOffset>, cursorPosition: number): SymbolWithOffset {
    if (symbols.length === 0) {
        return { symbol: "", relativeOffset: 0, absoluteOffset: 0 };
    }
    else if (symbols.length === 1) {
        return symbols[0];
    }
    let closestSymbol = symbols.reduce((symbol1, symbol2) => {
        if (symbol1.absoluteOffset <= cursorPosition && symbol1.absoluteOffset + symbol1.symbol.length > cursorPosition) {
            return symbol1;
        }
        else if (symbol2.absoluteOffset <= cursorPosition && symbol2.absoluteOffset + symbol2.symbol.length > cursorPosition) {
            return symbol2;
        }
        else {
            let res1 = Math.abs(symbol1.absoluteOffset - cursorPosition);
            let res2 = Math.abs(symbol2.absoluteOffset - cursorPosition);
            return res1 <= res2 ? symbol1 : symbol2;
        }
    });
    return closestSymbol;
}

function getSymbols(symbolType: SymbolType): Array<string> {
    let validSymbols: Array<string> = [];
    let startSymbols = bracketHighlightGlobals.allowedStartSymbols;
    let endSymbols = bracketHighlightGlobals.allowedEndSymbols;
    switch (symbolType) {
        case SymbolType.STARTSYMBOL:
            validSymbols = startSymbols;
            break;
        case SymbolType.ENDSYMBOL:
            validSymbols = endSymbols;
            break;
        default:
            validSymbols = startSymbols.concat(endSymbols);
            break;
    }
    return validSymbols;
}

function escapeRegExp(text: string) {
    return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/******************************************************************************************************************************************
* Gets a valid start symbol and its offset from the given selection. Returns "" if no symbol is found.
*	activeEditor: Editor containing the selectionStart
*	selectionStart: Where searching for symbols shall start
*	symbolType: Which symbols to include in the search
******************************************************************************************************************************************/
export function getSymbolFromPosition(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, symbolType: SymbolType): SymbolWithOffset {
    let lineText: number | any = activeEditor.document.lineAt(selectionStart.line).text;
    let foundSymbols: Array<SymbolWithOffset> = [];
    let cursorPosition = selectionStart.character;
    let validSymbols: Array<string> = getSymbols(symbolType);
    for (let validSymbol of validSymbols) {
        let isRegExSymbol = false;
        let symbolOffsets: number[] = [];
        if (isRegExSymbol) {
            let regex = escapeRegExp(validSymbol);
            /* Check explicitly whether the given string does not exist exactly (stand-alone) within the text */
            if (new RegExp(regex, "i").test(lineText)) {
                symbolOffsets = new SymbolFinder().findIndicesOfSymbol(lineText, validSymbol);
            }
        }
        else {
            /* Current problem with this implementation: Substrings are considered a match as well, which breaks the old behavior
            => Would need to use a regex with \b*string*\b, which does not work. Find out why. */
            symbolOffsets = new SymbolFinder().findIndicesOfSymbol(lineText, validSymbol);
        }
        for (let offset of symbolOffsets) {
            foundSymbols.push({ symbol: validSymbol, absoluteOffset: offset, relativeOffset: offset - cursorPosition });
        }
    }
    let closestSymbol = getClosestSymbolFromPosition(foundSymbols, cursorPosition);
    if (closestSymbol.symbol !== "") {
        if (cursorPosition > (closestSymbol.absoluteOffset - 1) && cursorPosition <= (closestSymbol.absoluteOffset + closestSymbol.symbol.length)) {
            return closestSymbol;
        }
    }
    return new SymbolWithOffset("", 0, 0);
}
import * as vscode from 'vscode';
import * as SymbolFinder from './SymbolFinder';
import * as SymbolHandler from './SymbolHandler';
import { bracketHighlightGlobals } from './GlobalsHandler';

export enum SymbolType {
    STARTSYMBOL,
    ENDSYMBOL,
    ALLSYMBOLS
}

/******************************************************************************************************************************************
* Gets a valid start symbol and its offset from the given selection. Returns "" if no symbol is found.
*	activeEditor: Editor containting the selectionStart
*	selectionStart: Where searching for symbols shall start
*	functionCount: Number specifying how often the function has been called (used to find symbols around the selectionStart)
******************************************************************************************************************************************/
export function getSymbolFromPosition(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, symbolType: SymbolType, functionCount: number): {
    symbol: string, offset: number
} {
    const maxFunctionCount: number = 2;
    if (functionCount >= maxFunctionCount) {
        return { symbol: "", offset: 0 };
    }
    let symbolHandler = new SymbolHandler.SymbolHandler;
    let symbolFinder = new SymbolFinder.SymbolFinder;
    let validSymbols: string[] = [];
    switch (symbolType) {
        case SymbolType.STARTSYMBOL:
            validSymbols = symbolHandler.getValidStartSymbols();
            break;
        case SymbolType.ENDSYMBOL:
            validSymbols = symbolHandler.getValidEndSymbols();
            break;
        case SymbolType.ALLSYMBOLS:
            validSymbols = symbolHandler.getValidStartSymbols().concat(symbolHandler.getValidEndSymbols());
            break;

    }
    let longestSymbolLength = validSymbols.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
    let startPosition = new vscode.Position(selectionStart.line, 0);
    let endPosition = new vscode.Position(selectionStart.line, selectionStart.character + longestSymbolLength);
    let selectionLineText = activeEditor.document.getText(new vscode.Range(startPosition, endPosition));
    let stringPosition = selectionStart.character;
    let selectionSymbol = selectionLineText[stringPosition];
    const containsSymbol = (symbol: string) => symbol.indexOf(selectionSymbol) !== -1;
    validSymbols = validSymbols.filter(containsSymbol);
    let tempValidSymbols = validSymbols;
    while (validSymbols.some(containsSymbol)) {
        if (stringPosition === 0) {
            selectionSymbol = " " + selectionSymbol;
            break;
        }
        else {
            stringPosition--;
        }
        selectionSymbol = selectionLineText[stringPosition] + selectionSymbol;
        tempValidSymbols = tempValidSymbols.filter(containsSymbol);
        if (tempValidSymbols.length !== 0) {
            validSymbols = validSymbols.filter(containsSymbol);
        }
    }
    if (selectionSymbol === undefined) {
        if (selectionStart.character === 0) {
            return { symbol: "", offset: 0 };
        }
        return getSymbolFromPosition(activeEditor, selectionStart.translate(0, -1), symbolType, functionCount + 1);
    }
    if (bracketHighlightGlobals.regexMode && symbolFinder.isSymbolEscaped(selectionSymbol)) {
        return { symbol: "", offset: 0 };
    }
    selectionSymbol = selectionSymbol.substr(1, selectionSymbol.length - 1);
    stringPosition = selectionStart.character;
    while (validSymbols.some(containsSymbol) && selectionSymbol !== "") {
        stringPosition++;
        if (selectionLineText[stringPosition] === undefined) {
            selectionSymbol = selectionSymbol + " ";
            break;
        }
        selectionSymbol = selectionSymbol + selectionLineText[stringPosition];
        tempValidSymbols = tempValidSymbols.filter(containsSymbol);
        if (tempValidSymbols.length !== 0) {
            validSymbols = validSymbols.filter(containsSymbol);
        }
    }
    selectionSymbol = selectionSymbol.substr(0, selectionSymbol.length - 1);
    let symbol = selectionSymbol;
    if (symbolHandler.isValidStartSymbol(symbol) || symbolHandler.isValidEndSymbol(symbol)) {
        return { symbol: symbol, offset: -functionCount };
    }
    else {
        if (selectionStart.character === 0) {

            return { symbol: "", offset: 0 };
        }
        return getSymbolFromPosition(activeEditor, selectionStart.translate(0, -1), symbolType, functionCount + 1);
    }
}
import * as vscode from 'vscode';
import { EntryWithRange, EntryWithRangeInDepth, SymbolWithDepth, SymbolWithIndex, SymbolWithRange, Util } from './Util';
import { HighlightEntry, HighlightSymbol } from './ConfigHandler';

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

    /**
     * 
     */
    public static findSymbolUpwards(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[], maxLineSearchCount: number): SymbolWithRange | undefined {
        let text: string = activeEditor.document.getText(new vscode.Range(selectionStart.translate(-Math.min(...[maxLineSearchCount, selectionStart.line]), -selectionStart.character), selectionStart));
        let eolCharacter = activeEditor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
        let textArray: string[] = text.split(eolCharacter);
        let reversedText = textArray.reverse(); /* Reverse the text as the expectation is that the symbol is usually closer to the cursor. */
        let tempSelection = selectionStart;
        let symbolsWithDepth: SymbolWithDepth[] = [];

        /* Create TEMPORARY objects, so the depth isn't stored globally */
        for (let symbol of configuredSymbols) {
            symbolsWithDepth.push(new SymbolWithDepth(symbol, 0));
        }

        for (let line = 0; line < reversedText.length; line++) {
            let symbolFoundInLine = false;
            let foundSymbols: [symbol: SymbolWithDepth, entry: EntryWithRangeInDepth][] = [];
            let newLine = selectionStart.line - line;
            if (newLine < 0) {
                break;
            }
            tempSelection = selectionStart.with(newLine, 0);
            for (let symbol of symbolsWithDepth) {
                let symbolInLine = SymbolFinder.getSymbolInLineWithDepthBefore(reversedText[line], symbol.symbol.startSymbol, symbol.symbol.endSymbol, tempSelection, symbol.depth);
                symbol.depth = symbolInLine.depth;
                if (symbolInLine.range) {
                    /* Symbols must be buffered and checked later in case there are multiple configured symbols on the same line. The latest one in the line needs to be taken. */
                    symbolFoundInLine = true;
                    foundSymbols.push([symbol, symbolInLine]);
                }
            }
            if (symbolFoundInLine) {
                let latestSymbolCharacter = Math.max(...foundSymbols.map(symbol => symbol[1].range!.start.character));
                let entry = foundSymbols.find((value) => {
                    return value[1].range!.start.character === latestSymbolCharacter;
                });
                return new SymbolWithRange(entry![0].symbol, entry![1].range!);
            }
        }
        return undefined;
    }


    /******************************************************************************************************************************************
    * Corrects the start position to the symbol. Will put the cursor before a starting symbol (includes it) and behind a closing symbol (includes it). Differentiates between forward and backward search
    *	activeEditor: Currently used editor
    *	selectionStart: Selection from where to start the search
    *	startSymbol: Symbol to search for
    *	offset: Offset where the symbol around the selection was found (Gives information where the symbol is relative to the cursor)
    ******************************************************************************************************************************************/
    public static findSymbolAtCursor(activeEditor: vscode.TextEditor, selectionStart: vscode.Position, configuredSymbols: HighlightSymbol[], isInsideOfOpeningSymbolIgnored: boolean, isInsideOfClosingSymbolIgnored: boolean): { symbolWithRange: SymbolWithRange | undefined, correctedPosition: vscode.Position, overrideScopeSearch: boolean } {
        let line = activeEditor.document.lineAt(selectionStart);
        let selectionRangeText = line.text;
        for (let symbol of configuredSymbols) {
            let indicesOfStartSymbol = SymbolFinder.regexIndicesOf(selectionRangeText, new RegExp(Util.makeRegexString(symbol.startSymbol), "g"));
            let indicesOfEndSymbol = SymbolFinder.regexIndicesOf(selectionRangeText, new RegExp(Util.makeRegexString(symbol.endSymbol), "g"));
            if (indicesOfStartSymbol.length > 0) {
                let indices = indicesOfStartSymbol.map((index) => index.start);
                let symbolLength = indicesOfStartSymbol[0].symbol.length;
                for (let index of indices) {
                    let cursorIsOutsideOfSymbol = (selectionStart.character >= index) && (selectionStart.character < (index + symbolLength));
                    let cursorIsInsideOfSymbol = (selectionStart.character > index) && (selectionStart.character === (index + symbolLength));
                    if (cursorIsInsideOfSymbol) {
                        if (isInsideOfOpeningSymbolIgnored) {
                            /* Move cursor to the very begining of the file, so nothing else will be found! */
                            return { symbolWithRange: undefined, correctedPosition: selectionStart.with(0, 0), overrideScopeSearch: false };
                        }
                        else {
                            return { symbolWithRange: undefined, correctedPosition: selectionStart.translate(0, 0), overrideScopeSearch: true };
                        }
                    }
                    if (cursorIsOutsideOfSymbol) {
                        let range = new vscode.Range(selectionStart.with(selectionStart.line, index), selectionStart.with(selectionStart.line, index + symbolLength));
                        return { symbolWithRange: new SymbolWithRange(symbol, range), correctedPosition: selectionStart, overrideScopeSearch: false };
                    }
                }
            }
            if (indicesOfEndSymbol.length > 0) {
                let indices = indicesOfEndSymbol.map((index) => index.start);
                let symbolLength = indicesOfEndSymbol[0].symbol.length;
                for (let index of indices) {
                    let cursorIsInsideOfSymbol = (selectionStart.character >= index) && (selectionStart.character < (index + symbolLength));
                    let cursorIsOutsideOfSymbol = (selectionStart.character > index) && (selectionStart.character === (index + symbolLength));
                    if (cursorIsOutsideOfSymbol) {
                        return { symbolWithRange: undefined, correctedPosition: selectionStart.translate(0, -symbolLength), overrideScopeSearch: true };
                    }
                    if (cursorIsInsideOfSymbol) {
                        if (isInsideOfClosingSymbolIgnored) {
                            /* Move cursor to the very begining of the file, so nothing else will be found! */
                            return { symbolWithRange: undefined, correctedPosition: selectionStart.with(0, 0), overrideScopeSearch: false };
                        }
                        else {
                            return { symbolWithRange: undefined, correctedPosition: selectionStart.with(selectionStart.line, index), overrideScopeSearch: true };
                        }
                    }
                }
            }
        }

        return { symbolWithRange: undefined, correctedPosition: selectionStart, overrideScopeSearch: false };
    }
    /**
     * 
     */
    public static findSymbolDownwards(activeEditor: vscode.TextEditor, targetSymbol: HighlightSymbol, selectionStart: vscode.Position, maxLineSearchCount: number): EntryWithRange | undefined {
        let eolCharacter = activeEditor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
        let tempSelection = selectionStart;
        let text: string[] = activeEditor.document.getText(new vscode.Range(tempSelection, selectionStart.translate(Math.min(...[maxLineSearchCount, activeEditor.document.lineCount])))).split(eolCharacter);
        let lineCounter = 0;

        /* Create TEMPORARY object, so the depth isn't stored globally */
        let symbolWithDepth: SymbolWithDepth = new SymbolWithDepth(targetSymbol, 0);

        for (let line of text) {
            let symbolInLine = SymbolFinder.getSymbolInLineWithDepthBehind(line, targetSymbol.endSymbol, targetSymbol.startSymbol, tempSelection, symbolWithDepth.depth);
            symbolWithDepth.depth = symbolInLine.depth;
            if (symbolInLine.range) {
                return new EntryWithRange(symbolInLine.symbol, symbolInLine.range);
            }
            lineCounter++;
            let newLine = selectionStart.line + lineCounter;
            if (newLine > activeEditor.document.lineCount) {
                return undefined;
            }
            tempSelection = selectionStart.with(newLine, 0);
        }
        return undefined;
    }

    /**
     * 
     */
    public static getSymbolInLineWithDepthBefore(line: string, entryToSearch: HighlightEntry, counterPartEntry: HighlightEntry, cursorPosition: vscode.Position, currentDepth: number): EntryWithRangeInDepth {
        let regexToCheck: RegExp = new RegExp(`${Util.makeRegexString(entryToSearch)}`, "g");
        let counterPartRegex: RegExp = new RegExp(`${Util.makeRegexString(counterPartEntry)}`, "g");
        let matchIndices = SymbolFinder.regexIndicesOf(line, regexToCheck);
        let counterPartIndices = SymbolFinder.regexIndicesOf(line, counterPartRegex);

        let allIndices = matchIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) {
            let line = cursorPosition.line;
            let pos1 = new vscode.Position(line, a.start);
            let pos2 = new vscode.Position(line, b.start);
            return pos1.compareTo(pos2);
        }).reverse();

        for (let i = 0; i < allIndices.length; i++) {
            if (matchIndices.includes(allIndices[i])) {
                currentDepth++;
                if (currentDepth === 1) {
                    let rangeStart = allIndices[i].start;
                    let rangeLength = allIndices[i].symbol.length;
                    return new EntryWithRangeInDepth(entryToSearch, new vscode.Range(cursorPosition.with(cursorPosition.line, rangeStart), cursorPosition.with(cursorPosition.line, rangeStart + rangeLength)), currentDepth);
                }
            }
            else {
                currentDepth--;
            }

        }

        return new EntryWithRangeInDepth(entryToSearch, undefined, currentDepth);
    }

    /**
     * 
     */
    public static getSymbolInLineWithDepthBehind(line: string, entryToSearch: HighlightEntry, counterPartEntry: HighlightEntry, cursorPosition: vscode.Position, currentDepth: number): EntryWithRangeInDepth {
        let regexToCheck: RegExp = new RegExp(`${Util.makeRegexString(entryToSearch)}`, "g");
        let counterPartRegex: RegExp = new RegExp(`${Util.makeRegexString(counterPartEntry)}`, "g");
        let matchIndices = SymbolFinder.regexIndicesOf(line, regexToCheck);
        let counterPartIndices = SymbolFinder.regexIndicesOf(line, counterPartRegex);

        let allIndices = matchIndices.concat(counterPartIndices);
        allIndices = allIndices.sort(function (a, b) { return new vscode.Position(cursorPosition.line, a.start).compareTo(new vscode.Position(cursorPosition.line, b.start)); });

        for (let i = 0; i < allIndices.length; i++) {
            if (matchIndices.includes(allIndices[i])) {
                currentDepth++;
                if (currentDepth === 1) {
                    let rangeStart = allIndices[i].start;
                    let rangeLength = allIndices[i].symbol.length;
                    return new EntryWithRangeInDepth(entryToSearch, new vscode.Range(cursorPosition.translate(0, rangeStart), cursorPosition.translate(0, rangeStart + rangeLength)), currentDepth);
                }
            }
            else {
                currentDepth--;
            }

        }

        return new EntryWithRangeInDepth(entryToSearch, undefined, currentDepth);
    }
}

export { SymbolFinder };
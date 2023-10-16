import * as vscode from 'vscode';
import { RangeIndex, SymbolAndContentRange } from './GlobalsHandler';
import { ConfigHandler, HighlightSymbol, JumpBetweenStrategy } from './ConfigHandler';
import { configCache } from './ConfigCache';
import { Util } from './Util';

/*
    foo() {
          ^ opening symbol / start symbol
         ^ start of opening symbol / outside of opening symbol
           ^ end of opening symbol / inside of opening symbol
    }
    ^ closing symbol / end symbol
   ^ start of closing symbol / inside of closing symbol
     ^ end of closing symbol / outside of closing symbol
*/

export default class HotkeyHandler {

  public onActivateHotkey() {
    configCache.extensionEnabled = !configCache.extensionEnabled;
    let configHandler = new ConfigHandler();
    configHandler.setExtensionEnabledStatus(configCache.extensionEnabled);
  }

  public onJumpOutOfOpeningSymbolHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[]) {
    if (ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions(ranges);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onJumpOutOfClosingSymbolHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[]) {
    if (ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getClosingSymbolOutsideSelectionPositions(ranges);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onJumpToOpeningSymbolHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[]) {
    if (ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getOpeningSymbolInsideSelectionPositions(ranges);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }
  public onJumpToClosingSymbolHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[]) {
    if (ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getClosingSymbolInsideSelectionPositions(ranges);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onjumpBetweenOpeningAndClosingSymbolsHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[], configuredSymbols: HighlightSymbol[]) {
    if (ranges.length <= 0) {
      return;
    }

    const cursorPositionsBySymbolRangePair = new Map<SymbolAndContentRange, vscode.Position>();
    for (let i = 0; i < activeEditor.selections.length; i++) {
      const cursorPosition = activeEditor.selections[i].active;
      for (let j = 0; j < ranges.length; j++) {
        const symbolRangePair = ranges[j];
        if (cursorPositionsBySymbolRangePair.has(symbolRangePair)) {
          continue;
        }
        if (symbolRangePair.symbolRanges[RangeIndex.OPENSYMBOL].contains(cursorPosition) || symbolRangePair.symbolRanges[RangeIndex.CLOSESYMBOL].contains(cursorPosition)) {
          cursorPositionsBySymbolRangePair.set(symbolRangePair, cursorPosition);
        }
      }
    }

    const newSelectionPositions: vscode.Position[] = [];
    for (const [symbolPair, cusorPosition] of cursorPositionsBySymbolRangePair) {
      let text = activeEditor.document.getText(symbolPair.symbolRanges[RangeIndex.OPENSYMBOL]);
      const highlightedOpenSymbol = this.getHighlightSymbolFromText(text, configuredSymbols);
      let strategy = highlightedOpenSymbol?.jumpBetweenStrategy;
      if (strategy === undefined)
        strategy = configCache.defaultJumpBetweenStrategy;
      const newCursorPosition = this.calculateOppositeCursorPosition(symbolPair, cusorPosition, strategy);
      newSelectionPositions.push(newCursorPosition);
    }
    this.setSelectionPositions(activeEditor, newSelectionPositions, true);
  }

  public onSelectTextBetweenSymbolsHotkey(activeEditor: vscode.TextEditor, ranges: SymbolAndContentRange[]) {
    if (ranges.length <= 0) {
      return;
    }
    let selectionRanges: vscode.Range[] = [];
    for (let index = 0; index < ranges.length; index++) {
      /* Do NOT use the contentRanges here, as they can be disabled! */
      let startRange = ranges[index].symbolRanges[RangeIndex.OPENSYMBOL].end;
      let endRange = ranges[index].symbolRanges[RangeIndex.CLOSESYMBOL].start;
      let range = new vscode.Range(startRange, endRange);
      selectionRanges.push(range);
    }
    this.setSelectionRanges(activeEditor, selectionRanges);
  }

  private getHighlightSymbolFromText(text: string, configuredSymbols: HighlightSymbol[]): HighlightSymbol | undefined {
    let highlightSymbol: HighlightSymbol | undefined = undefined;

    for (let symbol of configuredSymbols) {
      let regex = new RegExp(Util.makeRegexString(symbol.startSymbol), "g");
      if (regex.exec(text) !== null) {
        highlightSymbol = symbol;
      }
    }

    return highlightSymbol;
  }

  private getOpeningSymbolOutsideSelectionPositions(ranges: SymbolAndContentRange[]): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let range of ranges) {
      newSelectionPositions.push(range.symbolRanges[RangeIndex.OPENSYMBOL].start);
    }
    return newSelectionPositions;
  }

  private getClosingSymbolOutsideSelectionPositions(ranges: SymbolAndContentRange[]): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let range of ranges) {
      newSelectionPositions.push(range.symbolRanges[RangeIndex.CLOSESYMBOL].end);
    }
    return newSelectionPositions;
  }

  private getOpeningSymbolInsideSelectionPositions(ranges: SymbolAndContentRange[]): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let index = 0; index < ranges.length; index++) {
      newSelectionPositions.push(ranges[index].symbolRanges[RangeIndex.OPENSYMBOL].end);
    }
    return newSelectionPositions;
  }

  private getClosingSymbolInsideSelectionPositions(ranges: SymbolAndContentRange[]): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    if (ranges.length > 0) {
      for (let index = 0; index < ranges.length; index++) {
        newSelectionPositions.push(ranges[index].symbolRanges[RangeIndex.CLOSESYMBOL].start);
      }
    }
    return newSelectionPositions;
  }

  private calculateOppositeCursorPosition(symbolPairs: SymbolAndContentRange, cursorPosition: vscode.Position, strategy: JumpBetweenStrategy): vscode.Position {
    const opening = symbolPairs.symbolRanges[RangeIndex.OPENSYMBOL];
    const closing = symbolPairs.symbolRanges[RangeIndex.CLOSESYMBOL];
    let newCursorPosition: vscode.Position;

    if (strategy == JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE) {
      switch (cursorPosition) {
        case opening.start: newCursorPosition = closing.end; break;
        case closing.end: newCursorPosition = opening.start; break;
        case opening.end: newCursorPosition = closing.start; break;
        case closing.start: newCursorPosition = opening.end; break;
        default:
          if (opening.contains(cursorPosition)) {
            const distanceToStart = cursorPosition.character - opening.start.character;
            const distanceToEnd = opening.end.character - cursorPosition.character;
            if (distanceToStart < distanceToEnd)
              newCursorPosition = closing.end;
            else
              newCursorPosition = closing.start;
          }
          else if (closing.contains(cursorPosition)) {
            const distanceToStart = cursorPosition.character - closing.start.character;
            const distanceToEnd = closing.end.character - cursorPosition.character;
            if (distanceToStart < distanceToEnd)
              newCursorPosition = opening.end;
            else
              newCursorPosition = opening.start;
          }
          else {
            newCursorPosition = cursorPosition;
          }
      }
    }
    else {
      if (opening.contains(cursorPosition))
        newCursorPosition = closing.start;
      else if (closing.contains(cursorPosition))
        newCursorPosition = opening.start;
      else
        newCursorPosition = cursorPosition;
    }
    return newCursorPosition;
  }

  private setSelectionPositions(activeEditor: vscode.TextEditor, newPositions: vscode.Position[], revealRange: boolean = false) {
    let newSelections: vscode.Selection[] = [];
    for (let i = 0; i < newPositions.length; i++) {
      newSelections.push(new vscode.Selection(newPositions[i], newPositions[i]));
    }
    if (newSelections.length > 0) {
      activeEditor.selections = newSelections;
      if (revealRange) {
        activeEditor.revealRange(activeEditor.selections[0]);
      }
    }
  }
  private setSelectionRanges(activeEditor: vscode.TextEditor, newRanges: vscode.Range[]) {
    let newSelections: vscode.Selection[] = [];
    for (let i = 0; i < newRanges.length; i++) {
      newSelections.push(new vscode.Selection(newRanges[i].end, newRanges[i].start));
    }
    if (newSelections.length > 0) {
      activeEditor.selections = newSelections;
    }
  }
}

export { HotkeyHandler };
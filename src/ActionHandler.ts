import * as vscode from 'vscode';
import { RangeIndex, bracketHighlightGlobals } from './GlobalsHandler';
import { ConfigHandler, HighlightEntry, HighlightSymbol, JumpBetweenStrategy } from './ConfigHandler';
import { configCache } from './ConfigCache';
import { Util } from './Util';
import assert = require('assert');
import SymbolFinder from './SymbolFinder';

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

type SymbolRangePair = [opening: vscode.Range, closing: vscode.Range];

export default class HotkeyHandler {

  public onActivateHotkey(activeEditor: vscode.TextEditor) {
    configCache.extensionEnabled = !configCache.extensionEnabled;
    let configHandler = new ConfigHandler();
    configHandler.setExtensionEnabledStatus(configCache.extensionEnabled);
  }

  public onJumpOutOfOpeningSymbolHotkey(activeEditor: vscode.TextEditor) {
    if (bracketHighlightGlobals.ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions(activeEditor);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onJumpOutOfClosingSymbolHotkey(activeEditor: vscode.TextEditor) {
    if (bracketHighlightGlobals.ranges.length <= 0) {
      return;
    }
    let newSelectionPositions = this.getClosingSymbolOutsideSelectionPositions(activeEditor);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onJumpToOpeningSymbolHotkey(activeEditor: vscode.TextEditor) {
    if (this.isRangesEmpty()) {
      return;
    }
    let newSelectionPositions = this.getOpeningSymbolInsideSelectionPositions(activeEditor);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }
  public onJumpToClosingSymbolHotkey(activeEditor: vscode.TextEditor) {
    if (this.isRangesEmpty()) {
      return;
    }
    let newSelectionPositions = this.getClosingSymbolInsideSelectionPositions(activeEditor);
    this.setSelectionPositions(activeEditor, newSelectionPositions);
  }

  public onjumpBetweenOpeningAndClosingSymbolsHotkey(activeEditor: vscode.TextEditor) {
    if (this.isRangesEmpty()) {
      return;
    }

    const openingOutsideSelectionPositions = this.getOpeningSymbolOutsideSelectionPositions(activeEditor);
    const closingOutsideSelectionPositions = this.getClosingSymbolOutsideSelectionPositions(activeEditor);
    const openingInsideSelectionPositions = this.getOpeningSymbolInsideSelectionPositions(activeEditor);
    const closingInsideSelectionPositions = this.getClosingSymbolInsideSelectionPositions(activeEditor);
    assert(openingOutsideSelectionPositions.length === openingInsideSelectionPositions.length
      && closingOutsideSelectionPositions.length === closingInsideSelectionPositions.length
      && openingOutsideSelectionPositions.length === closingInsideSelectionPositions.length);
    assert(openingOutsideSelectionPositions[0].line === openingInsideSelectionPositions[0].line);
    assert(closingOutsideSelectionPositions[0].line === closingInsideSelectionPositions[0].line);

    const symbolRangePairs: SymbolRangePair[] = [];
    for (let i = 0; i < openingOutsideSelectionPositions.length; i++) {
      const openingSymbolRange = new vscode.Range(openingOutsideSelectionPositions[i], openingInsideSelectionPositions[i]);
      const closingSymbolRange = new vscode.Range(closingInsideSelectionPositions[i], closingOutsideSelectionPositions[i]);
      const symbolRangePair: SymbolRangePair = [openingSymbolRange, closingSymbolRange];
      symbolRangePairs.push(symbolRangePair);
    }

    const cursorPositionsBySymbolRangePair = new Map<SymbolRangePair, vscode.Position>();
    for (let i = 0; i < activeEditor.selections.length; i++) {
      const cursorPosition = activeEditor.selections[i].active;
      for (let j = 0; j < symbolRangePairs.length; j++) {
        const symbolRangePair = symbolRangePairs[j];
        if (cursorPositionsBySymbolRangePair.has(symbolRangePair)) {
          continue;
        }
        if (symbolRangePair[0].contains(cursorPosition) || symbolRangePair[1].contains(cursorPosition)) {
          cursorPositionsBySymbolRangePair.set(symbolRangePair, cursorPosition);
        }
      }
    }

    const newSelectionPositions: vscode.Position[] = [];
    for (const [symbolPair, cusorPosition] of cursorPositionsBySymbolRangePair) {
      const highlightedOpenSymbol = activeEditor.document.getText(symbolPair[0]);
      let strategy = configCache.preferredJumpBetweenStrategiesBySymbol.get(highlightedOpenSymbol);
      if (strategy === undefined)
        strategy = configCache.defaultJumpBetweenStrategy;
      const newCursorPosition = this.calculateOppositeCursorPosition(symbolPair, cusorPosition, strategy);
      newSelectionPositions.push(newCursorPosition);
    }
    this.setSelectionPositions(activeEditor, newSelectionPositions, true);
  }

  public onSelectTextBetweenSymbolsHotkey(activeEditor: vscode.TextEditor) {
    if (this.isRangesEmpty()) {
      return;
    }
    let selectionRanges: vscode.Range[] = [];
    for (let index = 0; index < bracketHighlightGlobals.ranges.length; index++) {
      let range = bracketHighlightGlobals.ranges[index];
      selectionRanges.push(range.contentRanges[index]);
    }
    this.setSelectionRanges(activeEditor, selectionRanges);
  }

  private isRangesEmpty(): boolean {
    return bracketHighlightGlobals.ranges.length <= 0;
  }

  private getOpeningSymbolOutsideSelectionPositions(activeEditor: vscode.TextEditor): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let range of bracketHighlightGlobals.ranges) {
      newSelectionPositions.push(range.symbolRanges[RangeIndex.OPENSYMBOL].start);
    }
    return newSelectionPositions;
  }

  private getClosingSymbolOutsideSelectionPositions(activeEditor: vscode.TextEditor): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let range of bracketHighlightGlobals.ranges) {
      newSelectionPositions.push(range.symbolRanges[RangeIndex.CLOSESYMBOL].end);
    }
    return newSelectionPositions;
  }

  private getOpeningSymbolInsideSelectionPositions(activeEditor: vscode.TextEditor): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    for (let index = 0; index < bracketHighlightGlobals.ranges.length; index++) {
      newSelectionPositions.push(bracketHighlightGlobals.ranges[index].symbolRanges[RangeIndex.OPENSYMBOL].end);
    }
    return newSelectionPositions;
  }

  private getClosingSymbolInsideSelectionPositions(activeEditor: vscode.TextEditor): vscode.Position[] {
    let newSelectionPositions: vscode.Position[] = [];
    if (activeEditor && bracketHighlightGlobals.ranges.length > 0) {
      for (let index = 0; index < bracketHighlightGlobals.ranges.length; index++) {
        newSelectionPositions.push(bracketHighlightGlobals.ranges[index].symbolRanges[RangeIndex.CLOSESYMBOL].start);
      }
    }
    return newSelectionPositions;
  }

  private calculateOppositeCursorPosition(symbolPairs: SymbolRangePair, cursorPosition: vscode.Position, strategy: JumpBetweenStrategy): vscode.Position {
    const opening = symbolPairs[0];
    const closing = symbolPairs[1];
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
            assert(distanceToStart >= 0);
            assert(distanceToEnd >= 0);
            if (distanceToStart < distanceToEnd)
              newCursorPosition = closing.end;
            else
              newCursorPosition = closing.start;
          }
          else if (closing.contains(cursorPosition)) {
            const distanceToStart = cursorPosition.character - closing.start.character;
            const distanceToEnd = closing.end.character - cursorPosition.character;
            assert(distanceToStart >= 0);
            assert(distanceToEnd >= 0);
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
      let startOffset = 1;
      let endOffset = -1;
      if (newRanges[i].end.character === 0) {
        endOffset = 0;
      }
      newSelections.push(new vscode.Selection(newRanges[i].end.translate(0, endOffset), newRanges[i].start.translate(0, startOffset)));
    }
    activeEditor.selections = newSelections;
  }
}

export { HotkeyHandler };
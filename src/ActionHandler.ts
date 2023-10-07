import * as vscode from 'vscode';
import { bracketHighlightGlobals } from './GlobalsHandler';
import { ConfigHandler, JumpBetweenStrategy } from './ConfigHandler';
import * as Util from './Util';
import assert = require('assert');

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
}

export { HotkeyHandler };
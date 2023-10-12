import * as vscode from 'vscode';

export const enum DecorationStatus {
    active,
    inactive
}

export class SymbolAndContentRange {
    constructor(
        public symbolRanges: vscode.Range[],
        public contentRanges: vscode.Range[]) { }
}

export default class GlobalsHandler {

    public decorationStatus: DecorationStatus;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public handleTextSelectionEventActive: boolean;
    public disableTimer: any;
    public ranges: SymbolAndContentRange[];
    public lastSelection!: vscode.Selection | undefined;

    constructor() {
        this.decorationStatus = DecorationStatus.inactive;
        this.decorationTypes = [];
        this.handleTextSelectionEventActive = true;
        this.disableTimer = <any>null;
        this.ranges = [];
    }
}

var bracketHighlightGlobals: GlobalsHandler = new GlobalsHandler();

export { bracketHighlightGlobals };
import * as vscode from 'vscode';

export const enum DecorationStatus {
    active,
    inactive
}

export default class GlobalsHandler {

    public decorationStatus: DecorationStatus;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public handleTextSelectionEventActive: boolean;
    public disableTimer: any;
    public symbolRanges: vscode.Range[];
    public contentRanges: vscode.Range[];
    public lastSelection!: vscode.Selection | undefined;

    constructor() {
        this.decorationStatus = DecorationStatus.inactive;
        this.decorationTypes = [];
        this.handleTextSelectionEventActive = true;
        this.disableTimer = <any>null;
        this.symbolRanges = [];
        this.contentRanges = [];
    }
}

var bracketHighlightGlobals: GlobalsHandler = new GlobalsHandler();

export { bracketHighlightGlobals };
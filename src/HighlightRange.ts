import * as vscode from 'vscode';

export default class HighlightRange {

    public decorationType: vscode.TextEditorDecorationType;
    public decorationRange: vscode.Range;

    constructor(range: vscode.Range, decorationType: vscode.TextEditorDecorationType) {
        this.decorationType = decorationType;
        this.decorationRange = range;
    }
}

export { HighlightRange };
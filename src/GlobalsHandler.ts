import * as vscode from 'vscode';

export default class GlobalsHandler {

    public decorationStatus: boolean;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;

    constructor() {
        this.decorationStatus = false;
        this.decorationTypes = [];
    }
}

export { GlobalsHandler };
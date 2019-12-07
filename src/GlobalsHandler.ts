import * as vscode from 'vscode';
import DecorationHandler from './DecorationHandler';

export enum SearchDirection {
    FORWARDS,
    BACKWARDS
}

export default class GlobalsHandler {

    public decorationStatus: boolean;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public searchDirection: SearchDirection;

    constructor() {
        this.decorationStatus = false;
        this.decorationTypes = [];
        this.searchDirection = SearchDirection.FORWARDS;
    }
}

export { GlobalsHandler };
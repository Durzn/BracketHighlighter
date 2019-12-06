import * as vscode from 'vscode';
import HighlightRange from './HighlightRange';
import DecorationHandler from './DecorationHandler';

export enum SearchDirection {
    FORWARDS,
    BACKWARDS
}

export default class GlobalsHandler {

    public decorationStatus: boolean;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public highlightedRanges: Array<HighlightRange>;
    public searchDirection: SearchDirection;
    public decorationHandler: DecorationHandler;
    public currentlyHighlightedRanges: Array<HighlightRange>;
    public blurredRanges: Array<HighlightRange>;

    constructor(decorationHandler: DecorationHandler) {
        this.decorationStatus = false;
        this.decorationTypes = [];
        this.highlightedRanges = [];
        this.searchDirection = SearchDirection.FORWARDS;
        this.decorationHandler = decorationHandler;
        this.currentlyHighlightedRanges = [];
        this.blurredRanges = [];
    }
}

export { GlobalsHandler };
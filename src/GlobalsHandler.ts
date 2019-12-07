import * as vscode from 'vscode';
<<<<<<< Updated upstream
import HighlightRange from './HighlightRange';
=======
>>>>>>> Stashed changes
import DecorationHandler from './DecorationHandler';

export enum SearchDirection {
    FORWARDS,
    BACKWARDS
}

export default class GlobalsHandler {

    public decorationStatus: boolean;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
<<<<<<< Updated upstream
    public highlightedRanges: Array<HighlightRange>;
    public searchDirection: SearchDirection;
    public decorationHandler: DecorationHandler;
    public currentlyHighlightedRanges: Array<HighlightRange>;
    public blurredRanges: Array<HighlightRange>;
=======
    public searchDirection: SearchDirection;
>>>>>>> Stashed changes

    constructor(decorationHandler: DecorationHandler) {
        this.decorationStatus = false;
        this.decorationTypes = [];
<<<<<<< Updated upstream
        this.highlightedRanges = [];
        this.searchDirection = SearchDirection.FORWARDS;
        this.decorationHandler = decorationHandler;
        this.currentlyHighlightedRanges = [];
        this.blurredRanges = [];
=======
        this.searchDirection = SearchDirection.FORWARDS;
>>>>>>> Stashed changes
    }
}

export { GlobalsHandler };
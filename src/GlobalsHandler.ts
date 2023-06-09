import * as vscode from 'vscode';
import { DecorationType } from './DecorationHandler';
import DecorationOptions from './DecorationOptions';
import ConfigHandler from './ConfigHandler';

const enum SearchDirection {
    FORWARDS,
    BACKWARDS
}

export default class GlobalsHandler {

    public configHandler: ConfigHandler;

    public decorationStatus: boolean;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public searchDirection: SearchDirection;
    public handleTextSelectionEventActive: boolean;
    public disableTimer: any;
    public highlightRanges: Array<vscode.Range>[];
    public highlightSymbols: Array<string>;

    /* Config parameters */
    public textColor!: string;
    public blurOutOfScopeText!: boolean;
    public opacity!: string;
    public activeWhenDebugging!: boolean;
    public maxLineSearchCount!: number;
    public symbolDecorationOptions!: DecorationOptions;
    public contentDecorationOptions!: DecorationOptions;
    public enabledLanguages!: Array<string>;
    public reverseSearchEnabled!: boolean;
    public allowedStartSymbols!: Array<string>;
    public allowedEndSymbols!: Array<string>;
    public highlightScopeFromText!: boolean;
    public extensionEnabled!: boolean;
    public lastSelection!: vscode.Selection | undefined;
    public timeOutValue!: number;
    public ignoreContent!: boolean;
    public regexMode!: boolean;
    public isInsideOfSymboIgnored!: boolean;


    constructor() {
        this.configHandler = new ConfigHandler();
        this.decorationStatus = false;
        this.decorationTypes = [];
        this.searchDirection = SearchDirection.FORWARDS;
        this.handleTextSelectionEventActive = true;
        this.disableTimer = <any>null;
        this.highlightRanges = [];
        this.highlightSymbols = [];

        this.onConfigChange();
    }

    public onConfigChange() {
        /* Config parameters */
        this.blurOutOfScopeText = this.configHandler.blurOutOfScopeText();
        this.opacity = this.configHandler.getOpacity();
        this.textColor = this.configHandler.getTextColor();
        this.activeWhenDebugging = this.configHandler.activeWhenDebugging();
        this.maxLineSearchCount = this.configHandler.getMaxLineSearchCount();
        this.symbolDecorationOptions = this.configHandler.getDecorationOptions(DecorationType.SYMBOLS);
        this.contentDecorationOptions = this.configHandler.getDecorationOptions(DecorationType.CONTENT);
        this.enabledLanguages = this.configHandler.getEnabledLanguages();
        this.reverseSearchEnabled = this.configHandler.reverseSearchEnabled();
        this.allowedStartSymbols = this.configHandler.getAllowedStartSymbols();
        this.allowedEndSymbols = this.configHandler.getAllowedEndSymbols();
        this.highlightScopeFromText = this.configHandler.highlightScopeFromText();
        this.extensionEnabled = this.configHandler.isExtensionEnabled();
        this.timeOutValue = this.configHandler.getTimeOutValue();
        this.ignoreContent = this.configHandler.ignoreContent();
        this.regexMode = this.configHandler.regexMode();
        this.isInsideOfSymboIgnored = this.configHandler.isInsideOfSymboIgnored();
    }
}

var bracketHighlightGlobals: GlobalsHandler = new GlobalsHandler();

export { bracketHighlightGlobals, SearchDirection };
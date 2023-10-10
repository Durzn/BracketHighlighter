import * as vscode from 'vscode';
import { DecorationType } from './DecorationHandler';
import DecorationOptions from './DecorationOptions';
import { ConfigHandler, HighlightSymbol, JumpBetweenStrategy } from './ConfigHandler';

const enum SearchDirection {
    FORWARDS,
    BACKWARDS
}

export const enum DecorationStatus {
    active,
    inactive
}

export default class GlobalsHandler {

    public configHandler: ConfigHandler;

    public decorationStatus: DecorationStatus;
    public decorationTypes: Array<vscode.TextEditorDecorationType>;
    public handleTextSelectionEventActive: boolean;
    public disableTimer: any;
    public highlightRanges: vscode.Range[];

    /* Config parameters */
    public configuredSymbols!: HighlightSymbol[];
    public textColor!: string;
    public blurOutOfScopeText!: boolean;
    public opacity!: string;
    public activeWhenDebugging!: boolean;
    public maxLineSearchCount!: number;
    public symbolDecorationOptions!: DecorationOptions;
    public contentDecorationOptions!: DecorationOptions;
    public enabledLanguages!: Array<string>;
    public extensionEnabled!: boolean;
    public lastSelection!: vscode.Selection | undefined;
    public timeOutValue!: number;
    public ignoreContent!: boolean;
    public defaultJumpBetweenStrategy!: JumpBetweenStrategy;
    public preferredJumpBetweenStrategiesBySymbol!: Map<string, JumpBetweenStrategy>;


    constructor() {
        this.configHandler = new ConfigHandler();
        this.decorationStatus = DecorationStatus.inactive;
        this.decorationTypes = [];
        this.handleTextSelectionEventActive = true;
        this.disableTimer = <any>null;
        this.highlightRanges = [];

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
        this.extensionEnabled = this.configHandler.isExtensionEnabled();
        this.timeOutValue = this.configHandler.getTimeOutValue();
        this.ignoreContent = this.configHandler.ignoreContent();
        this.defaultJumpBetweenStrategy = this.configHandler.defaultJumpBetweenStrategy();
        this.preferredJumpBetweenStrategiesBySymbol = this.configHandler.preferredJumpBetweenStrategiesBySymbol();
        this.configuredSymbols = this.configHandler.getConfiguredSymbols();

    }
}

var bracketHighlightGlobals: GlobalsHandler = new GlobalsHandler();

export { bracketHighlightGlobals, SearchDirection };
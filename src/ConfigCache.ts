import { Selection } from "vscode";
import ConfigHandler, { HighlightSymbol, JumpBetweenStrategy } from "./ConfigHandler";
import { DecorationType } from "./DecorationHandler";
import DecorationOptions from "./DecorationOptions";

export default class ConfigCache {

    public configHandler: ConfigHandler;

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
    public timeOutValue!: number;
    public ignoreContent!: boolean;
    public defaultJumpBetweenStrategy!: JumpBetweenStrategy;
    public preferredJumpBetweenStrategiesBySymbol!: Map<string, JumpBetweenStrategy>;


    constructor() {
        this.configHandler = new ConfigHandler();
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

var configCache: ConfigCache = new ConfigCache();

export { configCache };
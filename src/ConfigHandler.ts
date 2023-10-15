import * as vscode from 'vscode';
import { DecorationType } from './DecorationHandler';
import DecorationOptions from './DecorationOptions';

export enum JumpBetweenStrategy {
    TO_SYMBOL_START = "toSymbolStart",
    TO_SYMBOL_OPPOSITE_SIDE = "toSymbolOppositeSide"
}

export class HighlightEntry {
    constructor(public readonly symbol: string, public readonly isRegex: boolean, public readonly canBeSubstring: boolean) {

    }
}

export class HighlightSymbol {
    constructor(public readonly startSymbol: HighlightEntry, public readonly endSymbol: HighlightEntry, public readonly jumpBetweenStrategy: JumpBetweenStrategy) { }
}

export default class ConfigHandler {
    constructor() { }

    private getConfiguration() {
        return vscode.workspace.getConfiguration("BracketHighlighter", null);
    }

    public blurOutOfScopeText(): boolean {
        const config = this.getConfiguration();
        let blurOutOfScopeText: boolean | undefined = config.get("blurOutOfScopeText");
        if (blurOutOfScopeText === undefined) {
            blurOutOfScopeText = false;
        }
        return blurOutOfScopeText;
    }

    public getOpacity(): string {
        const config = this.getConfiguration();
        let opacity: string | undefined = config.get("blurOpacity");
        if (opacity === undefined) {
            opacity = '0.5';
        }
        return opacity;
    }

    public activeWhenDebugging(): boolean {
        const config = this.getConfiguration();
        let activeInDebug: boolean | undefined = config.get("activeInDebugMode");
        if (activeInDebug === undefined) {
            activeInDebug = true;
        }
        return activeInDebug;
    }

    public getMaxLineSearchCount(): number {
        const config = this.getConfiguration();
        let maxLineSearchCount: number | undefined = config.get("maxLineSearchCount");
        if (maxLineSearchCount === undefined) {
            maxLineSearchCount = 1000;
        }
        return maxLineSearchCount;
    }

    public highlightScopeFromText(): boolean {
        const config = this.getConfiguration();
        let highlightScopeFromText: boolean | undefined = config.get("highlightScopeFromText");
        if (highlightScopeFromText === undefined) {
            highlightScopeFromText = false;
        }
        return highlightScopeFromText;
    }

    public isInsideOfOpeningSymbolIgnored(): boolean {
        const config = this.getConfiguration();
        let isIgnored: boolean | undefined = config.get("isInsideOfOpeningSymbolIgnored");
        if (isIgnored === undefined) {
            isIgnored = false;
        }
        return isIgnored
    }

    public isInsideOfClosingSymbolIgnored(): boolean {
        const config = this.getConfiguration();
        let isIgnored: boolean | undefined = config.get("isInsideOfClosingSymbolIgnored");
        if (isIgnored === undefined) {
            isIgnored = false;
        }
        return isIgnored
    }

    public getDecorationOptions(decorationType: DecorationType): DecorationOptions {
        const config = this.getConfiguration();
        let fontWeight: string | undefined = undefined;
        let fontStyle: string | undefined = undefined;
        let letterSpacing: string | undefined = undefined;
        let outline: string | undefined = undefined;
        let border: string | undefined = undefined;
        let backgroundColor: string | undefined = undefined;
        let textDecoration: string | undefined = undefined;
        let textColor: string | undefined = undefined;
        if (decorationType === DecorationType.SYMBOLS && this.isDifferentSymbolHighlightingUsed()) {
            fontWeight = config.get("fontWeightSymbol");
            fontStyle = config.get("fontStyleSymbol");
            letterSpacing = config.get("letterSpacingSymbol");
            outline = config.get("outlineSymbol");
            border = config.get("borderSymbol");
            backgroundColor = config.get("backgroundColorSymbol");
            textDecoration = config.get("textDecorationSymbol");
            textColor = config.get("textColorSymbol");
        }
        else {
            fontWeight = config.get("fontWeight");
            fontStyle = config.get("fontStyle");
            letterSpacing = config.get("letterSpacing");
            outline = config.get("outline");
            border = config.get("border");
            backgroundColor = config.get("backgroundColor");
            textDecoration = config.get("textDecoration");
            textColor = config.get("textColor");
        }
        return new DecorationOptions(fontWeight, fontStyle, letterSpacing, outline, border, textDecoration, backgroundColor, textColor);
    }

    private isDifferentSymbolHighlightingUsed(): boolean {
        const config = this.getConfiguration();
        let differentHighlightingUsed: boolean | undefined = config.get("differentSymbolHighlightingUsed");
        if (!differentHighlightingUsed) {
            differentHighlightingUsed = false;
        }
        return differentHighlightingUsed;
    }

    public getEnabledLanguages(): Array<string> {
        const config = this.getConfiguration();
        let allowedLanguageIdString: string | undefined = config.get("allowedLanguageIds");
        if (allowedLanguageIdString === undefined) {
            return [];
        }
        allowedLanguageIdString = allowedLanguageIdString.replace(/\s/g, "");
        let allowedLanguageIds: Array<string> = allowedLanguageIdString.split(",");
        return allowedLanguageIds;
    }

    private getAcceptedSymbols(configuredSymbols: any[]): HighlightSymbol[] {
        let acceptedSymbols: HighlightSymbol[] = [];
        for (let customSymbol of configuredSymbols) {
            if (customSymbol.hasOwnProperty("highlightPair")) {
                let entries: HighlightEntry[] = [];
                let strategy = customSymbol.hasOwnProperty("jumpBetweenStrategy") ? customSymbol.jumpBetweenStrategy : this.getDefaultJumpBetweenStrategy();
                for (let pair of customSymbol.highlightPair) {
                    if (pair.hasOwnProperty("symbol")) {
                        let isRegex = pair.hasOwnProperty("isRegex") ? pair.isRegex : false;
                        let canBeSubstring = pair.hasOwnProperty("canBeSubstring") ? pair.canBeSubstring : false;
                        if (isRegex) {
                            canBeSubstring = false;
                        }

                        entries.push(new HighlightEntry(pair.symbol, isRegex, canBeSubstring));
                    }
                }
                if (entries.length === 2) {
                    acceptedSymbols.push(new HighlightSymbol(entries[0], entries[1], strategy));
                }
            }
        }
        return acceptedSymbols;
    }

    public getConfiguredSymbols(): HighlightSymbol[] {
        const config = this.getConfiguration();
        let configuredSymbols: any[] | undefined = config.get("customSymbols");
        if (configuredSymbols === undefined) {
            configuredSymbols = [];
        }
        return this.getAcceptedSymbols(configuredSymbols);
    }

    public isExtensionEnabled(): boolean {
        const config = this.getConfiguration();
        let extensionEnabled: boolean | undefined = config.get("enableExtension");
        if (extensionEnabled === undefined) {
            extensionEnabled = true;
        }
        return extensionEnabled;
    }

    public setExtensionEnabledStatus(extensionEnabled: boolean) {
        let config = this.getConfiguration();
        config.update("enableExtension", extensionEnabled);
    }

    public getTimeOutValue(): number {
        let config = this.getConfiguration();
        let timeOutValue: number | undefined = config.get("timeOutValue");
        if (timeOutValue === undefined) {
            timeOutValue = 600;
        }
        return timeOutValue;
    }

    public ignoreContent(): boolean {
        let config = this.getConfiguration();
        let ignoreContent: boolean | undefined = config.get("ignoreContent");
        if (ignoreContent === undefined) {
            ignoreContent = true;
        }
        return ignoreContent;
    }

    public getTextColor(): string {
        const config = this.getConfiguration();
        let textColor: string | undefined = config.get("textColor");
        if (textColor === undefined) {
            textColor = '';
        }
        return textColor;
    }

    public getDefaultJumpBetweenStrategy(): JumpBetweenStrategy {
        let config = this.getConfiguration();
        let strategy: JumpBetweenStrategy;
        let strategyStr: string | undefined = config.get("defaultJumpBetweenStrategy");
        let defaultStrategy: JumpBetweenStrategy = JumpBetweenStrategy.TO_SYMBOL_START;
        if (strategyStr === undefined) {
            strategy = defaultStrategy;
        }
        else {
            const allStrategies = Object.values(JumpBetweenStrategy);
            strategy = strategyStr as JumpBetweenStrategy;
            const isValidStrategy = allStrategies.indexOf(strategy) >= 0;
            if (!isValidStrategy) {
                strategy = defaultStrategy;
            }
        }
        return strategy;
    }

    public preferredJumpBetweenStrategiesBySymbol(): Map<string, JumpBetweenStrategy> {
        const config = this.getConfiguration();
        const map = new Map<string, JumpBetweenStrategy>();
        const customSymbols: any = config.get("customSymbols");
        if (Array.isArray(customSymbols)) {
            const allStrategies = Object.values(JumpBetweenStrategy);
            for (let customSymbol of customSymbols) {
                const isGoodSymbolPairs =
                    customSymbol.hasOwnProperty("open") &&
                    customSymbol.hasOwnProperty("close") &&
                    customSymbol.open !== customSymbol.close;
                if (isGoodSymbolPairs) {
                    if (customSymbol.hasOwnProperty("preferredJumpBetweenStrategy")) {
                        const strategyStr = customSymbol.preferredJumpBetweenStrategy;
                        const strategy = strategyStr as JumpBetweenStrategy;
                        const isValidStrategy = allStrategies.indexOf(strategy) >= 0;
                        if (isValidStrategy) {
                            // Let's be lazy and use the open as the key. I think it's okay for now.
                            map.set(customSymbol.open, strategy);
                        }
                    }
                }
            }
        }
        return map;
    }
}

export { ConfigHandler };
import * as vscode from 'vscode';
import * as DecorationOptions from "./DecorationHandler";

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

    public getDecorationOptions(): DecorationOptions.DecorationOptions {
        const config = this.getConfiguration();
        let fontWeight: string | undefined = config.get("fontWeight");
        let fontStyle: string | undefined = config.get("fontStyle");
        let letterSpacing: string | undefined = config.get("letterSpacing");
        let outline: string | undefined = config.get("outline");
        let border: string | undefined = config.get("border");
        let backgroundColor: string | undefined = config.get("backgroundColor");
        let textDecoration: string | undefined = config.get("textDecoration");
        return new DecorationOptions.DecorationOptions(fontWeight, fontStyle, letterSpacing, outline, border, textDecoration, backgroundColor);
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

    public reverseSearchEnabled(): boolean {
        const config = this.getConfiguration();
        let reverseSearchEnabled: boolean | undefined = config.get("reverseSearchEnabled");
        if (reverseSearchEnabled === undefined) {
            reverseSearchEnabled = true;
        }
        return reverseSearchEnabled;
    }

    public getAllowedStartSymbols(): Array<string> {
        const config = this.getConfiguration();
        let validStartSymbols: Array<string> = [];
        let useForSymbols: boolean | undefined;
        useForSymbols = config.get("useParentheses");
        if (useForSymbols === true) {
            validStartSymbols.push("(");
        }
        useForSymbols = config.get("useBraces");
        if (useForSymbols === true) {
            validStartSymbols.push("{");
        }
        useForSymbols = config.get("useBrackets");
        if (useForSymbols === true) {
            validStartSymbols.push("[");
        }
        useForSymbols = config.get("useAngularBrackets");
        if (useForSymbols === true) {
            validStartSymbols.push("<");

        }
        return validStartSymbols;
    }

    public getAllowedEndSymbols(): Array<string> {
        const config = this.getConfiguration();
        let validEndSymbols: Array<string> = [];
        let useForSymbols: boolean | undefined;
        useForSymbols = config.get("useParentheses");
        if (useForSymbols === true) {
            validEndSymbols.push(")");
        }
        useForSymbols = config.get("useBraces");
        if (useForSymbols === true) {
            validEndSymbols.push("}");
        }
        useForSymbols = config.get("useBrackets");
        if (useForSymbols === true) {
            validEndSymbols.push("]");
        }
        useForSymbols = config.get("useAngularBrackets");
        if (useForSymbols === true) {
            validEndSymbols.push(">");
        }

        return validEndSymbols;
    }

}

export { ConfigHandler };
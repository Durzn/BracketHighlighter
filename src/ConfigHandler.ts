const vscode = require('vscode');
import * as DecorationOptions from "./DecorationHandler";

export default class ConfigHandler {
    constructor() { }

    private getConfiguration() {
        return vscode.workspace.getConfiguration("BracketHighlighter", null);
    }

    public blurOutOfScopeText(): boolean {
        const config = this.getConfiguration();
        return config.get("blurOutOfScopeText");
    }

    public getOpacity(): string {
        const config = this.getConfiguration();
        return config.get("blurOpacity");
    }

    public activeWhenDebugging(): boolean {
        const config = this.getConfiguration();
        return config.get("activeInDebugMode");
    }

    public getDecorationOptions() {
        const config = this.getConfiguration();
        let fontWeight = config.get("fontWeight");
        let fontStyle = config.get("fontStyle");
        let letterSpacing = config.get("letterSpacing");
        let outline = config.get("outline");
        let border = config.get("border");
        let backgroundColor = config.get("backgroundColor");
        let textDecoration = config.get("textDecoration");
        return new DecorationOptions.DecorationOptions(fontWeight, fontStyle, letterSpacing, outline, border, textDecoration, backgroundColor);
    }

    public isLanguageEnabled(languageId: string): boolean {
        const config = this.getConfiguration();
        let allowedLanguageIdString: string = config.get("allowedLanguageIds");
        allowedLanguageIdString = allowedLanguageIdString.replace(/\s/g, "");
        let allowedLanguageIds: Array<string> = allowedLanguageIdString.split(",");
        if (allowedLanguageIds.includes(languageId) || allowedLanguageIdString === "") {
            return true;
        }
        return false;
    }

    public reverseSearchEnabled(): boolean {
        const config = this.getConfiguration();
        return config.get("reverseSearchEnabled");
    }

    public getAllowedStartSymbols(): Array<string> {
        const config = this.getConfiguration();
        let validStartSymbols: Array<string> = [];
        let useForSymbols: boolean;
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
        let useForSymbols: boolean;
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
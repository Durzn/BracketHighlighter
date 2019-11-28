import * as vscode from 'vscode';
import * as ConfigHandler from './ConfigHandler';

export default class DecorationHandler {
    public getDecorationType(): vscode.TextEditorDecorationType {
        let configHandler = new ConfigHandler.ConfigHandler();
        let decorationOptions = configHandler.getDecorationOptions();
        let decorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            fontWeight: decorationOptions.fontWeight,
            fontStyle: decorationOptions.fontStyle,
            letterSpacing: decorationOptions.letterSpacing,
            outline: decorationOptions.outline,
            border: decorationOptions.border,
            textDecoration: decorationOptions.textDecoration,
            backgroundColor: decorationOptions.backgroundColor,
            overviewRulerLane: vscode.OverviewRulerLane.Left,
            overviewRulerColor: decorationOptions.backgroundColor,
        });
        return decorationType;
    }
}

export class DecorationOptions {
    public readonly fontWeight?: string;
    public readonly fontStyle?: string;
    public readonly letterSpacing?: string;
    public readonly outline?: string;
    public readonly border?: string;
    public readonly backgroundColor?: string;
    public readonly textDecoration?: string;
    public readonly overviewColor?: string;

    constructor(fontWeight?: string, fontStyle?: string, letterSpacing?: string, outline?: string, border?: string, textDecoration?: string, backgroundColor?: string) {
        this.fontWeight = fontWeight;
        this.fontStyle = fontStyle;
        this.letterSpacing = letterSpacing;
        this.outline = outline;
        this.border = border;
        this.textDecoration = textDecoration;
        this.backgroundColor = backgroundColor;
    }
}

export { DecorationHandler };
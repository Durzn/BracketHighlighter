import * as vscode from 'vscode';
import * as ConfigHandler from './ConfigHandler';

export default class DecorationHandler {
    public getDecorationType(): vscode.TextEditorDecorationType {
        let configHandler = new ConfigHandler.ConfigHandler();
        let decorationOptions = configHandler.getDecorationOptions();
        let decorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
            color: decorationOptions.color,
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
    public readonly color?: string;
    public readonly fontWeight?: string;
    public readonly fontStyle?: string;
    public readonly letterSpacing?: string;
    public readonly outline?: string;
    public readonly border?: string;
    public readonly backgroundColor?: string;
    public readonly textDecoration?: string;
    public readonly overviewColor?: string;

    constructor(fontWeight?: string, fontStyle?: string, letterSpacing?: string, outline?: string, border?: string, textDecoration?: string, backgroundColor?: string, color?: string, fontSize?: number) {
        this.color = color;
        this.fontWeight = fontWeight;
        this.fontStyle = fontStyle;
        this.letterSpacing = letterSpacing;
        this.outline = outline;
        this.border = border;
        this.textDecoration = textDecoration;
        if (fontSize !== undefined) {
            /* Hacky solution, however it doesn't seem like this will officially be implemented for the TextEditorDecorationType */
            this.textDecoration = this.textDecoration + ";font-size:" + fontSize + "px";
        }
        this.backgroundColor = backgroundColor;
    }
}

export { DecorationHandler };
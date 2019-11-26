import { Range } from 'vscode';
import * as vscode from 'vscode';
import * as DecorationHandler from './DecorationHandler';

export default class Highlighter {

    public highlightRange(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType, range: Range): void {
        const decorationOptions: vscode.DecorationOptions[] = [];
        const decoration = { range };
        decorationOptions.push(decoration);
        editor.setDecorations(decorationType, decorationOptions);
    }

    public highlightRanges(editor: vscode.TextEditor, decorationHandler: DecorationHandler.DecorationHandler, ranges: Array<Range>): Array<vscode.TextEditorDecorationType> {
        let decorationTypes = [];
        for (let range of ranges) {
            let decorationType = decorationHandler.getDecorationType();
            decorationTypes.push(decorationType);
            this.highlightRange(editor, decorationType, range);
        }
        return decorationTypes;
    }

    public removeHighlight(decorationType: vscode.TextEditorDecorationType): void {
        decorationType.dispose();
    }


    public removeHighlights(decorationTypes: Array<vscode.TextEditorDecorationType>) {
        for (let decorationType of decorationTypes) {
            this.removeHighlight(decorationType);
        }
    }
}

export { Highlighter };
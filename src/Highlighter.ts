import { Range } from 'vscode';
import * as vscode from 'vscode';
import * as DecorationHandler from './DecorationHandler';
import HighlightRange from './HighlightRange';

export default class Highlighter {

    public highlightRange(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType, highlightRange: HighlightRange): void {
        let range: vscode.Range = highlightRange.decorationRange;
        highlightRange.decorationType = decorationType;
        const decorationOptions: vscode.DecorationOptions[] = [];
        const decoration = { range };
        decorationOptions.push(decoration);
        editor.setDecorations(decorationType, decorationOptions);
    }

    public highlightRanges(editor: vscode.TextEditor, decorationHandler: DecorationHandler.DecorationHandler, highlightRanges: Array<HighlightRange>): void {
        for (let highlightRange of highlightRanges) {
            let decorationType = decorationHandler.getDecorationType();
            this.highlightRange(editor, decorationType, highlightRange);
        }
    }

    public removeHighlight(decorationType: vscode.TextEditorDecorationType): void {
        decorationType.dispose();
    }


    public removeHighlights(highlightRanges: Array<HighlightRange>) {
        for (let highlightRange of highlightRanges) {
            this.removeHighlight(highlightRange.decorationType);
        }
    }
}

export { Highlighter };
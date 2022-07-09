import { Range, TextEditor, TextEditorDecorationType, DecorationOptions } from 'vscode';
import DecorationHandler from './DecorationHandler';

export default class Highlighter {

    public highlightRange(editor: TextEditor, decorationType: TextEditorDecorationType, range: Range): void {
        const decorationOptions: DecorationOptions[] = [];
        const decoration = { range };
        decorationOptions.push(decoration);
        editor.setDecorations(decorationType, decorationOptions);
    }

    public highlightRanges(editor: TextEditor, decorationHandler: DecorationHandler, ranges: Array<Range>): Array<TextEditorDecorationType> {
        let decorationTypes = [];
        for (let range of ranges) {
            let decorationType = decorationHandler.getDecorationType();
            decorationTypes.push(decorationType);
            this.highlightRange(editor, decorationType, range);
        }
        return decorationTypes;
    }

    public removeHighlight(decorationType: TextEditorDecorationType): void {
        decorationType.dispose();
    }


    public removeHighlights(decorationTypes: Array<TextEditorDecorationType>) {
        for (let decorationType of decorationTypes) {
            this.removeHighlight(decorationType);
        }
    }
}

export { Highlighter };
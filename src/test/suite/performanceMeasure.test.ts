import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { handleTextSelectionEvent } from '../../extension';
// import * as myExtension from '../extension';

suite('Performance Test Suite', () => {
    test('Sample test', () => {
        let editor = vscode.window.activeTextEditor!;
        assert.notStrictEqual(editor, undefined);
        let times: number[] = [];

        for (let line = 0; line < editor.document.lineCount; line++) {
            editor.selection = new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0));
            let startTime = Date.now();
            handleTextSelectionEvent();
            let endTime = Date.now();
            times.push(endTime - startTime);
        }

        let sortedTimes = times.sort();
        let mean: number = sortedTimes.reduce((a, b) => a + b) / sortedTimes.length
        let variance: number = sortedTimes.reduce((a, b) => a + Math.pow(b - mean, 2)) / sortedTimes.length;
        let median: number = sortedTimes[Math.floor(sortedTimes.length / 2)];

        console.log(`Mean: ${mean}ms Median: ${median}ms Variance: ${variance}ms`);
    });
});
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
        let totalTime = sortedTimes.reduce((a, b) => a + b);
        let mean: number = totalTime / sortedTimes.length
        let variance: number = sortedTimes.reduce((a, b) => a + Math.pow(b - mean, 2)) / sortedTimes.length;
        let median: number = sortedTimes[Math.floor(sortedTimes.length / 2)];
        let longestDuration = Math.max(...sortedTimes);
        let shortestDuration = Math.min(...sortedTimes);

        console.log(`Total time: ${totalTime / 1000}s Mean: ${mean}ms Median: ${median}ms Variance: ${variance}ms Longest duration: ${longestDuration}ms Shortest duration: ${shortestDuration}ms`);
    }).timeout(5000000);
});
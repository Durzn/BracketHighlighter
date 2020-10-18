import { bracketHighlightGlobals } from './GlobalsHandler';

export default class SymbolHandler {

    public getCounterParts(symbol: string): Array<string> {
        let validSymbols: Array<string> = [];
        let counterPartSymbols: Array<string> = [];
        let foundSymbols: Array<string> = [];
        if (this.isValidStartSymbol(symbol) === true) {
            validSymbols = this.getValidStartSymbols();
            counterPartSymbols = this.getValidEndSymbols();
        }
        else if (this.isValidEndSymbol(symbol) === true) {
            validSymbols = this.getValidEndSymbols();
            counterPartSymbols = this.getValidStartSymbols();
        }
        let index = 0;
        for (let validSymbol of validSymbols) {
            if (symbol === validSymbol) {
                foundSymbols.push(counterPartSymbols[index]);
            }
            index++;
        }
        return foundSymbols;
    }

    public getValidSymbolsWithSameEndSymbol(startSymbol: string): Array<string> {
        let symbolsWithSameEndSymbols: Array<string> = [];
        let validSymbols: string[] = [];
        if (this.isValidStartSymbol(startSymbol)) {
            validSymbols = this.getUniqueValidStartSymbols();
        }
        else {
            validSymbols = this.getUniqueValidEndSymbols();
        }
        let counterPartSymbolsOfValidSymbol = this.getCounterParts(startSymbol);
        for (let validSymbol of validSymbols) {
            let counterPartSymbols = this.getCounterParts(validSymbol);
            for (let counterPartSymbol of counterPartSymbols) {
                if (counterPartSymbolsOfValidSymbol.includes(counterPartSymbol)) {
                    let symbolToAppend = this.getCounterParts(counterPartSymbol);
                    symbolsWithSameEndSymbols = symbolsWithSameEndSymbols.concat(symbolToAppend);
                }
            }
        }
        return symbolsWithSameEndSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }

    public getValidSymbols(): Array<string> {
        let startSymbols: Array<string> = this.getValidStartSymbols();
        let endSymbols: Array<string> = [];
        if (bracketHighlightGlobals.reverseSearchEnabled === true) {
            endSymbols = this.getValidEndSymbols();
        }
        return startSymbols.concat(endSymbols);
    }

    public getValidStartSymbols(): Array<string> {
        return bracketHighlightGlobals.allowedStartSymbols;
    }

    public getUniqueValidStartSymbols(): Array<string> {
        return bracketHighlightGlobals.allowedStartSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }

    public getValidEndSymbols(): Array<string> {
        return bracketHighlightGlobals.allowedEndSymbols;
    }

    public getUniqueValidEndSymbols(): Array<string> {
        return bracketHighlightGlobals.allowedEndSymbols.filter(function (item, pos, self) {
            return self.indexOf(item) === pos;
        });
    }

    public isValidStartSymbol(symbol: string) {
        if (this.getValidStartSymbols().includes(symbol)) {
            return true;
        }
        return false;
    }

    public isValidEndSymbol(symbol: string) {
        if (this.getValidEndSymbols().includes(symbol)) {
            return true;
        }
        return false;
    }
}

export { SymbolHandler };
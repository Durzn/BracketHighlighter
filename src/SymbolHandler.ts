import * as ConfigHandler from './ConfigHandler';

export default class SymbolHandler {

    public getCounterPart(validSymbol: string): string {
        let symbols: Array<string> = [];
        let counterPartSymbols: Array<string> = [];
        if (this.isValidStartSymbol(validSymbol) === true) {
            symbols = this.getValidStartSymbols();
            counterPartSymbols = this.getValidEndSymbols();
        }
        else if (this.isValidEndSymbol(validSymbol) === true) {
            symbols = this.getValidEndSymbols();
            counterPartSymbols = this.getValidStartSymbols();
        }
        let index = 0;
        for (let symbol of symbols) {
            if (symbol === validSymbol) {
                if (index > symbols.length) {
                    return "";
                }
                else {
                    return counterPartSymbols[index];
                }
            }
            index++;
        }
        return "";
    }

    public getValidSymbols(): Array<string> {
        let configHandler = new ConfigHandler.ConfigHandler();
        let startSymbols: Array<string> = this.getValidStartSymbols();
        let endSymbols: Array<string> = [];
        if (configHandler.reverseSearchEnabled() === true) {
            endSymbols = this.getValidEndSymbols();
        }
        return startSymbols.concat(endSymbols);
    }

    public getValidStartSymbols(): Array<string> {
        let configHandler = new ConfigHandler.ConfigHandler();
        return configHandler.getAllowedStartSymbols();
    }

    public getValidEndSymbols(): Array<string> {
        let configHandler = new ConfigHandler.ConfigHandler();
        return configHandler.getAllowedEndSymbols();
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
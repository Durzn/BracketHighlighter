import { HighlightEntry, HighlightSymbol, JumpBetweenStrategy } from "../../ConfigHandler";



export const ConfiguredSymbols: HighlightSymbol[] = [
    new HighlightSymbol(new HighlightEntry("/*", false, true), new HighlightEntry("*/", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("cat", false, false), new HighlightEntry("dog", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("start", false, false), new HighlightEntry("stop", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("do", false, false), new HighlightEntry("end", false, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("{", false, true), new HighlightEntry("}", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("(", false, true), new HighlightEntry(")", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("[", false, true), new HighlightEntry("]", false, true), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("pthread_mutex_lock", true, false), new HighlightEntry("pthread_mutex_unlock|pthread_mutex_wait", true, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
    new HighlightSymbol(new HighlightEntry("\\bdo\\b(?!:)", true, false), new HighlightEntry("\\bend\\b", true, false), JumpBetweenStrategy.TO_SYMBOL_OPPOSITE_SIDE),
];

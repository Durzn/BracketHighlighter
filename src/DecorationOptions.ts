export default class DecorationOptions {
    public readonly color?: string;
    public readonly fontWeight?: string;
    public readonly fontStyle?: string;
    public readonly letterSpacing?: string;
    public readonly outline?: string;
    public readonly border?: string;
    public readonly backgroundColor?: string;
    public readonly textDecoration?: string;
    public readonly overviewColor?: string;

    constructor(fontWeight?: string, fontStyle?: string, letterSpacing?: string, outline?: string, border?: string, textDecoration?: string, backgroundColor?: string, color?: string) {
        this.color = color;
        this.fontWeight = fontWeight;
        this.fontStyle = fontStyle;
        this.letterSpacing = letterSpacing;
        this.outline = outline;
        this.border = border;
        this.textDecoration = textDecoration;
        this.backgroundColor = backgroundColor;
    }
}
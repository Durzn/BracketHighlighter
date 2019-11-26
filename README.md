## About this extension

This extension is for people that want a more "in the face" approach on highlighting bracket content. \
It provides a very configurable CSS style markup for the whole text between brackets.

## Features

Finds the corresponding symbol for the currently selected symbol and adds decorations to the text inbetween. 

**Decoration examples:**

- **bold text with increased letter spacing**

![](assets/bold.gif)

- **red border around bold text**

![](assets/border.gif)

- **... Lots of additional possibilities. Just configure it the way you like it.**


## Extension Settings

This extension contributes the following settings:

* `BracketHighlighter.enabled`: enable/disable this extension
* `BracketHighlighter.useParentheses`: enables highlighting between parentheses '()'.
* `BracketHighlighter.useBrackets`: enables highlighting between brackets '[]'.
* `BracketHighlighter.useBraces`: enables highlighting between braces '{}'.
* `BracketHighlighter.useBrackets`: enables highlighting between angular brackets '<>'.
* `BracketHighlighter.fontWeight`: CSS-style setting specifying the weight of the font. E.g. 'bold'
* `BracketHighlighter.fontStyle`: CSS-style setting specifying the style of the font. E.g. 'oblique'
* `BracketHighlighter.letterSpacing`: CSS-style setting specifying the space between letters. E.g. '1px'
* `BracketHighlighter.outline`: CSS-style setting specifying the outline of the text. E.g. '2px dashed blue'
* `BracketHighlighter.border`: CSS-style setting specifying the border around the text. E.g. '4px dotted blue'
* `BracketHighlighter.backgroundColor`: CSS-style setting specifying the color in the background of the text. E.g. 'coral'
* `BracketHighlighter.textDecoration`: CSS-style setting specifying additional decorations around the text. E.g. 'underline' 

Refer to https://www.w3schools.com/cssref/ for all CSS options.

## Known Issues

- Behavior between opening and closing brackets can behave differently. (E.g. brackets can be excluded in the marked up text.)
- When searching from a closing bracket the white space preceding code will also be highlighted.

### Workarounds
- Disable reverse search in the settings or live with it for now.

## Release Notes

### 1.0.0

- Initial release of the extension.

## Planned improvements

- Add option to add custom symbols between which text shall be marked up.

-----------------------------------------------------------------------------------------------------------

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

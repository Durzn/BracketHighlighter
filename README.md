## About this Visual Studio Code extension

This extension is for people that want a more "in the face" approach on highlighting content between symbols. \
It provides a very configurable CSS style markup for the whole text between opening and closing symbols. \
Those symbols can be defined by the user, or alternatively there are preset options for brackets.

## Features

Finds the corresponding symbol for the currently selected symbol and adds decorations to the text inbetween. 

**Decoration examples:**

- **user defined opening and closing symbols**

![](assets/customSymbols.gif)

- **bold text with increased letter spacing**

![](assets/bold.gif)

- **red border around text**

![](assets/border.gif)

- **underlined text**

![](assets/underline.gif)

- **changed background color**

![](assets/background.gif)

- **blurred out text**

![](assets/blur.gif)


- **... Lots of additional possibilities. Just configure it the way you like it.**


## Extension Settings

This extension contributes the following settings:

* `BracketHighlighter.enableExtension`: enables the extension when set. (Default hotkey to toggle the state: ctrl+alt+l)
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
* `BracketHighlighter.activeInDebugMode`: Enables the extension when debugging. 
* `BracketHighlighter.reverseSearchEnabled`: Enables searching from closing symbols.
* `BracketHighlighter.blurOutOfScopeText`: Enables a blur effect on non-highlighted text. (Opacity depends on blurOpacity value)
* `BracketHighlighter.blurOpacity`: Sets the opacity of the blurred out text. E.g. 0.5
* `BracketHighlighter.allowedLanguageIds`: IDs which this extension will work on. Leaving this blank will enable it globally. Identifiers have to be separated by a comma. E.g. c,cpp,java
* `BracketHighlighter.maxLineSearchCount`: The maximum amount of lines to search for a matching symbol. If nothing is found by this number, nothing will be highlighted.
* `BracketHighlighter.highlightScopeFromText`: Allows highlighting when clicking inside of a scope. It will search for the scope of all enabled symbols.
* `BracketHighlighter.customSymbols`: User defined symbols which have to have a defined "open" and "close" value. Open and close values must not be the same. Symbols don't have to be unique, however the first entry in this list will always have priority.
E.g.
```
"BracketHighlighter.customSymbols": [
    {
        "open": "do",
        "close": "end"
    },
    {
        "open": "/*",
        "close": "*/"
    }
]
```
* `BracketHighlighter.timeOutValue`: Sets a value in milliseconds how often highlighting can be triggered. A higher value will increase performance when writing, however highlighting may be delayed in some cases. Setting this to 0 will make the extension behave as it did before this option existed.


Refer to https://www.w3schools.com/cssref/ for all CSS options.
Refer to https://code.visualstudio.com/docs/languages/identifiers for available language identifiers.

## Known Issues
- Symbols in strings/comments/... are checked as well and may cause unwanted highlighting.

### Workarounds
- Close the symbols in the string, turn off highlighting for the unwanted symbol or deactivate the extension.

## Release Notes
For all notes please refer to the changelog.
Only the latest 3 releases will be shown here.


## [1.5.0]
- Added a timeout for the highlighting action of the extension. This improves the performance when writing/erasing letters at the edge of a symbol, however the highlighting may be delayed in some unwanted cases (i.e. when just moving the cursor over symbols without writing). If there was no problem prior to this update, set the timeout value to 0 to get the old behavior. Lowering this value will make highlighting more responsive, however there might be a noticeable delay when writing/erasing.

## [1.4.3]
- Updated the store page to show all settings
- Made the example for using custom symbols more readable

## [1.4.2]
- Fixed a crash that occurred when the cursor was at position 0 of a line and there was no valid symbol to highlight.

## Planned improvements
- This extension is feature complete. If you think something is missing please refer to the next paragraph.

## Feature requests and bug reports
Please mail them to me at dev@durzn.com or create an open issue at https://github.com/Durzn/BracketHighlighter

# Special thanks
## Art_of_bini 
for the great extension icon. See more from her on her instagram page https://www.instagram.com/art_of_bini/
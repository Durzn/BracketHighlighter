## About this Visual Studio Code extension

This extension is for people that want a more "in the face" approach on highlighting bracket content. \
It provides a very configurable CSS style markup for the whole text between brackets.

## Features

Finds the corresponding symbol for the currently selected symbol and adds decorations to the text inbetween. 

**Decoration examples:**

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

- **user defined opening and closing symbols**

![](assets/customSymbols.gif)

- **... Lots of additional possibilities. Just configure it the way you like it.**


## Extension Settings

This extension contributes the following settings:

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
    "BracketHighlighter.customSymbols": [
        {
            "open": "do",
            "close": "end"
        },
        {
            "open": "/\*",
            "close": "\*/"
        }
    ]


Refer to https://www.w3schools.com/cssref/ for all CSS options.
Refer to https://code.visualstudio.com/docs/languages/identifiers for available language identifiers.

## Known Issues
- Symbols in strings/comments/... are checked as well and may cause unwanted highlighting.

### Workarounds
- Close the symbols in the string, turn off highlighting for the unwanted symbol or deactivate the extension.

## Release Notes
For all notes please refer to the changelog.
Only the latest 3 releases will be shown here.

## [1.4.0]
- Added option to define custom opening and closing symbols (i.e. do ... end). For an example configuration look at the store page.
- Added option to disable the extension back to the settings
- Added hotkey to enable/disable the extension (Default: ctrl+alt+l)

## [1.3.1]
- Fixed a bug where text would wrongly be blurred out when following conditions applied:
    1. blurring text out enabled
    2. searching the scope from within the text enabled
    3. selecting a closing bracket and then searching the scope from within text

## [1.3.0]
- Feature request: Added option to highlight text when clicking anywhere inside of the scope (so it's not necessary to click on brackets directly). This will use the same enabled brackets as the normal process.

## Planned improvements
- None

## Feature requests and bug reports
Please mail them to me at dev@durzn.com or create an open issue at https://github.com/Durzn/BracketHighlighter

# Special thanks
## Art_of_bini 
for the great extension icon. See more from her on her instagram page https://www.instagram.com/art_of_bini/
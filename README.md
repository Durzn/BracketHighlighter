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

Refer to https://www.w3schools.com/cssref/ for all CSS options.

## Known Issues
- Currently no known issues.


### Workarounds
- Currently empty.

## Release Notes

## [1.0.5]
- Added option to blur out non-highlighted text (Thanks @VSCode Dimmer Block for the idea)
    -> can be enabled/disabled in the options, opacity value can also be configured
- Fixed case where text behind a closing bracket would wrongly be highlighted

## [1.0.4]
- Added option to enable the extension in debug mode (that way the closing bracket from a function return won't highlight everything when debugging) (default: On)

## [1.0.3] 
- Removed a check if the extension was activated

## [1.0.2]
- When using a background color, the highlighted text will now be shown on the left lane in the overview ruler
- Removed the enable/disable switch, just disable the extension in the extension tab if you want to disable it
- Added a link to the CSS reference in the settings menu

### [1.0.1]
- Fixed inconsistency between reverse and forward search

### [1.0.0]

- Initial release

## Planned improvements

- Add option to add custom symbols between which text shall be marked up.
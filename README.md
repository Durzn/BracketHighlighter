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


Refer to https://www.w3schools.com/cssref/ for all CSS options.
Refer to https://code.visualstudio.com/docs/languages/identifiers for available language identifiers.

## Known Issues
- Currently no known issues.


### Workarounds
- Currently empty.

## Release Notes
For all notes please refer to the changelog.
Only the latest 3 releases will be shown here.


## [1.0.9]
- Added an icon for the extension

## [1.0.8]
- Changed default value of language identifiers to an empty field. (I.e. it is enabled globally)

## [1.0.7]
- Added support to explicitly only support configured languages. Once this setting has one or more entries, the extension will ONLY work for the given entry/entries.
For language identifiers please refer to https://code.visualstudio.com/docs/languages/identifiers
Leaving the option blank will enable it globally.


## Planned improvements

- Add option to add custom symbols between which text shall be marked up.

## Feature requests and bug reports
Please mail them to me at dev@durzn.com or create an open issue at https://github.com/Durzn/BracketHighlighter

# Special thanks
## Art_of_bini 
for the great extension icon. See more from her on her instagram page https://www.instagram.com/art_of_bini/
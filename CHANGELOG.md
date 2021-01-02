# Change Log

## [2.2.3]
- The hotkey actions will now take the length of the symbols into account. This means that custom symbols should now be
    handled properly.

## [2.2.2]
- Removed font size multiplicator, since it caused issues when zooming. 
    Reasoning: There is no official support through the TextEditorDecorationType class, and the font size cannot be dynamically determined through the vscode API, so this feature will not be maintained and was therefore removed.

## [2.2.1]
- Fixed issue where HighlightScopeFromText sometimes wouldn't work correctly

## [2.2.0]
- Added support for highlighting of symbols share the same opening or closing symbols
- Added option to change the font size of highlighted text

## [2.1.0]
- Added experimental support to ignore escaped symbols: To use it, enable the regex mode in the settings. If you find any errors, please open a ticket!
- Fixed uncaught error exceptions

## [2.0.0]
- Added hotkeys to jump to/out of highlighted symbols.
- Cursors which aren't in a highlighted range will be removed when jumping.
- Added hotkey to select all the text between symbols (not including the symbols).
- Made the default settings way less aggressive to look at.

## [1.8.1]
- Fixed bug where multi cursor highlighting wouldn't work.
- Fixed bug with the option "highlight scope from text" where the wrong symbols would be picked for highlighting if they were on the same line.

## [1.8.0]
- Added option to change the highlighted text color.

## [1.7.0]
- Added an option to only highlight the enclosing symbols. The text inside will not be highlighted.

## [1.6.0]
- Added support for highlighting with multiple cursors

## [1.5.0]
- Added a timeout for the highlighting action of the extension. This improves the performance when writing/erasing letters at the edge of a symbol, however the highlighting may be delayed in some unwanted cases (i.e. when just moving the cursor over symbols without writing). If there was no problem prior to this update, set the timeout value to 0 to get the old behavior. Lowering this value will make highlighting more responsive, however there might be a noticeable delay when writing/erasing.

## [1.4.3]
- Updated the store page to show all settings
- Made the example for using custom symbols more readable

## [1.4.2]
- Fixed a crash that occurred when the cursor was at position 0 of a line and there was no valid symbol to highlight.

## [1.4.1]
- Fixed a problem where symbols wouldn't always be found correctly to the left of the cursor

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

## [1.2.1] 
- Minor performance improvements when writing inside of a highlighted area

## [1.2.0]
- Reverted changes made in 1.0.9 and 1.1.0
- Users can now define a maximum of searched lines for a closing symbol. (Default: 1000) This way accidentally clicking on symbols enclosing an extremely big amount of lines will not be searched endlessly.

## [1.1.0]
- Changed the extension to only highlight text lines that are currently visible. That way the extension will not take ages/freeze the editor when highlighting huge files. If this causes trouble for anyone please use version 1.0.8 and tell me about the problems!

## [1.0.9]
- Added an icon for the extension. 

## [1.0.8]
- Changed default value of language identifiers to an empty field. (I.e. it is enabled globally)

## [1.0.7]
- Added support to explicitly only support configured languages. Once this setting has one or more entries, the extension will ONLY work for the given entry/entries.
For language identifiers please refer to https://code.visualstudio.com/docs/languages/identifiers
Leaving the option blank will enable it globally.

## [1.0.6]
- Fixed case where text that spans over exactly 2 lines wouldn't correctly be highlighted when searching forwards

## [1.0.5]
- Added option to blur out non-highlighted text (Thanks @VSCode Dimmer Block for the idea)
    -> can be enabled/disabled in the options, opacity value can also be configured
- Fixed case where text behind a closing bracket would wrongly be highlighted

## [1.0.4]
- Feature request: Added option to enable the extension in debug mode (that way the closing bracket from a function return won't highlight everything when debugging) (default: On)

## [1.0.3] 
- Removed a check if the extension was activated

## [1.0.2]
- When using a background color, the highlighted text will now be shown on the left lane in the overview ruler
- Removed the enable/disable switch, just disable the extension in the extension tab if you want to disable it
- Added a link to the CSS reference into the settings menu

## [1.0.1]
- Fixed inconsistency between reverse and forward search

## [1.0.0]

- Initial release
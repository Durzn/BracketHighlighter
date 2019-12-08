# Change Log

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
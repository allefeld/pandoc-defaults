# Pandoc/Defaults for VS Code

[Pandoc/Defaults](https://github.com/allefeld/pandoc-defaults) is a way to reference instructions on how to process a Markdown file with [Pandoc](https://pandoc.org/) within the Markdown file itself.

This extension makes an external Pandoc/Defaults processor available through commands and keybindings, and adds a status bar item which reports current processing, occurred warnings and errors, and provides quick access to the processor's output in a dedicated terminal panel.


## Features

The extension contributes the following commands:

-   *Pandoc/Defaults: Process All* (`pandocDefaults.processAll`)\
    default keyboard shortcut: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd>

    processes all formats defined in the file in the active editor

-   *Pandoc/Defaults: Process First* (`pandocDefaults.processFirst`)\
    default keyboard shortcut: <kbd>Alt</kbd>+<kbd>P</kbd>

    processes the first format defined in the file in the active editor

-   *Pandoc/Defaults: Clean* (`pandocDefaults.clean`)\
    default keyboard shortcut: <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd>

    deletes files resulting from all formats defined in the file in the active editor

-   *Pandoc/Defaults: Show Terminal* (`pandocDefaults.showTerminal`)\
    triggered by clicking the Pandoc/Defaults status bar item (icon ¶).

    shows the dedicated Pandoc/Defaults terminal

The keyboard shortcuts are only bound if the active editor has the language "Markdown".


## Installation

The extension is not (yet) published on the VS Code Marketplace. To install it, download the `vsix` file in this folder, and run

````
code --install-extension <path-to-vsix>
````


## Requirements

A Pandoc/Defaults processor has to be installed separately, see the [Python implementation](https://github.com/allefeld/pandoc-defaults/tree/main/python). The processor in turn requires [Pandoc](https://pandoc.org/installing.html) to be installed.

## Notes

The extension icon is based on `whitespace.svg` from the [Visual Studio Code icons collection](https://github.com/microsoft/vscode-codicons).


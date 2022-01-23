# Pandoc/Defaults for VS Code

[Pandoc/Defaults](https://github.com/allefeld/pandoc-defaults) is a way to reference instructions on how to process a Markdown file with [Pandoc](https://pandoc.org/) within the Markdown file itself.

This extension makes an external Pandoc/Defaults processor available through commands and keybindings, and adds a status bar item which reports current processing, occurred warnings and errors, and provides quick access to the processor's output in a dedicated terminal panel.


## Features

The extension contributes the following commands:

-   __Pandoc/Defaults: Process All__\
    `Pandoc/Defaults.processAll`\
    default keyboard shortcut: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd>

    processes all formats defined in the file in the active editor

-   __Pandoc/Defaults: Process First__\
    `Pandoc/Defaults.processFirst`\
    default keyboard shortcut: <kbd>Alt</kbd>+<kbd>P</kbd>

    processes the first format defined in the file in the active editor

-   __Pandoc/Defaults: Clean__\
    `Pandoc/Defaults.clean`\
    default keyboard shortcut: <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd>

    deletes files resulting from all formats defined in the file in the active editor

-   __Pandoc/Defaults: Show Terminal__\
    `Pandoc/Defaults.showTerminal`\
    triggered by clicking the Pandoc/Defaults status bar item (icon ¶).

    shows the dedicated terminal

The keyboard shortcuts are only bound if the active editor has the language "Markdown".


## Settings

The extension contributes the following settings:

-   __Pandoc/Defaults: Executable__\
    `Pandoc/Defaults.executable`\
    default: `"pd"`

    Name or path of Pandoc/Defaults processor.

-   __Pandoc/Defaults: Kill Previous Process__\
    `Pandoc/Defaults.killPreviousProcess`\
    default: `false`

    Whether to reprocess a document when saved, if it has been explicitly processed before.

-   __Pandoc/Defaults: Reprocess On Save__\
    `Pandoc/Defaults.reprocessOnSave`\
    default: `false`

    When processing is started, whether to kill a previously running process. Otherwise, the new processing is cancelled.


## Installation

The extension is not (yet) published on the VS Code Marketplace. To install it, download the `vsix` file in this folder, and run

````
code --install-extension <path-to-vsix>
````


## Requirements

A Pandoc/Defaults processor has to be installed separately, see the [Python implementation](https://github.com/allefeld/pandoc-defaults/tree/main/python). The processor in turn requires [Pandoc](https://pandoc.org/installing.html) to be installed.


***

This software is copyrighted © 2022 by Carsten Allefeld and released under the terms of the GNU General Public License, version 3 or later.

The extension icon (`icon.svg` and `icon.png`) is based on `whitespace.svg` from the [Visual Studio Code icons collection](https://github.com/microsoft/vscode-codicons), © Microsoft and released under the terms of Creative Commons Attribution 4.0 International Public License.

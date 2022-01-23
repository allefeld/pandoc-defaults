# Pandoc/Defaults in Python

[Pandoc/Defaults](https://github.com/allefeld/pandoc-defaults) is a way to reference instructions on how to process a Markdown file with [Pandoc](https://pandoc.org/) within the Markdown file itself.

This Python command line application is an implementation of a Pandoc/Defaults processor.


## Usage


## Installation

Download the Python script `pd.py`, put it (or a symbolic link to it) into a directory on your `PATH`, and make it executable (Linux `chmod +x`). It is recommended to name the copy or link `pd`.


## Requirements

The script is written in Python 3. At least version 3.6 (better 3.7) is recommended, because it relies on the assumption that dictionaries are ordered.

Beyond the standard library, only the package [PyYAML](https://pyyaml.org/) is used. Version 6.0 or higher is recommended.

In addition, [Pandoc](https://pandoc.org/installing.html) has to be installed for the actual processing.

The program uses [ANSI escape sequences](https://en.wikipedia.org/wiki/ANSI_escape_code) to colorize its output. They are supported in recent versions of the Windows Console, but earlier versions may need special configuration.
# ![](icon.svg) Pandoc/Defaults repository

This repository is about a way to reference instructions on how to process a Markdown file with [Pandoc](https://pandoc.org/) within the Markdown file itself, using an entry in the YAML header:

````yaml
pandoc-defaults_:
    - pdf: slides_beamer
    - pptx: slides_powerpoint
````

It includes:

-   The [Pandoc/Defaults specification](spec/).

-   A [Python implementation](python/) of a Pandoc/Defaults processor.

-   An [extension for VS Code](vscode/) which makes it easy to use the Python implementation from the editor.

# Pandoc/Defaults specification

Pandoc/Defaults is a way to reference instructions on how to process a Markdown file with [Pandoc](https://pandoc.org/) within the Markdown file itself.

This directory contains the specification as a Markdown source file `pandoc-defaults.text` as well as processed into HTML and PDF.

You can read the document by [downloading the PDF](https://raw.githubusercontent.com/allefeld/pandoc-defaults/main/spec/pandoc-defaults.pdf), [previewing the PDF](https://github.com/allefeld/pandoc-defaults/blob/main/spec/pandoc-defaults.pdf) in GitHub, or [viewing the HTML](https://htmlpreview.github.io/?https://github.com/allefeld/pandoc-defaults/blob/main/spec/pandoc-defaults.html) (through htmlpreview.github.io).


## Example

The Markdown source file serves also as an example. Its YAML header includes the entry

````yaml
pandoc-defaults_:
    - html:
    - pdf: document_latex
````

and the defaults files to process it are included alongside it.

If you have a Pandoc/Defaults processor `pd` installed (see the [Python implementation](https://github.com/allefeld/pandoc-defaults/tree/main/python)), download `pandoc-defaults.text`, `html.yaml` and `document_latex.yaml` into the same directory, and then run:

````
pd pandoc-defaults.text
````

This should create the files `pandoc-defaults.html` and `pandoc-defaults.pdf`.

Alternatively, you can put the YAML files into the `defaults` subdirectory of the Pandoc user data directory.
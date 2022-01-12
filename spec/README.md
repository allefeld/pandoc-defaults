# Pandoc/Defaults specification

This directory contains the specification as a Markdown source file as well as processed into HTML and PDF.

The source file serves also as an example. It's YAML header includes the entry

````yaml
pandoc-defaults_:
    - html:
    - pdf: document_latex
````

and the defaults files to process it are included (`html.yaml` and `document_latex.yaml`).
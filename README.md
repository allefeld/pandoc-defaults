# ![](icon.svg) Pandoc/Defaults repository

This repository is about a way to include instructions on how to process a Markdown file with Pandoc within the Markdown file itself:

````
---
title: Pandoc/Defaults
author: Carsten Allefeld
pandoc-defaults_:
    - html:
    - pdf: pdf_document
...

# Motivation

Pandoc is an extremely versatile tool for document conversion, centered on
its own feature-rich version of Markdown which makes it possible to write
complex documents. ...
````

It includes:

-   The [Pandoc/Defaults specification](spec/).

-   A [Python implementation](python/) of a Pandoc/Defaults processor.

-   An [extension for VS Code](vscode/) which makes it easy to use the Python implementation from the editor.

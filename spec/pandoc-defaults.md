---
title: Pandoc/Defaults
author: Carsten Allefeld
date: 2022–1–7
...


# Motivation

Pandoc is an extremely versatile tool for document conversion, centered on its own feature-rich version of Markdown which makes it possible to write complex documents. There are many purposes Pandoc can be used for, and a large number of command line options allow to tailor Pandoc's functions to these special uses.

For many people, Pandoc has become an integral part of their daily routine, much like Microsoft Word and PowerPoint are used by others. In this context, there are typically a small number of use cases which repeat over and over again, and specifying command line options for them manually is tedious and error-prone. Such use cases might be:

-   create a slide presentation (with specific color scheme and logo),
-   write a technical report,
-   write a letter (with a specific letterhead),
-   prepare an academic publication,
-   or to simply collect some notes on a project.

In the following I will call the specific configuration for a repeated use case a "format".

There have been a number of attempts to wrap Pandoc in a way that makes it easy to store and re-use such formats:

-   [panzer](https://github.com/msprev/panzer), which "adds *styles* to pandoc", <!-- 2013–11–14 -->
-   [rmarkdown](https://github.com/rstudio/rmarkdown), an R package which binds together knitr processing of Markdown-with-code with a number of output formats defined in R, <!-- 2014–1–22 -->
-   [pandocomatic](https://github.com/htdebeer/pandocomatic), with which "you can express common patterns of using pandoc for generating your documents", <!-- 2014–3–31 -->
-   [panrun](https://github.com/mb21/panrun), a "minimal script that runs pandoc with the options it finds in the YAML metadata of the input markdown file", <!-- 2018–9–16 -->
-   [Pandoc/PDF](https://github.com/allefeld/atom-pandoc-pdf), a package for the Atom editor which allows to associate file extensions with Pandoc options, <!-- 2020–1–1 -->
-   and probably several others.

The problem is that there is no common standard for defining such formats, and for associating them with a Markdown file. (Yes, I am aware of [the "Standards" xkcd](https://xkcd.com/927/), but see next section.) Moreover, the route taken by some of these packages, to specify options in detail within the file, goes against the idea of formats, and tends to reproduce the abominably endless preambles of LaTeX files.


# Pandoc's defaults files as formats

Since version 2.8 (and reasonably bug-free since 2.9.1), Pandoc supports a command line argument `--defaults` with which a so-called ["defaults file"](https://pandoc.org/MANUAL.html#default-files) is specified. This file is in YAML format and makes it possible to configure all aspects of the Pandoc conversion process in a single file. With this, there is now a "common standard" for defining formats endorsed by the creator of Pandoc himself.

With this option, running Pandoc in a customized way becomes as simple as e.g.

````bash
pandoc --defaults=slides_beamer.yaml slides.md --output=slides.pdf
````

where `slides_beamer.yaml` is a defaults file which specifies in detail how the input document is to be converted to PDF slides (here via LaTeX using the Beamer document class). Having another defaults file `slides_powerpoint.yaml`, the same input file could be converted into a PowerPoint `pptx`-file by:

````bash
pandoc --defaults=slides_powerpoint.yaml slides.md --output=slides.pptx
````

This opens up the possibility to create a simple user interface to Pandoc supporting different kinds of documents and styles. The user creates one or more defaults files, and for a given conversion only has to specify two pieces of information:

-   the name of the defaults file
-   and the file extension of the output.

Note that in the first example above, the extension `pdf` of the output file was necessary to trigger the creation of a PDF. Any other extension would have let the Beamer-LaTeX code to be written to the file, which means only the extensions `pdf` and `tex` make sense in combination with this defaults file. In the second example, only the extension `pptx` makes sense.

For the examples above, defaults files could be:

-   `slides_beamer.yaml`
-   `report_html.yaml`, `report_word.yaml`
-   `letter_word.yaml`
-   `paper_latex.yaml`
-   `notes_html.yaml`

These files would be installed in the `defaults` subdirectory of the Pandoc [user data directory](https://pandoc.org/MANUAL.html#option--data-dir). A one-off specialized version could also be put into the directory of the Markdown file which it is intended for.


# Associating a Markdown file with formats

What is missing is a simple way to specify these two pieces of information, apart from writing them on the command line. This is especially important if the conversion process is to be started from an editor, where specifying options is cumbersome or requires complex configuration options.

There are several possible strategies, but the simplest seems to be to add it to the initial YAML block of a Markdown file a sequence of single-key mappings:

````yaml
---
title: Pandoc/Defaults
author: Carsten Allefeld
pandoc-defaults_:
    - html: report_html
    - docx: report_word
...
````


# Definition

A Pandoc/Defaults compliant processor is a command-line program or a function within an editor program, e.g. triggered by a keyboard shortcut.

If it is invoked upon a Markdown file `NAME.EXT` with an initial YAML block which includes the top-level key `pandoc-defaults_`, it expects the associated value to be a sequence of single-key mappings, where keys and values are string scalars. (Keys have to be unique within the sequence.) It is then to issue, in the directory containing the file, one Pandoc command for each `KEY`/`VALUE` pair:


````bash
pandoc --defaults=VALUE.yaml NAME.EXT --output=NAME.KEY
````

As a result, files with the specified extensions are created in the same directory as the Markdown file, each using the format defined by the associated defaults file. Additional Pandoc arguments may be included, as long as they do not substantially affect the result, e.g. `--data-dir` or `--verbose`.

To simplify the use of default "defaults files", if `VALUE` is omitted,  it is to be set identical to the `KEY`, i.e. the following two blocks are equivalent:

````yaml
pandoc-defaults_:
    - html:
    - docx:
````

````yaml
pandoc-defaults_:
    - html: html
    - docx: docx
````

To accomodate the case of simple one-off Markdown documents, either without an initial YAML block or without a top-level key `pandoc-defaults_`, in this case the processor acts as if the document contained the block

````YAML
pandoc-defaults_:
    - html:
````


# Additional functionality

In addition to the behavior described above, a compliant processor may offer other functionality. For example, an editor may

-   provide another keyboard shortcut, in response to which only the first key/value pair is used,
-   provide a drop-down menu with entries corresponding to the key/value pairs, in response to which only the selected key/value pair is used, or
-   automatically open the file created from the first key/value pair in a viewer application or tab.

If the file extension suggests preprocessing, a compliant processor may run the preprocessor before invoking Pandoc on the resulting file; examples are [knitr](https://yihui.org/knitr/) on files with the extension `Rmd` or [Pweave](https://mpastell.com/pweave/) on files with the extension `pmd`.


# Rationale

-   Pandoc/Defaults is designed to rely as much as possible on existing functionality of Pandoc, adding only what cannot be achieved using Pandoc only.

-   Format information is added to the Markdown file itself in order to avoid complex configuration, e.g. based on file extensions or parts of the file name, or to have directories cluttered with sidecar configuration files. Note however that this system is compatible with using formats defined locally but separately, due to the way Pandoc [searches for defaults files](https://pandoc.org/MANUAL.html#option--defaults).

-   The YAML key under which formats are defined ends in an underscore so that it does not affect processing by Pandoc.

-   Formats are listed in a sequence of single-key mappings (the standard way to [represent an ordered mapping in YAML](https://yaml.org/type/omap.html)), because a simple YAML mapping has no defined order; this way it is possible to identify a "first" format.

-   Output file extensions are used as keys because it does not make sense to create more than one file with the same name.

-   Pandoc is to be run in the directory of the input file so that local external resources (images, defaults files) are found.

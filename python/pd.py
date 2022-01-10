#!/usr/bin/python3

"""Pandoc/Defaults compliant processor implementation in Python.
Processes file with Pandoc into formats specified in its YAML header."""


# Should be at least Python 3.7, so that dictionaries are ordered.


import argparse
import subprocess
import sys
import os
import shutil
import shlex
import atexit

from yaml import safe_load
from yaml.error import YAMLError
import colorama
from colorama import Fore, Style


# YAML key under which Pandoc/Defaults formats are defined
header_key = 'pandoc-defaults_'

# format specifications to use if none are present
default_formats = [{'html': None}]

# start-of-line markers for warnings and errors in Pandoc output
# only for warnings that should get the user's attention
log_warning = [
    '[WARNING]',                # Pandoc
    'pandoc-citeproc:',         # pandoc-citeproc
    '  Latex '                  # Latexmk
]
# only for fatal errors
log_error = [
    'YAML parse exception',     # Pandoc
    'Error',                    # Latexmk?
    '! ',                       # LaTeX
    'l.'                        # LaTeX
]

# help message epilog: exit status
help_epilog = '''
exit status:
    0: no warnings or errors
    1: one or more warnings
    2: one of the formats failed
    3: failed completely
 
'''


class PDFormatsError(Exception):
    def __init__(self):
        super().__init__(
            f'cannot interpret YAML header field "{header_key}"\n'
            + 'This field must contain a sequence of single-key mappings.\n'
            + 'Keys and values have to be strings.\n'
            + 'Keys have to be unique. Values can be omitted.'
        )


class PDPandocExitError(Exception):
    def __init__(self):
        super().__init__('some Pandoc processes failed')


# has there been a warning?
warned = False


def print_w(message):
    """print colored warning message"""
    # only for warnings that should get the user's attention
    print(Fore.YELLOW + message + Fore.RESET)
    global warned
    warned = True


def print_e(message):
    """print colored error message"""
    # only for fatal errors
    print(Fore.RED + message + Fore.RESET)


def print_h(heading):
    """print colored heading"""
    heading = f'――― {heading} ' + '―' * 79
    print(Fore.GREEN + heading[:79] + Fore.RESET)


def print_log(message):
    """print log message, colored based on markers"""
    warning = any(message.startswith(mark) for mark in log_warning)
    error = any(message.startswith(mark) for mark in log_error)
    if error:
        print_e('  ' + message)
    elif warning:
        print_w('  ' + message)
    else:
        print('  ' + message)


def get_YAML_header(filename):
    """"read first YAML document from file"""
    # read header
    header_lines = []
    header_complete = False
    with open(filename, 'r') as file:
        # skip over lines before first document start marker
        for line in file:
            line = line.rstrip()
            if line == '---':
                break
        # collect lines until next document end marker
        for line in file:
            line = line.rstrip()
            if (line == '---') or (line == '...'):
                header_complete = True
                break
            header_lines.append(line)
    if not header_complete:
        # print('file has no YAML header')
        # print()
        # ignore and simply return empty header
        return None
    if len(header_lines) == 0:
        # print('YAML header is empty')
        # print()
        # ignore and simply return empty header
        return None
    # parse header
    return safe_load('\n'.join(header_lines))


def get_format_specifications(header):
    """"obtain format specifications from YAML header"""
    # get format specifications from header field
    if (header is not None) and (header_key in header):
        formats = header[header_key]
    else:
        formats = default_formats
        print('no formats specified within file')
        print()
    # check and transform format specifications
    # `format_specs` has to be a list of single-key dicts,
    # where keys are strings and values are either strings or `None`.
    if not isinstance(formats, list):
        raise PDFormatsError()
    for fs in formats:
        if not isinstance(fs, dict) or (len(fs) != 1):
            raise PDFormatsError()
    # check fo duplicate keys
    keys = set(k for fs in formats for k, v in fs.items())
    if len(keys) < len(formats):
        raise PDFormatsError()
    # transform format specifications into (ordered) dictionary
    formats = {k: v for fs in formats for k, v in fs.items()}
    # replace missing value (`None`) by key
    formats = {k: v if v is not None else k for k, v in formats.items()}
    # check that everything is a string now
    for k, v in formats.items():
        if not isinstance(k, str):
            raise PDFormatsError()
        if not isinstance(v, str):
            raise PDFormatsError()
    return formats


def process_format(filename, ext, defaults):
    """process file with Pandoc based on a format specification"""
    dirname, filename = os.path.split(filename)
    filename, mdext = os.path.splitext(filename)
    # create Pandoc arguments
    pandoc_args = [pandoc_exe,
                   f'--defaults={defaults}.yaml',
                   f'{filename}{mdext}',
                   f'--output={filename}.{ext}']

    # run Pandoc
    print_h(f'{ext} ← {defaults}.yaml')
    print('▶ ' + ' '.join([shlex.quote(pa) for pa in pandoc_args]))
    with subprocess.Popen(pandoc_args,
                          cwd=dirname,
                          stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT,
                          text=True,
                          errors='replace',
                          bufsize=1) as proc:
        for line in proc.stdout:
            line = line.rstrip()
            print_log(line)
    if proc.returncode == 0:
        print(f'◁ {os.path.join(dirname, filename)}.{ext}')
    else:
        print_e(f'exited with code {proc.returncode}')
    print()

    return proc.returncode


def pandoc_defaults(filename, first=False):
    """Pandoc/Defaults implementation"""

    # get YAML header
    header = get_YAML_header(filename)

    # get format specifications
    formats = get_format_specifications(header)

    # list formats
    print('formats:')
    for ext, defaults in formats.items():
        print(f'    {ext} ← {defaults}')
    print()

    # optionally restrict to first format
    if first:
        ext = list(formats.keys())[0]
        formats = {ext: formats[ext]}
        print(f'processing only first ({ext})')
        print()

    # process formats
    rcs = []
    for ext, defaults in formats.items():
        returncode = process_format(filename, ext, defaults)
        rcs.append(returncode)
    if any(rc != 0 for rc in rcs):
        raise PDPandocExitError()


if __name__ == '__main__':
    # initialize platform-independent output color
    colorama.init()
    atexit.register(colorama.deinit)    # necessary?

    print()
    print(Style.BRIGHT + 'Pandoc/Defaults' + Style.NORMAL)
    print()

    # get Pandoc executable
    pandoc = os.getenv('PD_PANDOC', 'pandoc')
    pandoc_exe = shutil.which(pandoc)
    if pandoc_exe is None:
        print_e(f'could not find Pandoc executable "{pandoc}"')
        print_e('use the environment variable PD_PANDOC to set it')
        print()
        sys.exit(3)

    # process command line arguments
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawTextHelpFormatter,
        epilog=help_epilog)
    parser.add_argument('filename',
                        help='file to be processed')
    parser.add_argument('-f', '--first',
                        help='process only the first format',
                        action='store_true')
    # group = parser.add_mutually_exclusive_group()
    # group.add_argument('-c', '--clean',
    #                    help='delete all files resulting from formats',
    #                    action='store_true')
    # group.add_argument('-w', '--watch',
    #                    help='watch the file for changes and reprocess',
    #                    action='store_true')
    args = parser.parse_args()      # exits if error or `--help`
    args.filename = os.path.abspath(args.filename)

    # print canonical command line
    cargs = sys.argv[0]
    if args.first:
        cargs += ' --first'
    # if args.clean:
    #     cargs += ' --clean'
    # if args.watch:
    #     cargs += ' --watch'
    cargs += ' ' + args.filename
    print(f'▶ {cargs}')
    print()

    # run
    try:
        warned = False
        pandoc_defaults(args.filename, first=args.first)
        if warned:
            sys.exit(1)
    except FileNotFoundError as e:
        print_e(f'file {e.filename} does not exist')
        sys.exit(3)
    except YAMLError as e:
        print_e('cannot parse YAML header')
        print_e(e.context + ', ' + e.problem)
        if hasattr(e, 'problem_mark'):
            pm = e.problem_mark
            print_e(f'in header line {pm.line + 1}, column {pm.column + 1}')
        sys.exit(3)
    except PDFormatsError as e:
        print_e(e.args[0])
        print()
        sys.exit(3)
    except PDPandocExitError as e:
        print_e(e.args[0])
        print()
        sys.exit(2)

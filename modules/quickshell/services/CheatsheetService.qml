pragma Singleton
import Quickshell
import Quickshell.Io
import QtQuick

Item {
  property bool windowVisible: false
  property var keybinds: ({
    "neovim": [
      {
        "type": "label",
        "text": "information from: https://neovimcheatsheet.com/"
      },
      {
        "type": "category",
        "name": "Modes",
        "labels": [
          "insert before cursor: i",
          "insert at first non-blank: shift + i",
          "insert after cursor: a",
          "insert at line end: shift + a",
          "new line below, insert: o",
          "new line above, insert: shift + o",
          "visual (character): v",
          "visual (line): shift + v",
          "visual (block): ctrl + v",
          "command mode: :",
          "normal mode: esc / ctrl + [",
          "replace: r"
        ]
      },
      {
        "type": "category",
        "name": "Navigation - Basic",
        "labels": [
          "left, down, up, right: h, j, k, l",
          "next word / WORD: w / shift + w",
          "previous word / WORD: b / shift + b",
          "end of word / WORD: e / shift + e",
          "line start / first non-blank: 0 / ^",
          "line end: $",
          "file start / file end: gg / shift + g",
          "go to line N: :{N}",
          "jump to matching bracket: %",
          "previous / next blank line: { / }",
          "half-page down / up: ctrl + d / ctrl + u",
          "full-page down / up: ctrl + f / ctrl + b"
        ]
      },
      {
        "type": "category",
        "name": "Editing",
        "labels": [
          "delete character: x",
          "delete line: dd",
          "delete word: dw",
          "delete to end of line: d$ / D",
          "yank (copy) line: yy",
          "yank to end of line: Y / y$",
          "yank word: yw",
          "paste after / before cursor: p / P",
          "undo: u",
          "redo: ctrl + r",
          "change line / to end of line: cc / C",
          "change word: cw",
          "replace single character: r{char}",
          "toggle case: ~",
          "join line below to current: J",
          "repeat last change: ."
        ]
      },
      {
        "type": "category",
        "name": "Text Objects",
        "labels": [
          "inner / around word: iw / aw",
          "inner / around sentence: is / as",
          "inner / around paragraph: ip / ap",
          "inner / around double quotes: i\" / a\"",
          "inner / around single quotes: i' / a'",
          "inner / around backticks: i` / a`",
          "inner / around parentheses: i( / a(",
          "inner / around brackets: i[ / a[",
          "inner / around braces: i{ / a{",
          "inner / around HTML tag: it / at"
        ]
      },
      {
        "type": "category",
        "name": "Search & Replace",
        "labels": [
          "search forward: /pattern",
          "search backward: ?pattern",
          "next / previous match: n / N",
          "search word under cursor (forward): *",
          "search word under cursor (backward): #",
          "replace first on line: :s/old/new/",
          "replace all on line: :s/old/new/g",
          "replace all in file: :%s/old/new/g",
          "replace with confirmation: :%s/old/new/gc",
          "clear search highlight: :noh"
        ]
      },
      {
        "type": "category",
        "name": "Splits & Windows",
        "labels": [
          "horizontal split: :sp",
          "vertical split: :vsp",
          "horizontal split: ctrl + w, s",
          "vertical split: ctrl + w, v",
          "move between splits: ctrl + w, h/j/k/l",
          "move split to edge: ctrl + w, H/J/K/L",
          "equalize split sizes: ctrl + w, =",
          "maximize height / width: ctrl + w, _ / |",
          "increase / decrease height: ctrl + w, + / -",
          "close split: ctrl + w, q",
          "close all other splits: ctrl + w, o"
        ]
      },
      {
        "type": "category",
        "name": "Tabs",
        "labels": [
          "open new tab: :tabnew",
          "open file in new tab: :tabnew {file}",
          "next / previous tab: gt / gT",
          "next / previous tab: :tabn / :tabp",
          "close current tab: :tabclose",
          "close all other tabs: :tabonly",
          "go to tab N: {N}gt"
        ]
      },
      {
        "type": "category",
        "name": "Files & Buffers",
        "labels": [
          "edit file: :e {file}",
          "save: :w",
          "write a copy: :w {file}",
          "save, creating parent dirs: :w ++p",
          "save and quit: :wq / :x",
          "quit: :q",
          "quit without saving: :q!",
          "save all and quit: :wqa",
          "list buffers: :ls / :buffers",
          "next / previous buffer: :bn / :bp",
          "delete (close) buffer: :bd",
          "switch to buffer N: :b {N}",
          "toggle last two buffers: ctrl + ^"
        ]
      },
      {
        "type": "category",
        "name": "Marks & Jumps",
        "labels": [
          "set local mark: m{a-z}",
          "set global mark: m{A-Z}",
          "jump to mark line: '{mark}",
          "jump to exact mark position: `{mark}",
          "jump to last position: ''",
          "jump back / forward in history: ctrl + o / ctrl + i",
          "list all marks: :marks"
        ]
      },
      {
        "type": "category",
        "name": "Macros",
        "labels": [
          "start recording macro: q{a-z}",
          "stop recording: q",
          "play macro: @{a-z}",
          "repeat last macro: @@",
          "play macro N times: {N}@{a-z}",
          "view registers / macros: :reg"
        ]
      },
      {
        "type": "category",
        "name": "Visual Mode",
        "labels": [
          "select characters: v + motion",
          "select lines: V + motion",
          "block select: ctrl + v + motion",
          "delete selection: d / x",
          "yank selection: y",
          "change selection: c",
          "indent / un-indent: > / <",
          "lowercase / uppercase: u / U",
          "run command on selection: :",
          "reselect last selection: gv"
        ]
      },
      {
        "type": "category",
        "name": "Folding",
        "labels": [
          "close / open fold: zc / zo",
          "toggle fold: za",
          "close / open all folds at cursor: zC / zO",
          "close all / open all folds in file: zM / zR",
          "create fold: zf{motion}",
          "delete fold at cursor: zd",
          "next / previous fold: zj / zk"
        ]
      },
      {
        "type": "category",
        "name": "Neovim-Specific",
        "labels": [
          "run health diagnostics: :checkhealth",
          "open built-in terminal: :terminal",
          "exit terminal to Normal mode: ctrl + \\ ctrl + n",
          "open Lazy.nvim: :Lazy",
          "open Mason: :Mason",
          "LSP hover documentation: K",
          "go to local declaration: gd",
          "find references: grr",
          "go to implementation: gri",
          "rename symbol: grn",
          "code action: gra",
          "document symbols: gO",
          "signature help (Insert): ctrl + s",
          "next / previous diagnostic: ]d / [d"
        ]
      },
      {
        "type": "category",
        "name": "Useful Commands",
        "labels": [
          "show line numbers: :set number",
          "relative line numbers: :set relativenumber",
          "toggle line wrap: :set wrap / :set nowrap",
          "case-insensitive search: :set ignorecase",
          "enable spell check: :set spell",
          "sort lines: :sort",
          "run shell command: :!{cmd}",
          "insert shell output: :r !{cmd}",
          "show where mapping is defined: :verbose map {key}",
          "show file info and cursor position: ctrl + g",
          "show character codes: ga"
        ]
      }
    ],
    "yazi": [
      {
        "type": "label",
        "text": "information from: https://ricoberger.de/cheat-sheets/yazi/"
      },
      {
        "type": "category",
        "name": "Navigation",
        "labels": [
          "move cursor up: k / Up",
          "move cursor down: j / Down",
          "enter hovered directory: l / Right",
          "leave directory: h / Left",
          "seek up 5 units in preview: K",
          "seek down 5 units in preview: J",
          "move cursor to top: gg",
          "move cursor to bottom: G",
          "jump to directory using zoxide: z",
          "jump to directory / reveal file using fzf: Z"
        ]
      },
      {
        "type": "category",
        "name": "File Operations",
        "labels": [
          "open selected files: o / Enter",
          "open selected files interactively: O / Shift + Enter",
          "show file information: Tab",
          "yank selected files (copy): y",
          "yank selected files (cut): x",
          "paste yanked files: p",
          "paste yanked files (overwrite): P",
          "cancel yank status: Y / X",
          "trash selected files: d",
          "permanently delete selected files: D",
          "create file / directory: a",
          "rename selected files: r",
          "toggle hidden files: .",
          "run shell command: ;",
          "run shell command and block: :",
          "symlink absolute path of yanked files: -",
          "symlink relative path of yanked files: _",
          "hardlink yanked files: ctrl + -"
        ]
      },
      {
        "type": "category",
        "name": "Selection",
        "labels": [
          "toggle selection of hovered file: Space",
          "enter visual mode (selection): v",
          "enter visual mode (unset): V",
          "select all files: ctrl + a",
          "inverse selection: ctrl + r",
          "cancel selection: Esc"
        ]
      },
      {
        "type": "category",
        "name": "Copy Paths",
        "labels": [
          "copy file path: cc",
          "copy directory path: cd",
          "copy filename: cf",
          "copy filename without extension: cn"
        ]
      },
      {
        "type": "category",
        "name": "Filter Files",
        "labels": [
          "filter files: f"
        ]
      },
      {
        "type": "category",
        "name": "Find Files",
        "labels": [
          "find next file: /",
          "find previous file: ?",
          "go to next found file: n",
          "go to previous found file: N"
        ]
      },
      {
        "type": "category",
        "name": "Search Files",
        "labels": [
          "search files by name using fd: s",
          "search files by content using ripgrep: S",
          "cancel ongoing search: ctrl + s"
        ]
      },
      {
        "type": "category",
        "name": "Sorting",
        "labels": [
          "sort by modified time: ,m",
          "sort by modified time (reverse): ,M",
          "sort by birth time: ,b",
          "sort by birth time (reverse): ,B",
          "sort by file extension: ,e",
          "sort by file extension (reverse): ,E",
          "sort alphabetically: ,a",
          "sort alphabetically (reverse): ,A",
          "sort naturally: ,n",
          "sort naturally (reverse): ,N",
          "sort by size: ,s",
          "sort by size (reverse): ,S",
          "sort randomly: ,r"
        ]
      },
      {
        "type": "category",
        "name": "Multi-Tab",
        "labels": [
          "create new tab with CWD: t",
          "switch to n-th tab: 0 - 9",
          "switch to previous tab: [",
          "switch to next tab: ]",
          "swap current tab with previous: {",
          "swap current tab with next: }",
          "close current tab: ctrl + c"
        ]
      },
      {
        "type": "category",
        "name": "Configuration",
        "labels": [
          "general configuration: yazi.toml",
          "keybindings configuration: keymap.toml",
          "color scheme configuration: theme.toml",
          "configuration directory (Unix): ~/.config/yazi/",
          "configuration directory (Windows): %AppData%\\yazi\\config\\"
        ]
      }
    ],
    "tmux": [
      { 
        "type": "label", 
        "text": "main mod (mm): Ctrl + A" 
      },
      {
        "type": "category",
        "name": "windows",
        "labels": [
          "new window: mm + c",
          "change window: mm + win num"
        ]
      },
      {
        "type": "category",
        "name": "panes",
        "labels": [
          "split vertical: mm + v",
          "split horizontal: mm + s",
          "change pane: alt + h/j/k/l",
          "kill pane: mm + x"
        ]
      },
      {
        "type": "category",
        "name": "copy mode",
        "labels": [
          "enter copy mode: mm + [",
          "copy mode selection: shift + v",
          "yank: y"
        ]
      },
      {
        "type": "category",
        "name": "others",
        "labels": [
          "overview: mm + w",
          "detach: mm + d"
        ]
      }
    ],
    "mangowm": []
  })
}

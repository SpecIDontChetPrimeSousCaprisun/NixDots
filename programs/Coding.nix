{ config, lib, pkgs, ... }:

{
   environment.systemPackages = with pkgs; [
     git
     gnumake
     gcc
     python3
     butler
     emscripten
     aseprite
     gdb
     linuxPackages.perf 
     flamegraph
     tmux
     rustup
     tree-sitter
     tree-sitter-grammars.tree-sitter-c
     tree-sitter-grammars.tree-sitter-lua
     tree-sitter-grammars.tree-sitter-css
     tree-sitter-grammars.tree-sitter-cpp
     tree-sitter-grammars.tree-sitter-nix
     tree-sitter-grammars.tree-sitter-bash
     tree-sitter-grammars.tree-sitter-http
     tree-sitter-grammars.tree-sitter-java
     tree-sitter-grammars.tree-sitter-rust
     tree-sitter-grammars.tree-sitter-make
     tree-sitter-grammars.tree-sitter-html
     tree-sitter-grammars.tree-sitter-json
     tree-sitter-grammars.tree-sitter-qmljs 

     neovim
     vimPlugins.LazyVim
     ripgrep    # for telescope/grep
     fd         # for file finding
     lazygit    # optional, LazyVim integrates with it
     nodejs     # needed by several LSPs/plugins

     cmakeMinimal
   ];

   # add to your configuration.nix
   programs.direnv.enable = true;
}

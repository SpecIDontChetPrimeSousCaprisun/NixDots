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

     neovim
     vimPlugins.LazyVim
     ripgrep    # for telescope/grep
     fd         # for file finding
     lazygit    # optional, LazyVim integrates with it
     nodejs     # needed by several LSPs/plugins
   ];
}

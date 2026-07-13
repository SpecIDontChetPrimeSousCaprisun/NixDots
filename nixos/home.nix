{ config, pkgs, ... }:

{
  home.username = "chevre";
  home.homeDirectory = "/home/chevre";
  home.stateVersion = "24.11";

  programs.bash = {
    enable = true;
    shellAliases = {
      btw = "echo i use nixos btw";
    }
  };
}

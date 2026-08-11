{ pkgs, ... }:

{
  home.username = "root";
  home.homeDirectory = "/root";
  home.stateVersion = "26.11";

  home.file.".config/nvim/lua".source = ./modules/nvim/lua;
  home.file.".config/nvim/init.lua".source = ./modules/nvim/init.lua;
 
  # home.file."Images/Wall.png" = ./wallpapers/Wall.png;

  home.packages = with pkgs; [];
}

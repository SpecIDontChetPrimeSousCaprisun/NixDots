{ pkgs, ... }:

{
  home.username = "chevre";
  home.homeDirectory = "/home/chevre";
  home.stateVersion = "26.11";

  xdg.configFile."alacritty".source = ./modules/alacritty; 
  xdg.configFile."cava".source = ./modules/cava;
  xdg.configFile."fetch".source = ./modules/fetch;
  xdg.configFile."hypr".source = ./modules/hypr;
  # xdg.configFile."mango".source = ./modules/mango;
  xdg.configFile."mpd".source = ./modules/mpd;
  xdg.configFile."nvim".source = ./modules/nvim;
  xdg.configFile."quickshell".source = ./modules/quickshell;
  xdg.configFile."rofi".source = ./modules/rofi;
  xdg.configFile."swaync".source = ./modules/swaync;
  xdg.configFile."waybar".source = ./modules/waybar;
  xdg.configFile."wlogout".source = ./modules/wlogout;
  xdg.configFile."vesktop/settings/quickCss.css".source = ./modules/quickCss.css;

  # home.file."Images/Wall.png" = ./wallpapers/Wall.png;

  home.packages = with pkgs; [];
}

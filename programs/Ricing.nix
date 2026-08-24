{ config, lib, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    hyprland
    hyprlock
    waybar
    alacritty
    rofi
    fetch
    yazi
    starship
    mpd
    mpc
    rmpc
    swaynotificationcenter
    awww
    wlogout
    cava
    btop
    grim
    slurp
    wl-clipboard
    cmatrix
    hyprpicker
    brightnessctl
    quickshell
  ];

  programs.hyprland.enable = true;
  programs.mango.enable = true;
  
  programs.zsh.enable = true;
  users.users.chevre.shell = pkgs.zsh;

  services.xserver.displayManager.lightdm.enable = false;
}

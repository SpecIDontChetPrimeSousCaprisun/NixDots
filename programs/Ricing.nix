{ inputs, config, lib, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    hyprlock
    waybar
    kitty
    rofi
    fastfetch 
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
    xremap
  ];

  programs.mango.enable = true;
  
  programs.zsh.enable = true;
  users.users.chevre.shell = pkgs.zsh;

  services.xserver.displayManager.lightdm.enable = false;
}

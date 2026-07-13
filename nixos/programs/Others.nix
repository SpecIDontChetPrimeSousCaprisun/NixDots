{ config, lib, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    librewolf
    vesktop
    bat
    onlyoffice-desktopeditors
    blender
    krita
    unzip
    zip
    xz
    fd
    efibootmgr
    obs-studio
  ];
}

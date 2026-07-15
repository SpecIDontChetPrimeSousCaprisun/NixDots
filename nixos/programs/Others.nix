{ config, lib, pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    librewolf
    vesktop
    bat
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

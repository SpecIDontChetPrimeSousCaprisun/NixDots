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
    mokutil
    efitools
    dmidecode
    sbsigntool
    obs-studio
    exfatprogs
    kid3
    mpv
    imv
    pulseaudioFull
  ];
}

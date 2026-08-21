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
    thunar
    transmission_4
    ventoy
  ];

  services.pipewire = {
    enable = true;
    alsa.enable = true;
    pulse.enable = true;
  };

  xdg.portal = {
    enable = true;
    extraPortals = with pkgs; [
      xdg-desktop-portal-gtk
    ];
  };

  nixpkgs.config.permittedInsecurePackages = [
    "ventoy-1.1.12"
  ];
}

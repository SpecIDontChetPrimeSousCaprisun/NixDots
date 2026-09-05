{ config, lib, pkgs, ... }:

{
  nixpkgs.config.allowUnsupportedSystem = true;

  environment.systemPackages = with pkgs; [
    onlyoffice-desktopeditors
    zotero
  ];
}

{ config, lib, pkgs, ... }:

{
  imports =
    [ 
      ./programs/Coding.nix
      ./programs/Ricing.nix
      ./programs/Others.nix
      ./programs/Drivers.nix
      ./programs/School.nix
      ./programs/Gaming.nix
      ./programs/vm.nix
    ];

  # Allow unfree packages
  nixpkgs.config.allowUnfree = true;
  # Allow FHS
  programs.nix-ld.enable = true;
}

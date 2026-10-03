{ inputs, pkgs, config, ... }:
let
  zen =
    inputs.zen-browser.packages.${pkgs.stdenv.hostPlatform.system}.beta-unwrapped;

  zen-autoconfig = zen.overrideAttrs (oldAttrs: rec {
    libName = "zen-bin-1.22.2b";
    fsautoconfig = (
      builtins.fetchurl {
        url = "https://raw.githubusercontent.com/MrOtherGuy/fx-autoconfig/master/program/config.js";
        sha256 = "80dc421264a3ea04275e1724b7b57234f89254e9582a6c17e9a911b65c3aa6d7";
      }
    );
    configpref = (
      builtins.fetchurl {
        url = "https://raw.githubusercontent.com/MrOtherGuy/fx-autoconfig/refs/heads/master/program/defaults/pref/config-prefs.js";
        sha256 = "6bfd2ed139d18ff5178e0fc62a3b4058540ddbeba3adc912c0d69edb70c17ece";
      }
    );

    postInstall =
      (oldAttrs.postInstall or "")
      + ''
        chmod -R u+w "$out/lib/${libName}"
        cp "${fsautoconfig}" "$out/lib/${libName}/config.js"
        mkdir -p "$out/lib/${libName}/defaults/pref"
        cp "${configpref}" "$out/lib/${libName}/defaults/pref/config-pref.js"
      '';
  });
in
{
  home.packages = [
    (config.lib.nixGL.wrap ((pkgs.wrapFirefox) zen-autoconfig {}))
  ];

  home.username = "chevre";
  home.homeDirectory = "/home/chevre";
  home.stateVersion = "26.11";

  xdg.configFile."fastfetch".source = ./modules/fastfetch;
  xdg.configFile."kitty".source = ./modules/kitty;
  xdg.configFile."cava".source = ./modules/cava;
  xdg.configFile."hypr".source = ./modules/hypr;
  xdg.configFile."mango".source = ./modules/mango;
  xdg.configFile."mpd".source = ./modules/mpd;
  xdg.configFile."nvim".source = ./modules/nvim;
  xdg.configFile."quickshell".source = ./modules/quickshell;
  xdg.configFile."rofi".source = ./modules/rofi;
  xdg.configFile."swaync".source = ./modules/swaync;
  xdg.configFile."tmux".source = ./modules/tmux;
  xdg.configFile."waybar".source = ./modules/waybar;
  xdg.configFile."wlogout".source = ./modules/wlogout;
  xdg.configFile."vesktop/settings/quickCss.css".source = ./modules/quickCss.css;

  # home.file."Images/Wall.png" = ./wallpapers/Wall.png;
}

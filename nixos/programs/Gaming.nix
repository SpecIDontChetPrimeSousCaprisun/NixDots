{ pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    mangohud
    protonup-ng
    prismlauncher
    gamescope
    openttd
  ];

  environment.sessionVariables = {
    STEAM_EXTRA_COMPAT_TOOLS_PATHS = "/home/chevre/.steam/root/compatibilitytools.d";
  };

  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
    gamescopeSession.enable = true;
    extraCompatPackages = [ pkgs.proton-ge-bin ];
  };

  programs.corectrl = {
    enable = true;
    gpuOverclock.enable = true;  # allows overclocking without extra polkit prompts every time
  };

  programs.gamemode = {
    enable = true;
    settings = {
      general = {
        renice = 10;
      };
      gpu = {
        apply_gpu_optimisations = "accept-responsibility";
        gpu_device = 0;
        nv_powermizer_mode = 1;  # 1 = prefer max performance on NVIDIA
      };
    };
  };
  powerManagement.cpuFreqGovernor = "performance";
  services.udev.extraRules = ''
    ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/scheduler}="none"
  '';
  security.polkit.enable = true;
}


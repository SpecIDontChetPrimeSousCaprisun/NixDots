{ pkgs, ... }: 
{
    environment.systemPackages = with pkgs; [
	qemu
	libvirt
    ];

    
    users.groups.libvirtd.members = ["chevre"];

    programs.virt-manager.enable = true;
    virtualisation.libvirtd.enable = true;
    virtualisation.libvirtd.onBoot = "start";
    virtualisation.spiceUSBRedirection.enable = true;
}

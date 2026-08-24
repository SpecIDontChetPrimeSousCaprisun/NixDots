{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    mangowm = {
      url = "github:mangowm/mango";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, mangowm, ...}@inputs: {
    nixosConfigurations.im-on-nixos-btw = nixpkgs.lib.nixosSystem {
      modules = [ 
        ./configuration.nix 
	      home-manager.nixosModules.home-manager
        mangowm.nixosModules.mango
      ];
    };
  };
}

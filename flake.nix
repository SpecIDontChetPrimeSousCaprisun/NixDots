{
<<<<<<< HEAD
    description = "gaming flake";
    inputs = {
	nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
	home-manager = {
	    url = "github:nix-community/home-manager/master";
	    inputs.nixpkgs.follows = "nixpkgs";
	};
    };

    outputs = { self, nixpkgs, home-manager, ... }@inputs: {
	nixosConfigurations.nixos-btw = nixpkgs.lib.nixosSystem {
	    specialArgs = { inherit inputs; };
	    modules = [
		./configuration.nix
		home-manager.nixosModules.home-manager {
		    home-manager.useGlobalPkgs = true;
		    home-manager.useUserPackages = true;
		    home-manager.users.chevre = import ./home.nix;
		    home-manager.extraSpecialArgs = {
			inherit inputs;
		    };

		    home-manager.backupFileExtension = "bak";
		}
	    ];
	};
    };
=======
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    mangowm = {
      url = "github:mangowm/mango";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    zen-browser = {
      url = "github:0xc000022070/zen-browser-flake";
    };
  };

  outputs = { self, nixpkgs, home-manager, mangowm, zen-browser, ...}@inputs: {
    nixosConfigurations.im-on-nixos-btw = nixpkgs.lib.nixosSystem {
      specialArgs = {inherit inputs;};
      modules = [ 
        ./configuration.nix 
	home-manager.nixosModules.home-manager

	{
          home-manager.useGlobalPkgs = true;
          home-manager.useUserPackages = true;
          home-manager.users.chevre = import ./home.nix;
          home-manager.extraSpecialArgs = {
            inherit inputs;
          };
          home-manager.backupFileExtension = "bak";
        }
        mangowm.nixosModules.mango
      ];
    };
  };
>>>>>>> db97dce8000047021a91f60b1dd117d3fc385fc6
}

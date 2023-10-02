{
  description = "yaaaaaaaaaaaaaaaaaaaaa";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    unstable-nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, unstable-nixpkgs }:
  let
    system = "x86_64-linux";

    pkgs = import nixpkgs {
      inherit system;
    };
    unstable = import unstable-nixpkgs {
      inherit system;
      # - [Overlays | NixOS & Flakes Book](https://nixos-and-flakes.thiscute.world/nixpkgs/overlays)
      overlays = [
        (self: super: {
          # bun 1.0 is not available in nixpkgs yet
          bun = super.bun.overrideAttrs (old: rec {
            version = "1.0.0";
            src = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-linux-x64.zip";
              hash = "sha256-1ju7ZuW82wRfXEiU24Lx9spCoIhhddJ2p4dTTQmsa7A=";
            };
          });
        })
      ];
    };
  in
  {
    devShells."${system}".default = (import ./shell.nix { inherit pkgs; inherit unstable; });
  };
}

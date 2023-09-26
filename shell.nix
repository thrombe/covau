{ nixpkgs ? import <nixpkgs> {}, nixpkgs-unstable ? import <nixos-unstable> {} }:

let
  unstable-overlays = self: super: {
    # bun 1.0 is not available in nixpkgs yet
    bun = super.bun.overrideAttrs (old: rec {
      version = "1.0.0";
      src = pkgs.fetchurl {
        url = "https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-linux-x64.zip";
        hash = "sha256-1ju7ZuW82wRfXEiU24Lx9spCoIhhddJ2p4dTTQmsa7A=";
      };
    });
  };
  stable-overlays = self: super: {
    
  };

  pinnedPkgs = nixpkgs.fetchFromGitHub {
    owner  = "NixOS";
    repo   = "nixpkgs";
    rev    = "2ab91c8d65c00fd22a441c69bbf1bc9b420d5ea1";
    sha256 = "sha256-wrsPjsIx2767909MPGhSIOmkpGELM9eufqLQOPxmZQg";
  };
  unstablePinned = nixpkgs.fetchFromGitHub {
    owner = "NixOS";
    repo = "nixpkgs";
    rev = "e7f38be3775bab9659575f192ece011c033655f0";
    sha256 = "sha256-vYGY9bnqEeIncNarDZYhm6KdLKgXMS+HA2mTRaWEc80";
  };
  pkgs = import pinnedPkgs { overlays = [ stable-overlays ]; };
  unstable = import unstablePinned { overlays = [ unstable-overlays ]; };
in pkgs.mkShell {
    packages = with pkgs; [
        nodejs_20
        unstable.bun
        unstable.deno
        netlify-cli

        neovim
    ];
}
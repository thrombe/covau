{ pkgs ? import <nixpkgs> {}, unstable ? import <nixos-unstable> {} }:

pkgs.mkShell {
    packages = with pkgs; [
        nodejs_20
        unstable.bun
        unstable.deno
        netlify-cli

        neovim
    ];
}
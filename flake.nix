{
  description = "yaaaaaaaaaaaaaaaaaaaaa";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs:
    inputs.flake-utils.lib.eachDefaultSystem (system: let
      flakePackage = flake: package: flake.packages."${system}"."${package}";
      flakeDefaultPackage = flake: flakePackage flake "default";

      pkgs = import inputs.nixpkgs {
        inherit system;
        overlays = [
          (final: prev: {
            unstable = import inputs.nixpkgs-unstable {
              inherit system;
            };
          })
        ];
      };

      fhs = pkgs.buildFHSEnv {
        name = "fhs-shell";
        targetPkgs = p: (env-packages p) ++ (custom-commands p);
        runScript = "${pkgs.zsh}/bin/zsh";
        profile = ''
          export FHS=1
          # source ./.venv/bin/activate
          # source .env
        '';
      };
      custom-commands = pkgs: [
        (pkgs.writeShellScriptBin "nothingfornowlol" ''
          #!/usr/bin/env bash
          cd $PROJECT_ROOT
        '')
      ];

      env-packages = pkgs:
        with pkgs;
          [
            nodejs_21
            unstable.bun
            unstable.deno
            netlify-cli

            nodePackages_latest.svelte-language-server
            nodePackages_latest.typescript-language-server
            tailwindcss-language-server
          ]
          ++ (custom-commands pkgs);
    in {
      packages = {
        # default = hyprkool-rs;
        # inherit hyprkool-rs hyprkool-plugin;
      };

      devShells.default =
        pkgs.mkShell {
          nativeBuildInputs = (env-packages pkgs) ++ [fhs];
          inputsFrom = [
          ];
          shellHook = ''
            export PROJECT_ROOT="$(pwd)"
          '';
        };
    });
}

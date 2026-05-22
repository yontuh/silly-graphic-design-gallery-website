{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:
{

  # 1. Enable JavaScript and Node.js runtime
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    npm = {
      enable = true;
    };
  };

  # 2. Environment variables
  env = {
    PORT = "8080";
  };

  # 3. Custom commands available inside the shell
  scripts = {
    setup.exec = "npm install";
    dev.exec = "npm run dev";
    build.exec = "npm run build";
  };

  # 4. Initialization hooks when entering the devenv environment
  enterShell = ''
    echo "=========================================================="
    echo "🪐 Space Ship Game Lobby Developer Environment 🪐"
    echo "=========================================================="
    echo ""

    if [ ! -d "node_modules" ]; then
      echo "📦 node_modules not found. Running npm install..."
      npm install
    fi

    echo "🚀 To start the development server manually, run: dev"
    echo "🌌 To run the server in the background, run: devenv up"
    echo "=========================================================="
  '';

  # 5. Background process manager (run via 'devenv up')
  processes = {
    vite.exec = "npm run dev";
  };
}

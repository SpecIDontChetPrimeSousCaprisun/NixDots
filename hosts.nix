{ config, pkgs, ... }:

{ networking.extraHosts = ''
127.0.0.1 claude.ai
127.0.0.1 chatgpt.com
'';
}

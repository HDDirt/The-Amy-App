#!/usr/bin/env fish
# scripts/setkey.fish
# Interactive helper for fish shell users to securely store an OpenAI API key
set -l CONFIG_DIR "$HOME/.config/openai"
set -l ENV_FILE "$CONFIG_DIR/env"

read -P "This will securely store an OpenAI API key in $ENV_FILE. Continue? [y/N] " resp
if test "$resp" != "y" -a "$resp" != "Y"
    echo "Aborted."
    exit 1
end

read -s -P "Enter your OpenAI API key (starts with sk-): " KEY
if test -z "$KEY"
    echo "No key entered. Aborting."
    exit 1
end

mkdir -p "$CONFIG_DIR"
printf 'set -x OPENAI_API_KEY "%s"\n' "$KEY" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Ensure fish config sources the file
if not grep -q "source $ENV_FILE" ~/.config/fish/config.fish 2>/dev/null
    echo "source $ENV_FILE" >> ~/.config/fish/config.fish
    echo "Added source line to ~/.config/fish/config.fish"
end

# Load into current fish session
source "$ENV_FILE"
echo "✅ Key stored and loaded to current fish session (if running interactively)."
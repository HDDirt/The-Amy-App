#!/usr/bin/env bash
# scripts/setkey.sh
# Interactive helper to securely store an OpenAI API key for the current user.
# This script writes the key to ~/.config/openai/env and ensures it is sourced
# from the user's shell rc file (.bashrc or .zshrc). It sets strict permissions.

set -euo pipefail

CONFIG_DIR="$HOME/.config/openai"
ENV_FILE="$CONFIG_DIR/env"

read -r -p "This will securely store an OpenAI API key in $ENV_FILE. Continue? [y/N] " RESP
if [[ "$RESP" != "y" && "$RESP" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

# Prompt for the key (hidden input)
read -s -r -p "Enter your OpenAI API key (starts with sk-): " KEY
echo

if [[ -z "$KEY" ]]; then
  echo "No key entered. Aborting."
  exit 1
fi

mkdir -p "$CONFIG_DIR"
# Write in a shell-safe format
printf 'export OPENAI_API_KEY="%s"\n' "$KEY" > "$ENV_FILE"
# Restrict permissions
chmod 600 "$ENV_FILE"

# Determine shell rc file
RC_FILE="$HOME/.bashrc"
if [[ -n "$ZSH_VERSION" || ( -n "$SHELL" && "$SHELL" == *"zsh" ) ]]; then
  RC_FILE="$HOME/.zshrc"
fi

# Ensure we source the env file from rc file
SOURCE_LINE='source ~/.config/openai/env'
if ! grep -qxF "$SOURCE_LINE" "$RC_FILE" 2>/dev/null; then
  echo "$SOURCE_LINE" >> "$RC_FILE"
  echo "Added source line to $RC_FILE"
fi

# Immediately load into current shell (best-effort)
# Note: running this script from a non-interactive shell won't affect the caller's env.
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  echo "✅ Key stored and loaded to current shell session (if running interactively)."
fi

echo "Stored at: $ENV_FILE (mode: $(stat -c %a "$ENV_FILE"))"

echo "IMPORTANT: Do NOT commit this file to version control. Keep it local and private."
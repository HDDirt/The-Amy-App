#!/usr/bin/env tcsh
# scripts/setkey.csh
# Interactive helper for csh/tcsh users
set CONFIG_DIR = "$HOME/.config/openai"
set ENV_FILE = "$CONFIG_DIR/env"

echo "This will securely store an OpenAI API key in $ENV_FILE. Continue? [y/N] "
set resp = $<
if ("$resp" != "y" && "$resp" != "Y") then
    echo "Aborted."
    exit 1
endif

echo "Enter your OpenAI API key (starts with sk-): "
stty -echo
set KEY = $<
stty echo

if ("$KEY" == "") then
    echo "No key entered. Aborting."
    exit 1
endif

mkdir -p "$CONFIG_DIR"
# csh style variable assignment
cat > "$ENV_FILE" << 'CENV'
setenv OPENAI_API_KEY "${KEY}"
CENV

chmod 600 "$ENV_FILE"

# Ensure .cshrc sources the env file
if ( ! -e ~/.cshrc ) then
    touch ~/.cshrc
endif
if ( `grep -c "source $ENV_FILE" ~/.cshrc` == 0 ) then
    echo "source $ENV_FILE" >> ~/.cshrc
    echo "Added source line to ~/.cshrc"
endif

# Source now
source "$ENV_FILE"
echo "✅ Key stored and loaded to current csh/tcsh session (if running interactively)."
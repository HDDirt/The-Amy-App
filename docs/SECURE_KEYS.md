Secure key storage (local)

This repo includes a small helper script: `scripts/setkey.sh` that prompts you for an OpenAI API key and stores it securely in your home directory at `~/.config/openai/env`.

Why use this script
- Keeps API keys out of the repository
- Sets secure filesystem permissions (600)
- Ensures your shell will source the file so tools can read `OPENAI_API_KEY`

How to use
1. Make it executable and run it:

```bash
chmod +x scripts/setkey.sh
./scripts/setkey.sh
```

2. The script will ask for confirmation and then prompt for your key (hidden input). It writes the key to `~/.config/openai/env` and adds `source ~/.config/openai/env` to your shell rc (`~/.bashrc` or `~/.zshrc`).

Security notes
- The script stores the key locally only. Do not paste your real key into chat or commit it into the repo.
- `~/.config/openai/env` is created with mode 600 so only your user can read it.
- If you rotate keys, re-run the script.

Troubleshooting
- If your shell doesn't pick up the key immediately, run:

```bash
source ~/.config/openai/env
```

- To check the value (only on your machine), run:

```bash
echo "$OPENAI_API_KEY"
```

Git guidance
- Never commit keys. Add a note to `.gitignore` for project-level `.env` files (not for your home directory).

Example .gitignore snippet (project root):

```
# local environment files
.env
.env.local
```

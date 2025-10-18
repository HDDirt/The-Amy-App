# PowerShell script: scripts/setkey.ps1
# Interactive helper for Windows PowerShell (and WSL users running PowerShell).
param()

$ConfigDir = "$env:USERPROFILE\\.config\\openai"
$EnvFile = "${ConfigDir}\\env.ps1"

$confirm = Read-Host "This will securely store an OpenAI API key in $EnvFile. Continue? [y/N]"
if ($confirm -ne 'y' -and $confirm -ne 'Y') { Write-Host 'Aborted.'; exit 1 }

$key = Read-Host -AsSecureString "Enter your OpenAI API key (starts with sk-)"

# Convert SecureString to plain text in memory only
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
$keyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

if ([string]::IsNullOrEmpty($keyPlain)) { Write-Host 'No key entered. Aborting.'; exit 1 }

if (-not (Test-Path $ConfigDir)) { New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null }

# Write PowerShell-style env file
"`$env:OPENAI_API_KEY = '$keyPlain'" | Out-File -FilePath $EnvFile -Encoding UTF8 -Force
# Set restrictive permissions for the file (best-effort)
try {
    icacls $EnvFile /inheritance:r /grant:r "$env:USERNAME:F" | Out-Null
} catch {
    # If icacls fails (non-Windows), silently continue
}

# Register in PowerShell profile
$profilePath = $profile.CurrentUserAllHosts
if (-not (Test-Path $profilePath)) { New-Item -ItemType File -Path $profilePath -Force | Out-Null }
$sourceLine = "`. $EnvFile"
if (-not (Get-Content $profilePath | Select-String -SimpleMatch $sourceLine)) {
    Add-Content -Path $profilePath -Value $sourceLine
    Write-Host "Added source line to $profilePath"
}

# Load into current session
. $EnvFile
Write-Host "✅ Key stored and loaded into current PowerShell session (if running interactively)."
# SYNAPSE — instalador (PowerShell nativo no Windows)
# Uso:
#   .\install.ps1                 # instala no repo atual
#   .\install.ps1 -RepoPath C:\caminho\outro-repo
param(
  [string]$RepoPath = "."
)

$ErrorActionPreference = "Stop"

$resolved = (Resolve-Path $RepoPath).Path

if (-not (Test-Path (Join-Path $resolved ".git"))) {
  Write-Error "ERRO: '$resolved' não é a raiz de um repositório git (.git não encontrado)."
  exit 1
}

if (-not (Test-Path (Join-Path $resolved "automation\hooks\post-commit")) -or
    -not (Test-Path (Join-Path $resolved "automation\synapse.sh"))) {
  Write-Error "ERRO: pasta 'automation/' incompleta neste repo. Copie a pasta 'automation/' do principal-brain para cá antes de instalar."
  exit 1
}

git -C $resolved config core.hooksPath automation/hooks

Write-Host "OK: core.hooksPath = $(git -C $resolved config core.hooksPath)"
Write-Host ""
Write-Host "SYNAPSE instalado em: $resolved"
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "  1. (opcional) Copy-Item automation\config.env.example automation\config.env"
Write-Host "  2. Faça um commit de teste e observe changelog/entries/, changelog/CHANGELOG.md, reports/latest.md e .git/synapse.log"
Write-Host ""
Write-Host "Para desinstalar:  git -C $resolved config --unset core.hooksPath"

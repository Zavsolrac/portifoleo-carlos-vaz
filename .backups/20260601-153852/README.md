# Backup · 2026-06-01 15:38:52 (UTC-3)

Snapshot tirado **imediatamente antes** da implementação do overlay
do Ato II ("A Convergência"), conforme solicitado.

## O que está aqui

Cópia exata destes arquivos no momento do snapshot:

| Original                | Cópia em backup        |
|-------------------------|------------------------|
| `index.html`            | `index.html.bak`       |
| `src/css/style.css`     | `style.css.bak`        |
| `src/js/narrative.js`   | `narrative.js.bak`     |
| `src/js/i18n.js`        | `i18n.js.bak`          |
| `src/js/craft.js`       | `craft.js.bak`         |
| `src/js/main.js`        | `main.js.bak`          |

## Como restaurar

Execute `restore.ps1` na raiz do projeto a partir de uma sessão
PowerShell, ou copie manualmente os arquivos:

```powershell
.\restore.ps1
```

Ou manualmente:

```powershell
Copy-Item .backups/20260601-153852/index.html.bak     index.html         -Force
Copy-Item .backups/20260601-153852/style.css.bak      src/css/style.css  -Force
Copy-Item .backups/20260601-153852/narrative.js.bak   src/js/narrative.js -Force
Copy-Item .backups/20260601-153852/i18n.js.bak        src/js/i18n.js     -Force
Copy-Item .backups/20260601-153852/craft.js.bak       src/js/craft.js    -Force
Copy-Item .backups/20260601-153852/main.js.bak        src/js/main.js     -Force
```

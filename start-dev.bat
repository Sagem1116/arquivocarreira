@echo off
setlocal enabledelayedexpansion

REM Muda para a pasta do script para garantir que o npm roda no diretório do projeto
cd /d "%~dp0"

echo ==================================================
echo Iniciando o servidor de desenvolvimento
echo Diretório atual: %cd%

echo Executando: npm install (se necessario)
if not exist node_modules (
    npm install
) else (
    echo node_modules ja existe, pulando npm install
)

echo --------------------------------------------------
echo Executando: npm run dev
npm run dev

if errorlevel 1 (
    echo --------------------------------------------------
    echo O comando falhou com codigo de erro %errorlevel%.
    echo Pressione qualquer tecla para fechar...
    pause >nul
)

endlocal

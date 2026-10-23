@echo off
chcp 65001 >nul
title Lista 07 - Consumo de API
echo Abrindo a pagina da Lista 07 no navegador...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-local.ps1"
echo.
echo Servidor encerrado. Pressione qualquer tecla para fechar.
pause >nul

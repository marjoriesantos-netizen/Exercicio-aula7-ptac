param(
  [switch]$NoBrowser,
  [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$srcDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($srcDir)) {
  $srcDir = (Get-Location).Path
}
$root = Split-Path -Parent $srcDir
if ([string]::IsNullOrWhiteSpace($root)) {
  $root = (Get-Location).Path
}

$listener = $null
$portAtual = $Port
while ($portAtual -le ($Port + 20)) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $portAtual)
    $listener.Start()
    break
  } catch {
    $listener = $null
    $portAtual++
  }
}

if (-not $listener) {
  Write-Host 'Nao foi possivel iniciar o servidor local.'
  exit 1
}

$rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
$url = "http://localhost:$portAtual/src/aula07.html"

$tipos = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/markdown; charset=utf-8'
}

function Enviar-Resposta($stream, [int]$codigo, [string]$motivo, [byte[]]$corpo, [string]$tipo) {
  $cabecalhos = @(
    "HTTP/1.1 $codigo $motivo",
    "Content-Type: $tipo",
    "Content-Length: $($corpo.Length)",
    'Cache-Control: no-store',
    'Connection: close',
    '',
    ''
  ) -join "`r`n"

  $bytesCabecalho = [System.Text.Encoding]::ASCII.GetBytes($cabecalhos)
  $stream.Write($bytesCabecalho, 0, $bytesCabecalho.Length)
  if ($corpo.Length -gt 0) {
    $stream.Write($corpo, 0, $corpo.Length)
  }
  $stream.Flush()
}

Write-Host ''
Write-Host 'Lista 07 - servidor local'
Write-Host "Pasta: $rootFull"
Write-Host "URL:   $url"
Write-Host 'Pressione Ctrl+C para parar.'
Write-Host ''

if (-not $NoBrowser) {
  Start-Process $url
}

while ($true) {
  $cliente = $listener.AcceptTcpClient()
  $stream = $null

  try {
    $stream = $cliente.GetStream()
    $leitor = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
    $linhaRequisicao = $leitor.ReadLine()

    if ([string]::IsNullOrWhiteSpace($linhaRequisicao)) {
      continue
    }

    while ($true) {
      $linha = $leitor.ReadLine()
      if ($null -eq $linha -or $linha -eq '') { break }
    }

    $partes = $linhaRequisicao -split ' '
    $metodo = $partes[0]
    $alvo = $partes[1]
    $caminho = ($alvo -split '\?')[0]
    $caminho = [System.Uri]::UnescapeDataString($caminho)

    if ($metodo -ne 'GET' -and $metodo -ne 'HEAD') {
      Enviar-Resposta $stream 405 'Method Not Allowed' ([System.Text.Encoding]::UTF8.GetBytes('Metodo nao permitido')) 'text/plain; charset=utf-8'
      continue
    }

    if ($caminho -eq '/') { $caminho = '/index.html' }

    $relativo = $caminho.TrimStart('/') -replace '/', '\'
    $completo = [System.IO.Path]::GetFullPath((Join-Path $rootFull $relativo))

    if (-not $completo.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      Enviar-Resposta $stream 403 'Forbidden' ([System.Text.Encoding]::UTF8.GetBytes('Acesso negado')) 'text/plain; charset=utf-8'
      continue
    }

    if (Test-Path -LiteralPath $completo -PathType Leaf) {
      $extensao = [System.IO.Path]::GetExtension($completo).ToLowerInvariant()
      $tipo = if ($tipos.ContainsKey($extensao)) { $tipos[$extensao] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($completo)
      Enviar-Resposta $stream 200 'OK' $bytes $tipo
    } else {
      Enviar-Resposta $stream 404 'Not Found' ([System.Text.Encoding]::UTF8.GetBytes("Arquivo nao encontrado: $caminho")) 'text/plain; charset=utf-8'
    }
  } catch {
    if ($stream) {
      try {
        Enviar-Resposta $stream 500 'Internal Server Error' ([System.Text.Encoding]::UTF8.GetBytes($_.Exception.Message)) 'text/plain; charset=utf-8'
      } catch { }
    }
  } finally {
    if ($stream) { $stream.Dispose() }
    $cliente.Close()
  }
}

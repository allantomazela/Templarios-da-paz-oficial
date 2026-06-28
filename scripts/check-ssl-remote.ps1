# Verificacao SSL remota (Windows / maquina local - nao precisa SSH).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/check-ssl-remote.ps1

$domains = @(
  "www.templariosdapazoficial.com.br",
  "templariosdapazoficial.com.br"
)

function Test-TlsCertificate {
  param([string]$HostName)

  Write-Host ""
  Write-Host "--- $HostName ---" -ForegroundColor Cyan

  try {
    $request = [System.Net.HttpWebRequest]::Create("https://$HostName/")
    $request.Timeout = 15000
    $request.AllowAutoRedirect = $false
    $null = $request.GetResponse()
    Write-Host "  [OK] HTTPS responde" -ForegroundColor Green
  }
  catch {
    if ($null -ne $_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      Write-Host "  [OK] HTTPS responde (HTTP $code)" -ForegroundColor Green
    }
    else {
      Write-Host "  [FALHA] $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  try {
    $callback = [System.Net.Security.RemoteCertificateValidationCallback] {
      param($sender, $certificate, $chain, $sslPolicyErrors)
      return $true
    }
    $tcp = New-Object System.Net.Sockets.TcpClient($HostName, 443)
    $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, $callback)
    $ssl.AuthenticateAsClient($HostName)
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
    $ssl.Close()
    $tcp.Close()

    Write-Host "  Emissor: $($cert.Issuer)"
    Write-Host "  Valido de: $($cert.NotBefore) ate: $($cert.NotAfter)"
    $daysLeft = ($cert.NotAfter - (Get-Date)).Days
    if ($daysLeft -gt 30) {
      Write-Host "  [OK] Expira em $daysLeft dias" -ForegroundColor Green
    }
    elseif ($daysLeft -gt 0) {
      Write-Host "  [AVISO] Expira em $daysLeft dias - renovar no servidor" -ForegroundColor Yellow
    }
    else {
      Write-Host "  [FALHA] Certificado expirado" -ForegroundColor Red
    }
    $san = $cert.Extensions | Where-Object { $_.Oid.FriendlyName -eq "Subject Alternative Name" }
    if ($san) {
      Write-Host "  SAN: $($san.Format($false))"
    }
  }
  catch {
    Write-Host "  [FALHA] Nao foi possivel ler certificado: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "=== Verificacao SSL remota - Templarios da Paz ===" -ForegroundColor White

foreach ($d in $domains) {
  Test-TlsCertificate -HostName $d
}

Write-Host ""
Write-Host "--- Redirecionamento HTTP -> HTTPS (www) ---" -ForegroundColor Cyan
$curlOut = & curl.exe -sS -I --max-time 10 "http://www.templariosdapazoficial.com.br/" 2>&1
$statusLine = ($curlOut | Select-Object -First 1) -join ""
$locationLine = ($curlOut | Where-Object { $_ -match "^[Ll]ocation:" } | Select-Object -First 1) -join ""
if ($statusLine -match "301|302" -and $locationLine -match "https://") {
  Write-Host "  [OK] $statusLine" -ForegroundColor Green
  Write-Host "  $locationLine" -ForegroundColor Green
}
elseif ($statusLine) {
  Write-Host "  [AVISO] Resposta inesperada: $statusLine" -ForegroundColor Yellow
}
else {
  Write-Host "  [AVISO] Nao foi possivel verificar redirecionamento" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "No servidor (SSH), execute:" -ForegroundColor White
Write-Host "  bash /opt/templarios/scripts/check-ssl-production.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "Teste externo opcional:" -ForegroundColor Gray
Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=www.templariosdapazoficial.com.br" -ForegroundColor Gray

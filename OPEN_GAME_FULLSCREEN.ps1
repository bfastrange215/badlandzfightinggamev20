# Wait for the local server to respond before launching the browser.
$address = 'http://localhost:3140'
for ($i = 0; $i -lt 90; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "$address/health" -UseBasicParsing -TimeoutSec 1
    if ($response.StatusCode -eq 200) { break }
  } catch { }
  Start-Sleep -Milliseconds 300
}
$edges = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
)
$exe = $edges | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($exe) {
  Start-Process -FilePath $exe -ArgumentList @('--new-window','--start-fullscreen', $address)
} else {
  # The fight also requests fullscreen during Create / Join / Train user clicks.
  Start-Process $address
}

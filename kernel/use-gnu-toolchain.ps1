# Switch this project to the GNU toolchain so we can build without Visual Studio (link.exe).
# Run once from the kernel folder. Requires MinGW (gcc) on PATH - see BUILDING.md.
Set-Location $PSScriptRoot
rustup toolchain install stable-x86_64-pc-windows-gnu
rustup override set stable-x86_64-pc-windows-gnu
Write-Host "Done. Run: cargo run" -ForegroundColor Green

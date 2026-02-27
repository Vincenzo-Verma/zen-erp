# Building the Kernel on Windows

- **`linker 'link.exe' not found`** → Windows is using MSVC but the C++ linker is not installed. Use **Option A** (GNU) or **Option B** (Visual Studio).
- **`dlltool.exe': program not found`** → You're on the GNU toolchain but MinGW/binutils are missing. Finish **Option A** step 2 (MSYS2 + PATH), then run `cargo run` again.

## Option A: Use the GNU toolchain (no Visual Studio)

1. **Install the GNU toolchain** (one-time):
   ```powershell
   rustup toolchain install stable-x86_64-pc-windows-gnu
   ```

2. **Install MinGW (gcc + dlltool)** so the linker and Windows toolchain are available.  
   **MSYS2** (recommended): Install from [msys2.org](https://www.msys2.org/), open the **UCRT64** or **MSYS2** terminal, then run:
   ```bash
   pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain
   ```
   Add the MSYS2 UCRT64 bin folder to your system **PATH**, e.g.:
   - `C:\msys64\ucrt64\bin`  
   Restart your terminal after changing PATH so `gcc` and `dlltool.exe` are found.

3. **Use the GNU toolchain in this project** (from the `kernel` folder):
   ```powershell
   rustup override set stable-x86_64-pc-windows-gnu
   ```

4. Build and run:
   ```powershell
   cargo run
   ```

## Option B: Use the MSVC toolchain (Visual Studio)

1. Install **Build Tools for Visual Studio** from [Visual Studio Downloads](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. In the installer, select the workload **"Desktop development with C++"** (this installs the MSVC compiler and `link.exe`).
3. Restart your terminal, then from the `kernel` folder:
   ```powershell
   cargo run
   ```

If you had previously set a GNU override, clear it first:
```powershell
rustup override unset
```

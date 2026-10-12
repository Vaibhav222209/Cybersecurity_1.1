#!/usr/bin/env bash
# Optional, verified local tools for the AEGIS cloud training workspace.
set -euo pipefail

tools_dir=/workspace/security-tools
nuclei_version=3.11.1
if [[ -d "$tools_dir" && ! -f "$tools_dir/.aegis-managed" && -n "$(ls -A "$tools_dir")" ]]; then
  echo 'Refusing to overwrite an existing unmanaged /workspace/security-tools directory.' >&2
  exit 1
fi
for required in curl dpkg-deb sha256sum unzip node; do
  command -v "$required" >/dev/null || { echo "Missing prerequisite: $required" >&2; exit 1; }
done
[[ -x /usr/bin/apt-get && -f /usr/share/keyrings/debian-archive-keyring.gpg ]] || { echo 'This helper requires Debian apt and the official Debian archive keyring.' >&2; exit 1; }
[[ "$(uname -m)" == x86_64 ]] || { echo 'This pinned Nuclei release helper currently supports Linux x86_64 only.' >&2; exit 1; }

mkdir -p "$tools_dir"/{bin,downloads,deb-root,apt/empty,apt/lists/partial,apt/archives/partial,runtime/config,runtime/cache,runtime/data}
touch "$tools_dir/.aegis-managed"
cat > "$tools_dir/apt/apt.conf" <<EOF
Dir::Etc::parts "$tools_dir/apt/empty";
Dir::Etc::main "$tools_dir/apt/empty-main";
Dir::Etc::sourcelist "$tools_dir/apt/sources.list";
Dir::Etc::sourceparts "$tools_dir/apt/empty";
Dir::State::lists "$tools_dir/apt/lists";
Dir::State::status "/var/lib/dpkg/status";
Dir::Cache::archives "$tools_dir/apt/archives";
Dir::Cache::pkgcache "$tools_dir/apt/pkgcache.bin";
Dir::Cache::srcpkgcache "$tools_dir/apt/srcpkgcache.bin";
APT::Sandbox::User "$(id -un)";
Acquire::Languages "none";
EOF
cat > "$tools_dir/apt/sources.list" <<'EOF'
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main
EOF

# Keep Debian Release signatures and package hashes enabled. Download only;
# no privileged system install or global apt configuration change is performed.
https_proxy="${HTTPS_PROXY:-${https_proxy:-}}" http_proxy="${HTTP_PROXY:-${http_proxy:-}}" APT_CONFIG="$tools_dir/apt/apt.conf" /usr/bin/apt-get update
https_proxy="${HTTPS_PROXY:-${https_proxy:-}}" http_proxy="${HTTP_PROXY:-${http_proxy:-}}" APT_CONFIG="$tools_dir/apt/apt.conf" /usr/bin/apt-get -o Debug::NoLocking=true --download-only --no-install-recommends -y install nmap gobuster
for package in "$tools_dir"/apt/archives/*.deb; do dpkg-deb -x "$package" "$tools_dir/deb-root"; done
ln -sfn "$tools_dir/deb-root/usr/bin/nmap" "$tools_dir/bin/nmap"
ln -sfn "$tools_dir/deb-root/usr/bin/gobuster" "$tools_dir/bin/gobuster"

archive="nuclei_${nuclei_version}_linux_amd64.zip"
checksums="nuclei_${nuclei_version}_checksums.txt"
release="https://github.com/projectdiscovery/nuclei/releases/download/v${nuclei_version}"
curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --max-time 60 "$release/$archive" -o "$tools_dir/downloads/$archive"
curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --max-time 60 "$release/$checksums" -o "$tools_dir/downloads/$checksums"
node --input-type=module - "$tools_dir/downloads/$checksums" "$archive" "$tools_dir/downloads/nuclei-selected.sha256" <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const [checksumsFile, archiveName, outputFile] = process.argv.slice(2);
const checksum = readFileSync(checksumsFile, 'utf8').split('\n').find(line => line.endsWith(archiveName));
if (!checksum || !/^[a-f0-9]{64}\s+/.test(checksum)) throw new Error('Official checksum entry is missing.');
writeFileSync(outputFile, `${checksum}\n`);
JS
(cd "$tools_dir/downloads" && sha256sum -c nuclei-selected.sha256)
unzip -o "$tools_dir/downloads/$archive" nuclei -d "$tools_dir/bin"
chmod +x "$tools_dir/bin/nuclei"

LD_LIBRARY_PATH="$tools_dir/deb-root/usr/lib/x86_64-linux-gnu" NMAPDIR="$tools_dir/deb-root/usr/share/nmap" "$tools_dir/bin/nmap" --version
"$tools_dir/bin/gobuster" version
XDG_CONFIG_HOME="$tools_dir/runtime/config" XDG_CACHE_HOME="$tools_dir/runtime/cache" XDG_DATA_HOME="$tools_dir/runtime/data" "$tools_dir/bin/nuclei" -version
echo 'Verified local tool installation complete. AEGIS discovers /workspace/security-tools/bin automatically.'

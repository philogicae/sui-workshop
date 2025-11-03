# sui-workshop

One-liner to auto-install & run (& dev) a `fdevc runnable project` for [Sui workshop](https://github.com/MystenLabs/sui-stack-hello-world) powered by [fdevc](https://github.com/philogicae/fast_dev_container)

[![Curl](https://img.shields.io/badge/curl-required-orange)](https://curl.se/)
[![Git](https://img.shields.io/badge/git-required-orange)](https://git-scm.com/)
[![Docker](https://img.shields.io/badge/docker-required-orange)](https://www.docker.com/get-started/)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/philogicae/sui-workshop)

> Move Docs: [Move-Book with AI](https://deepwiki.com/MystenLabs/move-book)

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/philogicae/sui-workshop/main/install_and_run | bash
```

## Project Structure

```
📁 sui-workshop
 ├── install_and_run       # Auto-install script
 ├── launch.sh              # Container launcher
 ├── 📁 project             # Git project mount
 └── 📁 fdevc_setup          # Setup scripts mount
      └── runnable.sh         # Main container script
```

- **`install_and_run`** - Installation script that ensures `fdevc` is available, clones this repository, and runs `launch.sh`.
- **`launch.sh`** - Helper script to launch a container using `fdevc` with predefined settings. Edit the configuration variables at the top to customize ports, image, persistence, etc.
- **`fdevc_setup/runnable.sh`** - The main script that runs inside the container (complete Sui setup).
- **`project/`** - The mounted target folder for git cloned project

## Usage

> Required: sui-workshop is running (quick install script or ran ./launch.sh directly)

1. Import an existing config into `./fdevc_setup`, else a new one will be created (`client.yaml`, `sui.keystore`, `dev.passphrase`).

2. Import your `dev passphrase` (`./fdevc_setup/dev.passphrase`) in `Slush` browser extension and claim [faucet](https://faucet.sui.io/?network=testnet).

3. Try out Sui template at [http://localhost:5173](http://localhost:5173) (or any other forwarded port you configured)

4. Open `sui-workshop` in your IDE and start coding!

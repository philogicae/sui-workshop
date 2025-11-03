#!/usr/bin/env bash
set -euo pipefail

# Colors and styling (consistent with install_and_run)
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
CYAN="\033[96m"
GREEN="\033[92m"
RED="\033[91m"
YELLOW="\033[93m"

# Icons
ICON_ARROW="→"
ICON_CHECK="✓"
ICON_CROSS="✗"

# Logging functions
log_step() {
	echo -e "${BOLD}${CYAN}${ICON_ARROW} $1${RESET}"
}

log_success() {
	echo -e "${BOLD}${GREEN}${ICON_CHECK} $1${RESET}"
}

log_error() {
	echo -e "${BOLD}${RED}${ICON_CROSS} $1${RESET}" >&2
}

log_warning() {
	echo -e "${BOLD}${YELLOW}⚠ $1${RESET}"
}

log_detail() {
	echo -e "  ${DIM}$1${RESET}"
}

# Configuration variables
LOCAL_BIN="${HOME}/.local/bin"
SUIUP_INSTALL_URL="https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh"
TEMPLATE_URL="https://github.com/MystenLabs/sui-stack-hello-world.git"
RETRY_COUNT=3
RETRY_DELAY=5

# Utility functions
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

retry() {
	local attempts=$1
	shift
	local count=0
	until "$@"; do
		exit_code=$?
		count=$((count + 1))
		if [ $count -lt "$attempts" ]; then
			log_warning "Command failed (attempt $count/$attempts). Retrying in ${RETRY_DELAY}s..."
			sleep $RETRY_DELAY
		else
			log_error "Command failed after $attempts attempts"
			return $exit_code
		fi
	done
}

setup_path() {
	# Add LOCAL_BIN to PATH if not already present
	if ! grep -q "$LOCAL_BIN" "${HOME}/.bashrc" 2>/dev/null; then
		log_detail "Adding $LOCAL_BIN to PATH in ~/.bashrc"
		echo "export PATH=\"$LOCAL_BIN:\$PATH\"" >>"${HOME}/.bashrc"
	fi

	# Export PATH for current session
	export PATH="$LOCAL_BIN:$PATH"
}

install_suiup() {
	if command_exists suiup; then
		log_success "$(suiup --version) already installed"
		return 0
	fi

	log_step "Installing suiup..."
	if retry $RETRY_COUNT curl -fsSL "$SUIUP_INSTALL_URL" | bash; then
		# Re-export PATH after installation
		if [ -d "$LOCAL_BIN" ]; then
			export PATH="$LOCAL_BIN:$PATH"
		fi

		if command_exists suiup; then
			log_success "$(suiup --version) installed successfully"
		else
			log_error "suiup installation failed"
			exit 1
		fi
	else
		log_error "Failed to download suiup installer"
		exit 1
	fi
}

install_sui_cli() {
	if command_exists sui; then
		log_success "$(sui --version) CLI already installed"
		return 0
	fi

	log_step "Installing sui CLI..."
	if retry $RETRY_COUNT suiup install sui@testnet -y; then
		export PATH="$LOCAL_BIN:$PATH"
		if command_exists sui; then
			log_success "$(sui --version) CLI installed successfully"
		else
			log_error "sui CLI installation failed"
			exit 1
		fi
	else
		log_error "Failed to install sui CLI"
		exit 1
	fi
}

init_sui_client() {
    if [ -f "fdevc_setup/client.yaml" ]; then
	    rm -rf "${HOME}/.sui/sui_config"
        mkdir -p "${HOME}/.sui/sui_config"
		cp -f "fdevc_setup/dev.passphrase" "${HOME}/.sui/sui_config/dev.passphrase"
        cp -f "fdevc_setup/client.yaml" "${HOME}/.sui/sui_config/client.yaml"
        cp -f "fdevc_setup/sui.keystore" "${HOME}/.sui/sui_config/sui.keystore"
        log_success "sui client config recovered successfully"
    else
        local output=$(retry $RETRY_COUNT sui client <<< $'y\n\n0\n' 2>&1)
        if [ $? -eq 0 ]; then
		    mkdir -p fdevc_setup
            local recovery_phrase=$(echo "$output" | grep "Secret Recovery Phrase :" | sed 's/.*Secret Recovery Phrase : \[//' | sed 's/\]//')
            if [ -n "$recovery_phrase" ]; then
                echo "$recovery_phrase" > "fdevc_setup/dev.passphrase"
                log_success "Recovery phrase saved to fdevc_setup/dev.passphrase"
            fi
            cp "${HOME}/.sui/sui_config/client.yaml" "fdevc_setup/client.yaml"
            cp "${HOME}/.sui/sui_config/sui.keystore" "fdevc_setup/sui.keystore"
            log_success "sui client config initialized successfully"
        else
            log_error "Failed to initialize sui client"
            exit 1
        fi
    fi
}

initialize_project() {
	if [ -f "project/README.md" ]; then
		log_success "Sui workshop project already initialized"
		return 0
	fi

	log_step "Initializing Sui workshop project..."
	if retry $RETRY_COUNT git clone $TEMPLATE_URL tmp; then
		log_step "Copying files to project directory..."
		rsync -a --ignore-existing tmp/ project/
		rm -rf tmp
		chmod -R 777 project
		log_success "Sui workshop project initialized"
	else
		log_error "Failed to initialize Sui workshop project"
		exit 1
	fi
}

prepare_project() {
	log_step "Ensuring pnpm dependencies are installed..."
	cd project/ui
	CI=true pnpm install --frozen-lockfile -s
	log_step "Configuring development environment..."
	sed -i 's/"dev": "vite"/"dev": "vite --host 0.0.0.0"/' ./package.json
	cd ..
	log_step "Ensuring permissions are set correctly..."
	chmod -R 777 .
	cd ..
}

start_project() {
	log_step "Starting development environment..."
	cd project/ui
	pnpm dev
}

# Main execution
main() {
	log_step "Setting up sui development environment..."

	# Setup PATH
	setup_path

	# Install dependencies
	install_suiup
    install_sui_cli

    # Initialize sui client
    init_sui_client
    log_success "Sui development environment ready!"
	sui client addresses

	# Initialize and start project
	initialize_project
	prepare_project
	start_project
}

# Run main function
main "$@"

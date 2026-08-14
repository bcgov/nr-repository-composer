# Running Generators

There are two ways to run the composer: a **container image** (recommended) or a
**local install**. Both run the same generators; the container simply removes the
need for a local Node.js or Yeoman installation.

## Prerequisites

### Container

Install one of the following — either can run the composer using the prebuilt
container (`ghcr.io/bcgov/nr-repository-composer`):

- [Podman](https://podman.io)
- [Docker](https://www.docker.com)

It is recommended that Windows users install and run the command using Node.js or
Podman.

> **Note:** Windows Docker has an architectural issue with correctly setting file
> permissions on mounted volumes.

### Local install

Install [Node 24](https://nodejs.org/en) and clone this repository. You can check
out a version tag (`vx.x.x`) to run a specific release.

The tool is built using [Yeoman](http://yeoman.io), a JavaScript library. You do
not need to install Yeoman separately.

## Container

### Using the Shell Script (Recommended)

The `nr-repository-composer.sh` script is the easiest way to run the composer. It
automatically detects whether you have Podman or Docker installed (preferring
Podman) and handles all the container configuration for you.

**Add the script to your repository:**

The recommended way to add this script to your repository is to run the
`nr-repository-composer` generator, which copies the script to your repository
root:

```bash
# Using the container directly
podman run --rm -it -v ${PWD}:/src --userns keep-id \
  ghcr.io/bcgov/nr-repository-composer:latest \
  nr-repository-composer:nr-repository-composer

# Or, run the generator from an existing copy
./nr-repository-composer.sh /absolute/path/to/your/repo nr-repository-composer
```

**Alternative: download the script manually:**

If you prefer, you can download the script directly from GitHub:

```bash
# Download to current directory
curl -o nr-repository-composer.sh \
  https://raw.githubusercontent.com/bcgov/nr-repository-composer/main/nr-repository-composer.sh
chmod +x nr-repository-composer.sh
```

You can optionally add the script to a directory in your `PATH`.

**Usage:**

```bash
# Syntax: nr-repository-composer.sh <working-directory> <generator> [options...]
#    <working-directory> - Path to your repository or subdirectory within it
#    <generator>         - Generator name (e.g., backstage, gh-maven-build)
#    [options...]        - Additional generator options (e.g., --help, --ask-answered)

# If the script is in your PATH
cd /path/to/your/repo
nr-repository-composer.sh . backstage-location
nr-repository-composer.sh ./frontend backstage
nr-repository-composer.sh ./frontend gh-maven-build --help

# If running from the cloned repo or script in the current directory
./nr-repository-composer.sh /path/to/your/repo gh-nodejs-build --ask-answered
```

Note: the script prefixes `nr-repository-composer:` automatically to the
generator, so you can omit it.

**How it works:**

The script:

- **Auto-detects the container runtime** — uses Podman if available, otherwise Docker
- **Finds the git repository root** from the working directory and validates it
- **Mounts the entire repository** as `/src` in the container
- **Sets the working directory** to match your relative location within the repo
- **Auto-prefixes generator names** — adds `nr-repository-composer:` automatically
- **Pulls the latest image** by default — set `PULL_IMAGE="false"` in the script to disable
- **Passes all options** to the generator

**Configuration:**

You can edit the script to customize behavior:

```bash
# Modify this to change the image version used
IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"

# Set to "false" to skip pulling the latest image (uses cached version)
PULL_IMAGE="true"
```

### Direct Container Commands

For manual control, you can run the container directly:

```bash
# Podman
podman run --rm -it -v ${PWD}:/src --userns keep-id \
  ghcr.io/bcgov/nr-repository-composer:latest \
  nr-repository-composer:gh-maven-build

# Docker
docker run --rm -it -v ${PWD}:/src \
  ghcr.io/bcgov/nr-repository-composer:latest \
  nr-repository-composer:gh-maven-build
```

These examples map the current working directory to the `/src` directory inside
the container image. The generator container image uses `/src` as its working
directory and will read and write files at that location.

The mounted `/src` directory must always be the root of the repository. Use the
"working directory" run argument (for example, `-w /src/mydir`) to alter the
working directory if you want to run the generator somewhere other than the root
of the repository. The generators always need to be able to locate the `.git`
folder, as some files are output relative to it (not relative to the working
directory).

## Local Install

For development or if you prefer not to use containers:

```bash
npx yo nr-repository-composer:gh-maven-build
```

Install the dependencies, compile the TypeScript source, and link it with
`npm link` so Yeoman can find the local installation:

```bash
npm ci
npm run build
npm link
```

After making changes in `src/`, rerun `npm run build` to recompile before
testing. See [Development Workflow](../extending/development.md) for the full
developer workflow.

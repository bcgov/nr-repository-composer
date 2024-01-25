# nr-pipeline-template: Generates GitHub CI workflow and NR Broker intention files

Run the build script:
```
./build.sh
```

Change current directory to root of repo and run the container:
```
podman run --rm -it -v$PWD:/src --userns keep-id nr-pipeline-template
```

Answer the prompts:

1. Project name (e.g. my-app)
2. Service name (e.g. my-app-war)
3. OpenShift Artifactory project (default: cc20)
4. Maven pom file root (default: repository root)

The generated files will appear in your .github/workflows and .jenkins directories.

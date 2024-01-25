# nr-pipeline-template: Generates GitHub CI workflow and NR Broker intention files

Run the generate script:
```
./generate.sh
```

Answer the prompts:

1. Project name (e.g. my-app)
2. Service name (e.g. my-app-war)
3. OpenShift Artifactory project (default: cc20)
4. Maven pom file root (default: repository root)

The generated files will appear in your .github/workflows and .jenkins directories.

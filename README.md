# nr-pipeline-template:
> A central location for storing [Yeoman](http://yeoman.io) generators used for scaffolding applications that use the NR Broker

> Currently consists of a single generator, nr-maven-build, used to generate the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub

Run the build script (optional for local testing):
```
./build.sh
```

Run the following command from the root of your application repository to generate your CI workflow and NR Broker intention files:
```
podman run --rm -it -v $PWD:/src --userns keep-id ghcr.io/bcgov-nr/nr-pipeline-template:4-pr -- nr-maven-build
```

Note: You can run the command with or without the generator specified.


Answer the prompts:

1. Project name (e.g. my-app)
2. Service name (e.g. my-app-war)
3. OpenShift Artifactory project (default: cc20)
4. Maven pom file root (default: repository root)

The generated files will appear in your .github/workflows and .jenkins directories.

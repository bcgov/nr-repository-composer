# OCI Artifacts

A container registry is used to store and fetch containers by software like
Podman. All container registries are based on a standard that allows them to
evolve to store generic artifacts. OCI Artifacts is a standard way to store those
generic artifacts. See: <https://oras.land/docs/concepts/artifact/>.

## Build Outputs

If the build output is an OCI artifact then the build must bundle the artifact in
the target layout for the deployment. For example, a Node.js application must
create a `./dist` folder and include it in the artifact; a Java/Tomcat
application must bundle `./META-INF`, `./WEB-INF`, and other required files and
directories. You may bundle additional support folders and files in the artifact
as well.

The build is expected to set the following annotations in the manifest (the
generator should set this up):

- `org.opencontainers.image.description`
- `org.opencontainers.image.licenses`
- `org.opencontainers.image.source`
- `org.opencontainers.image.title`
- `org.opencontainers.image.version`

See: <https://github.com/opencontainers/image-spec/blob/main/annotations.md>

## Usage

The built OCI artifact can be used in deployments or as static assets in another
build. When you pull the artifact, any folders (like `dist`) from the root of
your service folder that were pushed will be maintained.

### Static assets

The most common pattern for using static assets from a previous build step is
having a backend host the frontend files. Build generators that support using OCI
Artifacts as static assets will prompt for the artifacts to pull and the output
locations.

If used as a static asset, the manifest file (which includes all the required
annotations) should be stored in `manifest.json` in the output folder. Builds are
not permitted to include assets without a way to discover their source.

If you are using the OCI artifact as hosted static files (example: frontend
JavaScript application), it is recommended that the `dist` folder be configured
as the static file root. The `manifest.json` and other support files should not
be available to a user.

## Deployment Configuration

A deployment configuration is an OCI Artifact that bundles together the
deployment files. It is triggered by pushing a `d*` tag that uses semantic
versioning. The tag should be manually created, annotated, and pushed to the
GitHub repository. The GitHub release workflow should not be used to create the
tag.

```bash
git tag -a d1.0.0 -m 'Initial deployment config'
git push origin d1.0.0
```

The deployment configuration artifact is essentially a checkout of the tag from
the git repository with non-deployment files stripped out. There are a number of
reasons why using the git repository directly is less ideal compared to creating
and using an artifact. Chiefly, it is more efficient and easier to use the
artifact.

The deployment configuration is combined with an artifact to create a deployment.
It allows the developer to roll back or change the deployment configuration
without needing to update the artifact.

A deployment configuration does not guarantee the same outcome every time, as the
configuration may have dynamic elements. For example, the deployment
configuration may specify deploying a major version of a software package. The
exact version used will then depend on what minor (patch) versions are available
when the deployment occurs.

The workflow 'Build deployment config' will be created when a deployment generator
is run. If you want to test deployment changes, create a branch using the pattern
`deploy/*`, as this will trigger the configuration build as well.

Like software releases, changes to deployment configurations should always be
tested in all environments, even if no change is expected. Developers should avoid
mixing code and deployment configuration changes in the same pull request.

### Tag Format

The tag should start with a `d` followed by a version number. This version number
should use semantic versioning. There is no requirement that the service and
deployment configuration versions match.

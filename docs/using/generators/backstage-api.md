# backstage-api

Creates or edits a Backstage `API` entity in `catalog-info.yaml`. API entities
may share a catalog file with the component and with other API entities.

Run the generator from the component directory:

```bash
./nr-repository-composer.sh . backstage-api
```

Use the zero-based `--index` option to edit an existing API or add another one.
An index equal to the current API count creates a new API document.

```bash
./nr-repository-composer.sh . backstage-api --index 1
```

## Fields

| Prompt | Descriptor field | Required |
| --- | --- | --- |
| API name | `metadata.name` | Yes |
| Description | `metadata.description` | No |
| Definition type | `spec.type` | Yes |
| Lifecycle | `spec.lifecycle` | Yes |
| Owner | `spec.owner` | Yes |
| System | `spec.system` | No |
| Definition | `spec.definition` | Yes |

The API type accepts values such as `openapi`, `asyncapi`, `graphql`, and
`grpc`. Lifecycle options are `experimental`, `production`, and `deprecated`.
For the API definition, enter YAML/JSON text or a path to a definition file in
the repository. When a file path is provided, its contents are stored in the
descriptor.

## Example

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: artist-api
  description: Retrieve artist details
spec:
  type: openapi
  lifecycle: production
  owner: artist-relations-team
  system: artist-engagement-portal
  definition: |
    openapi: "3.0.0"
    info:
      version: 1.0.0
      title: Artist API
    paths:
      /artists:
        get:
          summary: List all artists
```

## Generator source

[bcgov/nr-repository-composer/tree/main/src/backstage-api](https://github.com/bcgov/nr-repository-composer/tree/main/src/backstage-api)
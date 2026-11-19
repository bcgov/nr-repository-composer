# backstage-system

Creates or edits a Backstage `System` entity in `catalog-info.yaml`. A System
groups related components and APIs. It can share the catalog file with other
entity kinds; existing entities and manually maintained fields are preserved.
One System per catalog file is supported.

## Usage

Run from the directory where the System's catalog should live (typically the
repository root):

````bash
./nr-repository-composer.sh . backstage-system
````

Rerunning reuses the existing System. Use `--ask-answered` to edit stored values.
`--headless --force` requires an existing System with its required values set.
Composer bookkeeping is stored separately in `catalog-composer.yaml`.

## Fields

| Prompt | Descriptor field | Required |
| --- | --- | --- |
| System name | `metadata.name` | Yes |
| Description | `metadata.description` | No |
| System type | `spec.type` | No |
| Owner | `spec.owner` | Yes |
| Domain | `spec.domain` | No |
| Tags | `metadata.tags` | No |

Names start with a lowercase letter and may contain lowercase letters, numbers,
underscores, and hyphens. The owner and optional domain are Backstage entity
references. The system type defaults to `product` and tags are a
comma-separated list (stored as a YAML sequence). Blank optional values are
omitted.

## Defaulting Component and API systems

The `backstage` **Project** and `backstage-api` **System** prompts use the first
named System found by the shared repository catalog scan as their default for
`spec.system`. The scan starts at the root `catalog-info.yaml` and follows
Location targets. Stored answers are not overwritten.

## Example

````yaml
apiVersion: backstage.io/v1alpha1
kind: System
metadata:
  name: artist-engagement-portal
  description: Services for engaging with artists
  tags:
    - product
spec:
  type: product
  owner: artist-relations-team
  domain: artists
````

## Generator source

[bcgov/nr-repository-composer/tree/main/src/backstage-system](https://github.com/bcgov/nr-repository-composer/tree/main/src/backstage-system)

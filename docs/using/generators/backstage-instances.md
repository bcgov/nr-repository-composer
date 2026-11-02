# backstage-instances

This adds one or more entries to the Component's standard `metadata.links`
array in `./catalog-info.yaml`. Each link records one deployed instance of the
service: a fixed `type` of `instance`, the environment in a custom `env` field, an
optional display name as `title`, and a required `url`.

Run the [`backstage`](backstage.md) generator first. This generator edits only
links whose `type` is `instance`; other catalog links are preserved and untouched.

## Usage

```bash
# Add or edit the first instance, then optionally continue to the next one
./nr-repository-composer.sh . backstage-instances

# Re-edit the stored values of the second instance (index is zero-based)
./nr-repository-composer.sh . backstage-instances --index 1 --ask-answered
```

The generator starts at the instance given by `--index` (default `0`). If that
instance does not exist yet, a new one is created. Once its prompts are
answered, you are asked whether to continue to the next instance, which is
edited if it exists or added if it does not.

An instance that is already set up is skipped without prompting, including the
offer to continue; pass `--ask-answered` to re-edit it, or `--index` to go
straight to another instance. In `--headless` mode only the instance at
`--index` is processed.

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Environment** | Required. One of `tools`, `development`, `test` or `production` (default); custom environments are not supported. Written to `metadata.links[].env` on an entry whose `type` is `instance`. |
| **Title** | Optional. Distinguishes multiple instances in one environment (for example `blue`). Defaults to the environment. Each environment and title pair must be unique. Written to `metadata.links[].title`. |
| **URL** | Required absolute URL for the instance. Written to `metadata.links[].url`. |

## Example

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: artist-web
  links:
    - type: instance
      env: production
      title: production
      url: https://artist.example.gov.bc.ca
    - type: instance
      env: production
      title: blue
      url: https://blue.artist.example.gov.bc.ca
spec:
  type: website
```

## Migrating existing instances

Instances used to be stored as JSON in the component's
`playbook.io.nrs.gov.bc.ca/instances` annotation. When that annotation is read,
it is removed and converted to `metadata.links` entries of the current form
(`type: instance` with a custom `env` field). Legacy entries without a URL are
retained; add a valid URL by rerunning this generator. The `backstage-instances`
generator is recorded in the component's generator list.

## Generator source

[bcgov/nr-repository-composer/tree/main/src/backstage-instances](https://github.com/bcgov/nr-repository-composer/tree/main/src/backstage-instances)

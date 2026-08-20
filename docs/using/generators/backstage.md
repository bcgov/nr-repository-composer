# backstage

This builds a [Backstage component entity](https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-component)
and outputs it to the file `./catalog-info.yaml`. A Backstage component entity is
equivalent to an NR Broker service. Automation and software catalogs will read
this file to understand your component.

Single-component (service) repositories should run this generator at the root of
the repository. If you have a monorepo (multiple components in a single
repository), you should run the `backstage-location` generator at the root
instead. This generator is then run in the individual directories for each
component.

The generator will prompt you for various information about your component
(service). Other generators will read from the catalog file and may store
additional information in this file.

For each component entity, developers should manually define the relationships
`subcomponentOf`, `consumesApis`, and `dependsOn`. The relationship
`subcomponentOf` is used to determine build dependencies.

| Field | What it expresses / semantics | Use cases / when to use it | What it does *not* do |
| --- | --- | --- | --- |
| **`spec.subcomponentOf`** | States that a component is part of a larger component. | Use when your software architecture has components that are "parts" of other components. For example: a mobile app component might have subcomponents (UI framework, plugin modules, etc.), or a larger system composed of many smaller deployable pieces where you want to reflect that part-of hierarchy. It helps with determining build order, visualization, and understanding boundaries. | It does *not* imply API dependency, or runtime dependency necessarily. It's about composition or structure ("this is part of that") rather than "using", "invoking", or "depending on". |
| **`spec.consumesApis`** | States that a component uses (calls) one or more APIs. | When your component needs to call external APIs (internal or third-party) and you want to document that dependency: e.g. "this service consumes the User API", "this frontend calls the Payments API". Good for tracking API dependencies, understanding coupling, impact analysis. If an API changes, you can trace what components will be impacted. | It does *not* capture all dependencies (for instance low-level infrastructure or resources) and doesn't imply subcomponent relationship. Also doesn't capture "resource" dependencies like databases, storage, etc.—those are better done via `dependsOn`. Also, it's not about "part of" structure but about "uses / invokes". |
| **`spec.dependsOn`** | States that a component (or resource) depends on other components or resources. | Use when your component needs something else to operate, but that thing is *not* necessarily an API: e.g. a database, a message queue, another service, infrastructural resource, or even another component for build-time or runtime dependency. It covers both resource kind entities and component kind entities. | It's less specific: doesn't distinguish *how* the dependency is used ("via API", "via sharing library", etc.). And doesn't imply "is part of". Also, if an API dependency is relevant, using `consumesApis` gives semantics that are more specific / meaningful in API-centric views. |

**Suggested Next Steps:**

- [`gh-common-mono-build`](gh-common-mono-build.md), [`gh-maven-build`](gh-maven-build.md), [`gh-nodejs-build`](gh-nodejs-build.md) — Set up build pipeline
- [`gh-docs-deploy`](gh-docs-deploy.md) — Set up GitHub Pages documentation deployment
- [`migrations`](migrations.md) — Set up database migration files

## Example website with a dependent library component

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: artist-web
  description: The place to be, for great artists
spec:
  type: website
  lifecycle: production
  owner: artist-relations-team
  consumesApis:
    - component:artist-api
  dependsOn:
    - resource:artists-db
```

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: artist-common
  description: Common library for artist portal
spec:
  type: library
  lifecycle: production
  owner: artist-relations-team
  subcomponentOf:
    - component:artist-web
```

# YAML Path Mappings

The `pathToProps` array in `src/util/yaml.ts` controls how prompt answers map to
`catalog-info.yaml`. Each entry describes where a prompt value is written and how
it is transformed.

## Where answers are stored

- A prompt mapped to an entity path (any path except a
  `metadata.annotations.*nrs.gov.bc.ca/*` annotation) is written to the entity
  document and read back from it. It is not kept in the NRComposer answers.
- Every other prompt answer, such as values used only for templating, is stored
  in the flat `spec.answers` map of the single `NRComposer` document.
  Prompts mapped to `*nrs.gov.bc.ca/*` annotations are stored there too.
- The `NRComposer` document lives in its own `catalog-composer.yaml`, beside
  `catalog-info.yaml`. Both files are loaded. If `catalog-composer.yaml` has one, it is used
  as is and any `NRComposer` in `catalog-info.yaml` is ignored (not merged) and
  dropped on save. One found only in `catalog-info.yaml` is used. Saving always splits the files, so
  `NRComposer` never remains in `catalog-info.yaml`.
  `catalog-info.yaml` is always written, even when empty, as a placeholder.

Answers duplicating a value already on an entity document are removed from
`spec.answers` when the catalog is loaded.

## The `PathToProp` shape

```ts
interface PathToProp {
  path: string[];
  prop: string;
  writeEmpty: boolean;
  csv?: boolean;
  transform?: (val: any) => any;
  deprecated?: (config: any, value?: any) => void;
}
```

| Field | Meaning |
| --- | --- |
| `path` | The YAML path to write to, as an array of keys. |
| `prop` | The prompt answer property to read from. |
| `writeEmpty` | Whether to write the value when it is empty. |
| `csv` | When `true`, split a comma-separated value into an array (and join on write). |
| `transform` | An optional function to transform the value before writing. |
| `deprecated` | An optional function invoked when a deprecated value is encountered. |

## Standard Backstage fields

- `spec.*` — component specification fields
- `metadata.name` — the service or location name
- `metadata.description` — the component description

## Annotations

Custom data is stored under `metadata.annotations.*`. For example:

```ts
{
  path: ['metadata', 'annotations', 'github.com/project-slug'],
  prop: 'gitHubProjectSlug',
  writeEmpty: false,
},
```

## CSV fields

Set `csv: true` to automatically split and join comma-separated values into an
array. For example, `spec.targets` and `metadata.tags`:

```ts
{
  path: ['spec', 'targets'],
  prop: 'locationTargets',
  writeEmpty: true,
  csv: true,
},
```

## Transforms

Add a `transform` function for custom value processing:

```ts
{
  path: ['spec', 'type'],
  prop: 'type',
  writeEmpty: false,
  transform: (val) => val.toLowerCase(),
},
```

## Adding a mapping

1. Add the prompt in `src/util/prompts.ts` (see
   [Adding a New Prompt](adding-a-prompt.md)).
2. Add an entry to `pathToProps` in `src/util/yaml.ts`.
3. Rebuild and verify the value appears in `catalog-info.yaml`:

```bash
npm run build
npx yo nr-repository-composer:backstage --ask-answered
```

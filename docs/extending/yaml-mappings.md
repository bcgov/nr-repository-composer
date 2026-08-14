# YAML Path Mappings

The `pathToProps` array in `src/util/yaml.ts` controls how prompt answers map to
`catalog-info.yaml`. Each entry describes where a prompt value is written and how
it is transformed.

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

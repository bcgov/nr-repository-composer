# migrations

This assists in creating a standard layout of folders and files related to
database migrations. This is a catch-all generator that supports manual and
automated processes that incrementally alter your database.

The generator writes a `migrations/` directory containing a `README.md` with
procedural guidance and a `util/setenv-prod.sh` environment script.

## Usage

```bash
./nr-repository-composer.sh . migrations
```

Run at the root directory of your component (service), which should contain the
`catalog-info.yaml` for it.

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Schema(s)** | Schema name(s) to manage; written into the generated migration guidance. |
| **Tool** | Migration tooling: `manual`, `flyway` (default), or `liquibase`. |
| **Type** | Database type (`oracle`, `mongodb`, `postgres`, etc.). |
| **Base path** | Base path for the generated migration files. |

## Generator source

[bcgov/nr-repository-composer/tree/main/src/migrations](https://github.com/bcgov/nr-repository-composer/tree/main/src/migrations)

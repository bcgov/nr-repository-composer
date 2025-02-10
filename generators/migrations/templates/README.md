# Database Migrations

This folder is for storing your database migrations. Teams are encouraged to store their schema migrations in the same repository as any primary application.

***This file is auto-generated. Please create PR in composer for any changes.***

### General guidelines

Migration scripts are required to follow these guidelines as well as any tool specific guidelines.

* Never include personal identifiable information
* Must be able to be rerun safely backwards and forwards(idempotent)
* Changes should be backward-compatible

<% if (schemaMigrationTool == 'manual') { -%>
## Manual Migrations

Guidelines to be created.
<% } -%>
<% if (schemaMigrationTool == 'liquibase') { -%>
## Liquibase Migrations

Guidelines to be created.
<% } -%>
<% if (schemaMigrationTool == 'flyway') { -%>
## Flyway Migrations

Guidelines to be created.
<% } -%>

## Running your migration

Teams are encouraged to run the migration automatically as part of application startup.

# Database Development

See: [NRM Data and Database Development Guidelines](https://apps.nrs.gov.bc.ca/int/confluence/x/vQbxAQ)
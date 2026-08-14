# Assumptions & Concepts

This page collects the assumptions the generators make and the core concepts
behind the composer.

## Running a generator

The generators assume they are running inside a Git repository. They will search
the current working directory and up the file system for the `.git` folder. All
generators are designed to be rerun without re-asking prompts unless necessary.
All information entered is stored in a Backstage catalog file.

## Standard file names and locations

The generators all assume that the root of a service (and the repository) will
have a Backstage file named `catalog-info.yaml`.

## Services and Components

NR Broker and Backstage use the terms "service" and "component" for essentially
the same concept, respectively.

**NR Broker description:**

> A service is a software component that runs in an environment.

**Backstage description:**

> A Component describes a software component. It is typically intimately linked to
> the source code that constitutes the component, and should be what a developer
> may regard a "unit of software", usually with a distinct deployable or linkable
> artifact.

## OCI Artifacts

A container registry is used to store and fetch containers by software like
Podman. All container registries are based on a standard that allows them to
evolve to store generic artifacts. OCI Artifacts is a standard way to store those
generic artifacts. See: <https://oras.land/docs/concepts/artifact/>.

See [OCI Artifacts](oci-artifacts.md) for
how build outputs and static assets use OCI artifacts.

## Deployment Configuration

A deployment configuration is an OCI Artifact that bundles together the
deployment files. It is triggered by pushing a `d*` tag that uses semantic
versioning. See
[Deployment Configuration](oci-artifacts.md#deployment-configuration) for the
full details, including tag format and testing
guidance.

# Being on a Team in Broker

NR Broker is a tool for automating access to secrets by applications, actions, etc., and reporting activity (deployments, builds, etc.) across all platforms (on-prem, AWS, OpenShift, etc.). All use of the broker API is audited. When an intention (request to perform activities) is opened, the ability to perform those activities may be checked against business rules.

Having an account in Broker and being a member of an authorized team is a prerequisite for performing deployments.

For more information about managing teams in broker, and how to link your Broker account, see [Broker Walkthroughs](https://apps.nrs.gov.bc.ca/int/confluence/x/pS3FBw).


# Branch Model

In the beginning of a new project the team agrees on the project conventions including the branch naming strategy.

Here's an example of a branch naming convention:

```sh
<user alias>/[feature/bug/hotfix]/<work item ID>_<title>
```

Which could translate to something as follows:

```sh
fillwerrel/feature/271_more_cowbell
```

The example above is just that - an example. The team can choose to omit or add parts. Choosing a branch convention can depend on the development model (e.g. [trunk-based development](https://trunkbaseddevelopment.com/)), [versioning](component-versioning.md) model, tools used in managing source control, matter of taste etc. Focus on simplicity and reducing ambiguity; a good branch naming strategy allows the team to understand the purpose and ownership of each branch in the repository.

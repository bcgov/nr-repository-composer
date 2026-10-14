# Provision Knox Vault Credentials with NR Broker

This README is a runbook for developers installing and monitoring the
credential-provisioning CronJob in an OpenShift service. The
`ocp-knox-provision` generator creates the Helm values files and this README;
it does not install a Helm release.

The CronJob uses NR Broker to provision and periodically rotate the Vault
AppRole `secret_id`. The `role_id` identifies the preconfigured AppRole and is
supplied to the application alongside the provisioned `secret_id` so pods can
retrieve application secrets from Knox Vault at startup.

There are two separate synchronization workflows:

- **Tool-secret synchronization:** NR Broker can synchronize the Broker JWT and
  Vault AppRole role ID, along with other tool credentials, from Vault into
  Kubernetes or OpenShift Secrets. This can supply the credentials used by the
  provisioning CronJob.
- **Application-secret synchronization:** the Helm chart can optionally copy
  selected application secret paths from Vault into OpenShift Secrets after
  the AppRole `secret_id` has been provisioned. This is for applications that
  cannot be modified to authenticate to Vault directly, including COTS
  applications, or for teams using a simpler deployment while onboarding a
  service. It should generally be treated as a transitional compatibility
  option; direct Vault access is preferred when practical.

For the chart's complete configuration reference, see the [upstream
README](https://github.com/bcgov/nr-broker-credential-injection/blob/main/provision-secret/README.md).

## Before installation

Confirm that you have:

- Access to the service's OpenShift namespace
- Helm 3 installed and authenticated to the cluster
- NR Broker and Vault AppRole configuration for the service and environment
- A Broker user with the change role for the service and environment

Request an AppRole with a Secret ID TTL longer than the CronJob interval. The
default schedule is daily, so a TTL longer than 24 hours is required. Request a
Secret ID usage limit of `0` (unlimited), or a limit that supports the expected
number of pod starts.

## Configure the generated values

Review the files under `ocp-knox-provision/values/` before installing:

- `common.yaml` holds generated values shared across environments: the CronJob
  schedule (`cron.schedule`), the source and target secret names
  (`sourceSecret.name`, `targetSecret.name`), and the shared sync settings
  (`sync.enabled`, `sync.schedule`, `sync.sourceSecret`).
- `dev.yaml`, `test.yaml`, and `prod.yaml` hold only what differs per
  environment: the NR Broker intention values (service, project, environment,
  and Broker user) plus the sync `vaultPaths` and `secretNames` for that
  environment.

Because the per-environment files inherit `common.yaml`, set a value that is the
same in every environment in `common.yaml`, and set a value that differs by
environment in the matching `dev.yaml`, `test.yaml`, or `prod.yaml` file.

Confirm the service name, project, environment, and Broker user. The Broker user
must have the change role for the target service and environment. Add any
required network policy egress rules or other uncommon settings for the OpenShift
environment, as described in "Set unprompted values" below.

Create the source Secret named by `sourceSecret.name` in `common.yaml` in the
service namespace before installation. The default name is `knox-secret`; it
must contain the Broker JWT under `token` and the Vault AppRole `role_id`. Never
commit either value to source control or add them to a values file.

## Set unprompted values

The generator does not prompt for every chart option. Set unprompted values by
editing `common.yaml` for settings shared by environments, or the matching
environment file for values that differ. Prefer `global` defaults when the same
annotations, labels, resources, or pull secrets should apply to both the
provision CronJob and optional sync job; job-specific `cron.*` and `sync.job.*`
values can override those defaults. For example:

The generator leaves `global.name` unset. Add it to `common.yaml` manually if
you need to override the chart's default release name; the generator preserves
this unprompted value on subsequent runs.

The generator also leaves `image.tag` unset so the chart's default tag is used.
Add `image.tag` to `common.yaml` manually to pin a different image version; the
generator preserves this unprompted value on subsequent runs.

```yaml
global:
  podLabels:
    DataClass: Medium
  resources:
    requests:
      cpu: 100m
      memory: 128Mi

networkPolicy:
  create: true
  egress:
    - cidr: x.x.x.x/32
      ports:
        - protocol: TCP
          port: 443
    - podSelector:
        matchLabels:
          app: vault
```

Keep credentials out of values files. The Broker JWT and AppRole role ID belong
only in the OpenShift source Secret.

## How values are preserved across runs

Each run deep-merges generated values onto existing values files. Values that
the generator does not manage are retained, including manually added
`global.podLabels`, `global.resources`, and `networkPolicy` settings. Existing
values files are not replaced wholesale.

Values the generator manages are refreshed from the answers stored in the
component's `catalog-info.yaml`. This includes the release/image/schedule/secret
settings in `common.yaml` and the intention/sync paths in each environment file.
Changing a prompt answer updates its generated value on the next run; manually
editing a generator-managed key will be overwritten by that stored answer.

To remove a generated value, change or clear its prompt answer as appropriate.
To remove an unprompted value, delete it from the relevant values file; it will
stay removed unless you add it again.

## Install the CronJob

Add the chart repository once, then install the release for the target
environment:

```bash
helm repo add broker https://bcgov.github.io/nr-broker-credential-injection
helm repo update
cd ocp-knox-provision
helm install knox-provision broker/cronjob-deployment \
  -f values/common.yaml \
  -f values/dev.yaml
```

Use `values/test.yaml` or `values/prod.yaml` for the corresponding environment.
The release creates the CronJob and supporting Kubernetes resources in the
current namespace. The generated files only provide the configuration; Helm
performs the installation.
If you changed `global.name` in `common.yaml`, use that name instead of
`knox-provision` in the install and monitoring commands.

Configure the application deployment to read the target Secret named by
`targetSecret.name` in `common.yaml` (default `knox-secret`) and use its
`role_id` and `secret_id` to authenticate to Vault at pod startup.

## Monitor the operation

After installation, confirm that the CronJob exists and that its first Job
completes:

```bash
oc get cronjob knox-provision
oc get jobs --sort-by=.metadata.creationTimestamp
oc get secret knox-secret
```

Inspect the Job and pod logs when a run fails:

```bash
oc describe cronjob knox-provision
oc get pods --sort-by=.metadata.creationTimestamp
oc logs job/<job-name>
```

Check that the target Secret named by `targetSecret.name` contains a current
`secret_id` and that the application can start and retrieve its Vault secrets.
Continue monitoring Job completion and credential freshness after deployment;
the CronJob's purpose is to rotate the credentials before they expire.

For failures, check the source Secret, Broker user permissions, AppRole TTL and
usage limit, login CIDR, and network access to Broker and Vault.

## Broker JWT Renewal

NR Broker will send out emails when it is time to renew your JWT. If you setup
tool-secret synchronization, all that is required is clicking generate in NR Broker.
Otherwise, a developer will need to copy the generated token to each OpenShift project.

## Tool-secret synchronization

If the Broker JWT or AppRole role ID is managed as a tool secret in Vault, NR
Broker can synchronize it into Kubernetes or OpenShift Secrets for the
provisioning CronJob to use. This is separate from the chart's optional
application-secret synchronization. See the [NR Broker Kubernetes sync
documentation](https://bcgov.github.io/nr-broker/#/operations_kubernetes_sync)
for configuration details.

The tool-secret synchronization does not permit the target OpenShift secret to have extra values.
Therefore, `sync.sourceSecret.name` and `sync.targetSecret.name` must be different values.
Otherwise, the tool-secret synchronization will remove the provisioned `secret_id`.

## Optional application-secret synchronization

The chart can copy selected Vault application secret paths into OpenShift
Secrets. Use this when an application cannot be changed to log in to Vault with
AppRole credentials, such as a COTS application, or as an onboarding step before
direct Vault integration is available.

The per-environment `dev.yaml`, `test.yaml`, and `prod.yaml` files carry the
environment-specific `sync.vaultPaths` and `sync.secretNames` (the vault paths
are derived per environment). The shared sync settings live in `common.yaml`:
`sync.enabled`, `sync.schedule` (empty by default, which creates a one-time Job
instead of a CronJob), and the optional `sync.sourceSecret` login (which defaults
to the target secret when omitted). Set matching `vaultPaths` and `secretNames`
and, when running on a schedule, a `sync.schedule` later than the provision
CronJob (for example `0 3 * * *` after the default `0 2 * * *`). Treat this as a
compatibility or transitional option when possible. Applications that can use a
Vault client or sidecar should retrieve secrets directly so that secrets do not
need to be copied into OpenShift.

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

Review the files under `cronjob-deployment/values/` before installing:

- `common.yaml` contains values shared by environments.
- `dev.yaml`, `test.yaml`, and `prod.yaml` contain environment-specific NR
  Broker intention values.

Confirm the service name, project, environment, and Broker user. The Broker user
must have the change role for the target service and environment. Add any
required network policy egress rules for the OpenShift environment.

Create the source Secret in the service namespace before installation. The
default name is `knox-secret`; it must contain the Broker JWT under `token` and
may contain the Vault AppRole `role_id`. Never commit either value to source
control or add them to a values file.

## Install the CronJob

Add the chart repository once, then install the release for the target
environment:

```bash
helm repo add broker https://bcgov.github.io/nr-broker-credential-injection
helm repo update
cd cronjob-deployment
helm install knox-provision broker/cronjob-deployment \
  -f values/common.yaml \
  -f values/dev.yaml
```

Use `values/test.yaml` or `values/prod.yaml` for the corresponding environment.
The release creates the CronJob and supporting Kubernetes resources in the
current namespace. The generated files only provide the configuration; Helm
performs the installation.

Configure the application deployment to read the target Secret, normally
`knox-secret`, and use its `role_id` and `secret_id` to authenticate to Vault at
pod startup.

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

Check that the target Secret contains a current `secret_id` and that the
application can start and retrieve its Vault secrets. Continue monitoring Job
completion and credential freshness after deployment; the CronJob's purpose is
to rotate the credentials before they expire.

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

Configure the chart's `sync` values with matching comma-separated `vaultPaths`
and `secretNames`. Treat this as a compatibility or transitional option when
possible. Applications that can use a Vault client or sidecar should retrieve
secrets directly so that secrets do not need to be copied into OpenShift.

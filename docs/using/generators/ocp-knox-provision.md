# ocp-knox-provision

This generator sets up application access to Knox Vault in an OpenShift project.
It generates the configuration for a Helm-based CronJob that uses NR Broker to
provision and rotate the Vault AppRole `secret_id`. Pods can then use the
preconfigured AppRole `role_id` and the provisioned `secret_id` to retrieve
application secrets from Vault at startup.

Tool-secret synchronization is a separate setup. It uses NR Broker's optional
[Kubernetes sync feature](https://bcgov.github.io/nr-broker/#/operations_kubernetes_sync)
to copy tool secrets such as the Broker JWT and AppRole role ID from Vault into
Kubernetes or OpenShift Secrets. It is not part of this generator's application
access setup.

The generated files appear in the `cronjob-deployment/` directory, including
environment-specific Helm values and a README with installation and monitoring
guidance.

This generator should be run at the root directory of your component (service),
which should contain the `catalog-info.yaml` for it.

After running the generator, see the generated
[`cronjob-deployment/README.md`](https://github.com/bcgov/nr-broker-credential-injection/blob/main/provision-secret/README.md)
for the provisioning pattern and installation details.

**Suggested Next Steps:**

- [`gh-nodejs-build`](gh-nodejs-build.md) or [`gh-maven-build`](gh-maven-build.md)
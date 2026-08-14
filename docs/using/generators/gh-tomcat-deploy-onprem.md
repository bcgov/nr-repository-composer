# gh-tomcat-deploy-onprem

> :warning: **Warning!** `gh-tomcat-deploy` is superseded by
> [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md).
>
> `gh-tomcat-deploy` is only compatible with versions of the
> [nr-repository-composer](https://github.com/bcgov/nr-repository-composer) ≤ v4.2.0.

This generates the deploy workflow and NR Broker intention files for deploying
Java/Tomcat applications to on-premises infrastructure via GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This
generator also invokes the `pd-java-playbook` generator to create the Ansible
playbook configuration.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it. Run the `gh-maven-build`
generator first to set up the build workflow.

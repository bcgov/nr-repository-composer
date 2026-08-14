# gh-docs-deploy

This generates a GitHub Actions workflow for deploying static documentation to
GitHub Pages. The workflow automatically deploys content from the `docs/` folder
in your repository whenever changes are pushed to the main branch.

The generated workflow file appears at `.github/workflows/docs-deploy.yaml`.

**Setup:**

- Enable GitHub Pages in your repository settings
- Set the Pages source to "GitHub Actions" in repository Settings > Pages
- Create a `docs/` folder with your static documentation content

If the repository has multiple components, pick one in which to run the
generator. This workflow only uploads documentation from a single docs folder in
the repository.

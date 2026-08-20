<!-- README.md.tpl:START -->

## Working With the Polaris Pipeline

This repository uses the Polaris Pipeline to build and deploy.

<% if (isMonorepo) { -%>
Services in this repository:
<% services.forEach(service => { -%>
- [<%= service.name %>](<%= service.path.replace(/\/catalog-info\.yaml$/, '') %>)<% if (service.hasMaven) { %> - Maven build<% } %>
<% }); -%>
<% } -%>

### Management on Packages
The Polaris Pipeline also generates jobs to manage unnecessary packages during developments period:
- Delete PR package when PR merged
- Only keep top {number} non-release packages

Refer to [nr-polaris-docs](https://bcgov.github.io/nr-polaris-docs/#/) for more information about how to use the Polaris Pipeline.

## Resources

[NRM Architecture Confluence: GitHub Repository Best Practices](https://apps.nrs.gov.bc.ca/int/confluence/x/TZ_9CQ)
<!-- README.md.tpl:END -->

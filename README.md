# NR Repository Composer

[View Documentation](https://bcgov.github.io/nr-repository-composer/#/)

The NR Repository Composer populates repositories with files for building, deploying, and cataloging applications. Developers use its generators to both initially set up and then maintain their repository. Its primary purpose is to scaffold NRIDS applications.

Developers wanting to add new generators or make changes to existing ones should clone this repository and run the tool using Node.js. The composer uses [catalog entities](https://backstage.io/docs/features/software-catalog/descriptor-format) from [Backstage Software Catalog](https://backstage.io/docs/features/software-catalog/) to catalog the repository based on prompts given when running a generator. The composer is built using [Yeoman](http://yeoman.io).

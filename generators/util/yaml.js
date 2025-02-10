export const BACKSTAGE_FILENAME = 'catalog-info.yaml';
export const BACKSTAGE_GENERATOR_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/generators',
];

export const pathToProps = [
  { path: ['spec', 'system'], prop: 'projectName' },
  { path: ['metadata', 'name'], prop: 'serviceName' },
  { path: ['metadata', 'description'], prop: 'description' },
  { path: ['metadata', 'title'], prop: 'title' },
  { path: ['spec', 'type'], prop: 'type' },
  { path: ['spec', 'lifecycle'], prop: 'lifecycle' },
  { path: ['spec', 'owner'], prop: 'owner' },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/pomRoot'],
    prop: 'pomRoot',
  },
  // License
  {
    path: ['metadata', 'annotations', 'license'],
    prop: 'license',
  },
  // Github
  {
    path: ['metadata', 'annotations', 'github.com/project-slug'],
    prop: 'githubProjectSlug',
  },
  // Playbook
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/unitTestsPath',
    ],
    prop: 'unitTestsPath',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/gitHubPackages',
    ],
    prop: 'gitHubPackages',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/gitHubOwnerPack',
    ],
    prop: 'gitHubOwnerPack',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryProject',
    ],
    prop: 'artifactoryProject',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryPackageType',
    ],
    prop: 'artifactoryPackageType',
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployOnPrem'],
    prop: 'deployOnPrem',
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/playbookPath'],
    prop: 'playbookPath',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/tomcatContext',
    ],
    prop: 'tomcatContext',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/useAltAppDirName',
    ],
    prop: 'useAltAppDirName',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/altAppDirName',
    ],
    prop: 'altAppDirName',
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/addWebadeConfig',
    ],
    prop: 'addWebadeConfig',
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/clientId'],
    prop: 'clientId',
  },
  // Migrations
  {
    path: ['metadata', 'annotations', 'migration.io.nrs.gov.bc.ca/schemaName'],
    prop: 'schemaName',
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationTool',
    ],
    prop: 'schemaMigrationTool',
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationType',
    ],
    prop: 'schemaMigrationType',
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationBasePath',
    ],
    prop: 'schemaMigrationBasePath',
  },
];

export function extractFromYaml(doc, pathToProps) {
  const answers = {};

  if (doc) {
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      if (doc.hasIn(path)) {
        answers[pathToProp.prop] = doc.getIn(path);
      }
    }
  }

  return answers;
}

export function addGeneratorToDoc(doc, generator) {
  if (doc.hasIn(BACKSTAGE_GENERATOR_PATH)) {
    const generators = doc.getIn(BACKSTAGE_GENERATOR_PATH).split(',');
    console.log(generators);
    console.log(generators.indexOf(generator));
    if (generators.indexOf(generator) === -1) {
      generators.push(generator);
      doc.setIn(BACKSTAGE_GENERATOR_PATH, generators.join(','));
    }
  } else {
    doc.setIn(BACKSTAGE_GENERATOR_PATH, generator);
  }
}

export function generateSetAnswerPropPredicate(answers, skip) {
  return (val) => {
    return answers[val.name] === undefined || (answers[val.name] && skip);
  };
}

export function generateSetDefaultFromDoc(answers) {
  return (val) => {
    return {
      ...val,
      ...(answers[val.name] ? { default: answers[val.name] } : {}),
    };
  };
}

export function writePropToPath(doc, pathToProps, answers) {
  for (const pathToProp of pathToProps) {
    const path = pathToProp.path;
    if (answers[pathToProp.prop] !== undefined) {
      doc.setIn(path, answers[pathToProp.prop]);
    } else {
      doc.setIn(path, '');
    }
  }
}

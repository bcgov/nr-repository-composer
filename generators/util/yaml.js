export const BACKSTAGE_FILENAME = 'catalog-info.yaml';
export const BACKSTAGE_GENERATOR_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/generators',
];

export const pathToProps = [
  { path: ['spec', 'system'], prop: 'projectName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'serviceName', writeEmpty: false },
  { path: ['metadata', 'description'], prop: 'description', writeEmpty: true },
  { path: ['metadata', 'title'], prop: 'title', writeEmpty: false },
  { path: ['spec', 'type'], prop: 'type', writeEmpty: false },
  { path: ['spec', 'lifecycle'], prop: 'lifecycle', writeEmpty: false },
  { path: ['spec', 'owner'], prop: 'owner', writeEmpty: true },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/pomRoot'],
    prop: 'pomRoot',
    writeEmpty: false,
  },
  // License
  {
    path: ['metadata', 'annotations', 'license'],
    prop: 'license',
    writeEmpty: false,
  },
  // Github
  {
    path: ['metadata', 'annotations', 'github.com/project-slug'],
    prop: 'githubProjectSlug',
    writeEmpty: false,
  },
  // Playbook
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/unitTestsPath',
    ],
    prop: 'unitTestsPath',
    writeEmpty: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/gitHubPackages',
    ],
    prop: 'gitHubPackages',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/gitHubOwnerPack',
    ],
    prop: 'gitHubOwnerPack',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryProject',
    ],
    prop: 'artifactoryProject',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryPackageType',
    ],
    prop: 'artifactoryPackageType',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployOnPrem'],
    prop: 'deployOnPrem',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployJasperReports'],
    prop: 'deployJasperReports',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/jasperServerInstance'],
    prop: 'jasperServerInstance',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/jasperReportsProject'],
    prop: 'jasperReportsProject',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/playbookPath'],
    prop: 'playbookPath',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/tomcatContext',
    ],
    prop: 'tomcatContext',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/useAltAppDirName',
    ],
    prop: 'useAltAppDirName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/altAppDirName',
    ],
    prop: 'altAppDirName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/addWebadeConfig',
    ],
    prop: 'addWebadeConfig',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/clientId'],
    prop: 'clientId',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/publishArtifactSuffix',
    ],
    prop: 'publishArtifactSuffix',
    writeEmpty: true,
  },
  // Migrations
  {
    path: ['metadata', 'annotations', 'migration.io.nrs.gov.bc.ca/schemaName'],
    prop: 'schemaName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationTool',
    ],
    prop: 'schemaMigrationTool',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationType',
    ],
    prop: 'schemaMigrationType',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationBasePath',
    ],
    prop: 'schemaMigrationBasePath',
    writeEmpty: true,
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
    // console.log(generators);
    // console.log(generators.indexOf(generator));
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
    if (
      answers[pathToProp.prop] !== undefined &&
      (pathToProp.writeEmpty || answers[pathToProp.prop] !== '')
    ) {
      doc.setIn(path, answers[pathToProp.prop]);
    }
  }
}

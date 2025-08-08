export const BACKSTAGE_FILENAME = 'catalog-info.yaml';
export const BACKSTAGE_API_VERSION = 'backstage.io/v1alpha1';
export const BACKSTAGE_KIND_COMPONENT = 'Component';
export const BACKSTAGE_KIND_LOCATION = 'Location';

export const BACKSTAGE_GENERATOR_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/generators',
];

export const pathToProps = [
  { path: ['spec', 'system'], prop: 'projectName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'serviceName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'locationName', writeEmpty: false },
  { path: ['metadata', 'description'], prop: 'description', writeEmpty: true },
  { path: ['metadata', 'title'], prop: 'title', writeEmpty: false },
  {
    path: ['spec', 'targets'],
    prop: 'locationTargets',
    writeEmpty: true,
    csv: true,
  },
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
  // Maven
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/configureNrArtifactory',
    ],
    prop: 'configureNrArtifactory',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/mavenSettingsRoot',
    ],
    prop: 'mavenSettingsRoot',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/mavenBuildCommand',
    ],
    prop: 'mavenBuildCommand',
    writeEmpty: false,
  },
  // Jasper
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/deployJasperReports',
    ],
    prop: 'deployJasperReports',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperProjectName',
    ],
    prop: 'jasperProjectName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperServiceName',
    ],
    prop: 'jasperServiceName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperSourcePath',
    ],
    prop: 'jasperSourcePath',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperServerInstance',
    ],
    prop: 'jasperServerInstance',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperPauseSeconds',
    ],
    prop: 'jasperPauseSeconds',
    writeEmpty: false,
    transform: (val) => (val === '' || val === undefined ? val : Number(val)),
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

export const propRecord = pathToProps.reduce((acc, pathToProp) => {
  acc[pathToProp.prop] = pathToProp;
  return acc;
}, {});

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

export function generateSetAnswerPropPredicate(answers, keepAnswered) {
  return (val) => {
    return !(val.name in answers) || keepAnswered;
  };
}

// export function generateSetDefaultFromDoc(answers) {
//   return (val) => {
//     return {
//       ...val,
//       ...(answers[val.name] ? { default: answers[val.name] } : {}),
//     };
//   };
// }

// export function writePropToPath(doc, pathToProps, answers) {
//   for (const pathToProp of pathToProps) {
//     const path = pathToProp.path;
//     const answer = answers[pathToProp.prop];
//     console.log(answer);
//     if (answer !== undefined && (pathToProp.writeEmpty || answer !== '')) {
//       console.log(pathToProp.csv);
//       doc.setIn(path, pathToProp.csv ? answer.split(',') : answer);
//     }
//   }
// }

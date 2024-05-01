export const BACKSTAGE_FILENAME = 'app-config.yaml';

export const pathToProps = [
  { path: 'spec.system', prop: 'projectName' },
  { path: 'metadata.name', prop: 'serviceName' },
  { path: 'metadata.description', prop: 'description' },
  { path: 'metadata.title', prop: 'title' },
  { path: 'spec.type', prop: 'type' },
  { path: 'spec.lifecycle', prop: 'lifecycle' },
  { path: 'spec.owner', prop: 'owner' },
];

export function extractFromYaml(doc, pathToProps) {
  const answers = {};

  if (doc) {
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path.split('.');
      if (doc.hasIn(path)) {
        answers[pathToProp.prop] = doc.getIn(path);
      }
    }
  }

  return answers;
}

export function generateSetAnswerPropPredicate(answers, skip) {
  return (val) => {
    return !answers[val.name] || (answers[val.name] && skip);
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
    const path = pathToProp.path.split('.');
    if (answers[pathToProp.prop]) {
      doc.setIn(path, answers[pathToProp.prop]);
    }
  }
}

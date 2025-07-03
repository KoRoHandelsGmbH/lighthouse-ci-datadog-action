import * as core from '@actions/core';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { submitdMetrics } from './lighthouse';
import { LHRJSONSchema, type LHRJSONSchemaType } from './schema';

async function retrieveData():Promise<(LHRJSONSchemaType | null)[]> {
  const jsons = await glob('./../../.lighthouseci/lhr*.json');
  core.warning(`lighthouse results path ${jsons.join(', ')}`);

  return jsons.map((json) => {
    let data = null;
    try {
      core.warning(`lighthouse raw response ${readFileSync(json).toString()}`);
      data = LHRJSONSchema.parse(readFileSync(json).toString());
    } catch {
      core.warning(`lighthouse response JSON different than expected: ${json}`);
    }
    return data;
  });
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  // https://github.com/DataDog/integrations-extras/blob/master/lighthouse/datadog_checks/lighthouse/lighthouse.py
  try {
    const apiKey: string = core.getInput('dd-api-key');
    const appKey: string = core.getInput('dd-app-key');
    const data = await retrieveData();
    await Promise.all(data.map(async (metrics) => (
      metrics
        ? submitdMetrics({ data: metrics, tags: [], apiKey, appKey })
        : null
    )));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

export default run;

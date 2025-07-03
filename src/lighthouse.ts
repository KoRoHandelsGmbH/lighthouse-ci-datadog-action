import * as core from '@actions/core';
import { client, v2 } from '@datadog/datadog-api-client';
import { nonNullable } from './utils';
import type { LHRJSONSchemaType } from './schema';

const METRIC_TYPE:Readonly<3> = 3;
const EXPECTED_RESPONSE_CODE = 'NO_ERROR';

function getNumericAuditValue(data:LHRJSONSchemaType, attribute:keyof LHRJSONSchemaType['audits']):number | null {
  const code = data?.runtimeError?.code;
  if (code === EXPECTED_RESPONSE_CODE) {
    const errCode = data?.runtimeError?.code;
    const errMsg = data?.runtimeError?.message;
    core.warning(
      `not collecting lighthouse metrics runtimeError code ${errCode} message ${errMsg}`,
    );
    return null;
  }
  return data?.audits?.[attribute]?.numericValue || null;
}

export function generateSeries(data:LHRJSONSchemaType, tags?:string[]):v2.MetricSeries[] {
  const scoreAccessibility = Math.round((data.categories?.accessibility?.score || 0) * 100);
  const scoreBestPractices = Math.round((data.categories?.['best-practices']?.score || 0) * 100);
  const scorePerformance = Math.round((data.categories?.performance?.score || 0) * 100);
  const scorePwa = Math.round((data.categories?.pwa?.score || 0) * 100);
  const scoreSeo = Math.round((data.categories?.seo?.score || 0) * 100);
  const largestContentfulPaint = getNumericAuditValue(data, 'largest-contentful-paint');
  const firstContentfulPaint = getNumericAuditValue(data, 'first-contentful-paint');
  const cumulativeLayoutShift = getNumericAuditValue(data, 'cumulative-layout-shift');
  const maxPotentialFid = getNumericAuditValue(data, 'max-potential-fid');
  const timeToInteractive = getNumericAuditValue(data, 'interactive');
  const mainthreadWorkBreakdown = getNumericAuditValue(data, 'mainthread-work-breakdown');
  const unusedJavascript = getNumericAuditValue(data, 'unused-javascript');
  const unusedCssRules = getNumericAuditValue(data, 'unused-css-rules');
  const modernImageFormats = getNumericAuditValue(data, 'modern-image-formats');
  const usesOptimizedImages = getNumericAuditValue(data, 'uses-optimized-images');
  const renderBlockingResources = getNumericAuditValue(data, 'render-blocking-resources');
  const bootupTime = getNumericAuditValue(data, 'bootup-time');
  const serverResponseTime = getNumericAuditValue(data, 'server-response-time');
  const speedIndex = getNumericAuditValue(data, 'speed-index');
  const domSize = getNumericAuditValue(data, 'dom-size');
  const totalBlockingTime = getNumericAuditValue(data, 'total-blocking-time');

  const dict:Record<string, number | null> = {
    'lighthouse.accessibility': scoreAccessibility,
    'lighthouse.bestPractices': scoreBestPractices,
    'lighthouse.performance': scorePerformance,
    'lighthouse.pwa': scorePwa,
    'lighthouse.seo': scoreSeo,
    'lighthouse.largestContentfulPaint': largestContentfulPaint,
    'lighthouse.firstContentfulPaint': firstContentfulPaint,
    'lighthouse.cumulativeLayoutShift': cumulativeLayoutShift,
    'lighthouse.maxPotentialFid': maxPotentialFid,
    'lighthouse.timeToInteractive': timeToInteractive,
    'lighthouse.mainthreadWorkBreakdown': mainthreadWorkBreakdown,
    'lighthouse.unusedJavascript': unusedJavascript,
    'lighthouse.unusedCssRules': unusedCssRules,
    'lighthouse.modernImageFormats': modernImageFormats,
    'lighthouse.usesOptimizedImages': usesOptimizedImages,
    'lighthouse.renderBlockingResources': renderBlockingResources,
    'lighthouse.bootupTime': bootupTime,
    'lighthouse.serverResponseTime': serverResponseTime,
    'lighthouse.speedIndex': speedIndex,
    'lighthouse.domSize': domSize,
    'lighthouse.totalBlockingTime': totalBlockingTime,
  };

  const requestedUrl = data?.requestedUrl;
  const defaultTag = `url:${requestedUrl}`;

  const series = Object.entries(dict).map(([key, value]) => (
    value ? {
      metric: key,
      type: METRIC_TYPE,
      points: [
        {
          timestamp: Math.round(new Date().getTime() / 1000),
          value,
        },
      ],
      tags: tags ? [defaultTag, ...tags] : [defaultTag],
    } : null
  )).filter(nonNullable);

  return series;
}

export async function submitdMetrics(
  { data, tags, apiKey, appKey }
  :
  { data:LHRJSONSchemaType, tags?:string[], apiKey?:string, appKey?:string },
):Promise<void> {
  const configuration = client.createConfiguration(apiKey ? {
    authMethods: {
      apiKeyAuth: apiKey,
      appKeyAuth: appKey
    },
  } : {});
  configuration.setServerVariables({ site: "datadoghq.eu" });

  const apiInstance = new v2.MetricsApi(configuration);

  const params: v2.MetricsApiSubmitMetricsRequest = {
    body: {
      series: generateSeries(data, tags),
    },
  };

  return apiInstance
    .submitMetrics(params)
    .then((payloadData: v2.IntakePayloadAccepted) => {
      core.debug(
        `API called successfully. Returned data: ${JSON.stringify(payloadData)}`,
      );
    })
    .catch(core.error);
}

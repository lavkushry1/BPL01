#!/usr/bin/env node

/**
 * CDN Performance Analysis Script
 * 
 * This script analyzes performance metrics from Lighthouse and WebPageTest
 * and generates a report for the CI/CD pipeline.
 * 
 * Usage: node analyze-cdn-performance.js --lighthouse-report=path/to/report.json --webpagetest-report=path/to/report.json
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Parse command line arguments
program
  .option('--lighthouse-report <path>', 'Path to Lighthouse JSON report')
  .option('--webpagetest-report <path>', 'Path to WebPageTest JSON report')
  .option('--output <path>', 'Path to output JSON report', 'cdn-performance-report.json')
  .option('--slack', 'Send report to Slack', false)
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.lighthouseReport || !options.webpagetestReport) {
  console.error('Error: Both --lighthouse-report and --webpagetest-report are required');
  process.exit(1);
}

// Read Lighthouse report
let lighthouseData;
try {
  const lighthouseContent = fs.readFileSync(options.lighthouseReport, 'utf8');
  lighthouseData = JSON.parse(lighthouseContent);
} catch (error) {
  console.error(`Error reading Lighthouse report: ${error.message}`);
  process.exit(1);
}

// Read WebPageTest report
let webpagetestData;
try {
  const webpagetestContent = fs.readFileSync(options.webpagetestReport, 'utf8');
  webpagetestData = JSON.parse(webpagetestContent);
} catch (error) {
  console.error(`Error reading WebPageTest report: ${error.message}`);
  process.exit(1);
}

// Extract key metrics from Lighthouse
const lighthouseMetrics = {
  performance: lighthouseData.categories.performance.score * 100,
  accessibility: lighthouseData.categories.accessibility.score * 100,
  bestPractices: lighthouseData.categories['best-practices'].score * 100,
  seo: lighthouseData.categories.seo.score * 100,
  pwa: lighthouseData.categories.pwa ? lighthouseData.categories.pwa.score * 100 : 'N/A',
  firstContentfulPaint: lighthouseData.audits['first-contentful-paint'].numericValue,
  speedIndex: lighthouseData.audits['speed-index'].numericValue,
  largestContentfulPaint: lighthouseData.audits['largest-contentful-paint'].numericValue,
  timeToInteractive: lighthouseData.audits['interactive'].numericValue,
  totalBlockingTime: lighthouseData.audits['total-blocking-time'].numericValue,
  cumulativeLayoutShift: lighthouseData.audits['cumulative-layout-shift'].numericValue,
};

// Extract key metrics from WebPageTest (assuming standard structure)
const webpagetestMetrics = {
  firstView: {
    loadTime: webpagetestData.data.median.firstView.loadTime,
    TTFB: webpagetestData.data.median.firstView.TTFB,
    firstContentfulPaint: webpagetestData.data.median.firstView.firstContentfulPaint,
    speedIndex: webpagetestData.data.median.firstView.SpeedIndex,
    visualComplete: webpagetestData.data.median.firstView.visualComplete,
    requestsFull: webpagetestData.data.median.firstView.requestsFull,
    bytesIn: webpagetestData.data.median.firstView.bytesIn,
    cumulativeLayoutShift: webpagetestData.data.median.firstView.chromeUserTiming.CumulativeLayoutShift || 'N/A',
  },
};

// Analyze performance against thresholds
const performanceThresholds = {
  lighthouse: {
    performance: 80,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
    pwa: 70,
    firstContentfulPaint: 2000,
    speedIndex: 3000,
    largestContentfulPaint: 2500,
    timeToInteractive: 3500,
    totalBlockingTime: 300,
    cumulativeLayoutShift: 0.1,
  },
  webpagetest: {
    loadTime: 3000,
    TTFB: 600,
    firstContentfulPaint: 1500,
    speedIndex: 2000,
    visualComplete: 3000,
    requestsFull: 75,
    bytesIn: 1000000,
    cumulativeLayoutShift: 0.1,
  },
};

// Compare metrics against thresholds
const lighthouseAnalysis = {};
for (const [metric, value] of Object.entries(lighthouseMetrics)) {
  const threshold = performanceThresholds.lighthouse[metric];
  if (threshold === undefined) continue;
  
  // For scores, higher is better; for timing metrics, lower is better
  const isTiming = ['firstContentfulPaint', 'speedIndex', 'largestContentfulPaint', 'timeToInteractive', 'totalBlockingTime', 'cumulativeLayoutShift'].includes(metric);
  
  lighthouseAnalysis[metric] = {
    value,
    threshold,
    pass: isTiming ? value <= threshold : value >= threshold,
    percentDifference: isTiming 
      ? ((threshold - value) / threshold * 100).toFixed(2)
      : ((value - threshold) / threshold * 100).toFixed(2),
  };
}

const webpagetestAnalysis = {};
for (const [metric, value] of Object.entries(webpagetestMetrics.firstView)) {
  const threshold = performanceThresholds.webpagetest[metric];
  if (threshold === undefined || value === 'N/A') continue;
  
  // For WebPageTest metrics, lower is generally better
  webpagetestAnalysis[metric] = {
    value,
    threshold,
    pass: value <= threshold,
    percentDifference: ((threshold - value) / threshold * 100).toFixed(2),
  };
}

// Generate summary
const lighthousePassCount = Object.values(lighthouseAnalysis).filter(item => item.pass).length;
const lighthouseTotal = Object.values(lighthouseAnalysis).length;
const webpagetestPassCount = Object.values(webpagetestAnalysis).filter(item => item.pass).length;
const webpagetestTotal = Object.values(webpagetestAnalysis).length;

const summary = {
  lighthouse: {
    passRate: `${lighthousePassCount}/${lighthouseTotal} (${(lighthousePassCount / lighthouseTotal * 100).toFixed(2)}%)`,
    overallPass: lighthousePassCount === lighthouseTotal,
  },
  webpagetest: {
    passRate: `${webpagetestPassCount}/${webpagetestTotal} (${(webpagetestPassCount / webpagetestTotal * 100).toFixed(2)}%)`,
    overallPass: webpagetestPassCount === webpagetestTotal,
  },
  overallPass: lighthousePassCount === lighthouseTotal && webpagetestPassCount === webpagetestTotal,
};

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  url: lighthouseData.finalUrl,
  summary,
  lighthouse: {
    metrics: lighthouseMetrics,
    analysis: lighthouseAnalysis,
  },
  webpagetest: {
    metrics: webpagetestMetrics,
    analysis: webpagetestAnalysis,
  },
};

// Write report to file
fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
console.log(`Report written to ${options.output}`);

// Generate console output
console.log('\n=== CDN Performance Analysis ===');
console.log(`URL: ${report.url}`);
console.log(`Timestamp: ${report.timestamp}`);
console.log('\nSummary:');
console.log(`- Lighthouse: ${report.summary.lighthouse.passRate} metrics passing`);
console.log(`- WebPageTest: ${report.summary.webpagetest.passRate} metrics passing`);
console.log(`- Overall: ${report.summary.overallPass ? 'PASS' : 'FAIL'}`);

console.log('\nLighthouse Metrics:');
for (const [metric, analysis] of Object.entries(report.lighthouse.analysis)) {
  const status = analysis.pass ? '✅' : '❌';
  const diff = analysis.percentDifference > 0 ? `+${analysis.percentDifference}%` : `${analysis.percentDifference}%`;
  console.log(`- ${metric}: ${analysis.value} (${status} ${diff})`);
}

console.log('\nWebPageTest Metrics:');
for (const [metric, analysis] of Object.entries(report.webpagetest.analysis)) {
  const status = analysis.pass ? '✅' : '❌';
  const diff = analysis.percentDifference > 0 ? `+${analysis.percentDifference}%` : `${analysis.percentDifference}%`;
  console.log(`- ${metric}: ${analysis.value} (${status} ${diff})`);
}

// Exit with appropriate code
process.exit(report.summary.overallPass ? 0 : 1);
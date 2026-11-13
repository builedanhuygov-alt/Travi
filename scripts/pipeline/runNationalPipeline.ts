/**
 * Runner Script for National Tourism Pipeline (Phase 1)
 * ====================================================
 * Execute with:
 *   node --experimental-strip-types scripts/pipeline/runNationalPipeline.ts
 */

import path from 'path';
import { NationalTourismPipeline } from '../../src/services/pipeline/nationalPipeline.ts';

async function main() {
  console.log('======================================================================');
  console.log('TRAVI — NATIONAL VIETNAM TOURISM DATA PIPELINE (PHASE 1)');
  console.log('======================================================================');

  const outputBaseDir = path.resolve(process.cwd(), 'src/data/national');
  const pipeline = new NationalTourismPipeline();
  const { report } = pipeline.execute(outputBaseDir);

  console.log('\n--- PIPELINE EXECUTION SUMMARY ---');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Batch ID: ${report.batch_id}`);
  console.log(`Raw Ingested Records: ${report.total_raw_ingested}`);
  console.log(`Canonical POIs Produced: ${report.total_canonical_records}`);
  console.log(`Exact Merges (Deduplicated): ${report.exact_merges_count}`);
  console.log(`Ambiguous Items in Review Queue: ${report.ambiguous_review_items_count}`);
  console.log(`Provinces with POIs: ${report.provinces_with_pois_count} / ${report.provinces_total_count} (${report.coverage_percentage})`);
  console.log('\nData Confidence Summary:');
  console.log(`- ROBUST (≥20 official gov POIs or ≥30 total authoritative): ${report.data_confidence_summary.robust} provinces`);
  console.log(`- MODERATE: ${report.data_confidence_summary.moderate} provinces`);
  console.log(`- SPARSE: ${report.data_confidence_summary.sparse} provinces`);
  console.log(`- NO_VERIFIED_DATA (Honest zero-record reporting): ${report.data_confidence_summary.no_verified_data} provinces`);
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});

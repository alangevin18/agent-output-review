# Quality Control Report

## Overview

Quality control analysis was performed on all 12 RNA-seq samples (6 treatment, 6 control) across 2 sequencing batches.

## Per-Sample QC Metrics

### RIN Scores

RNA Integrity Numbers range from 6.2 to 9.3. All samples meet the minimum threshold of 7.0 **except sample S07** (RIN = 6.2), which indicates partial RNA degradation.

### Sequencing Depth

- **Mean reads**: 40.6 million (range: 28M - 48M)
- All samples exceed the recommended minimum of 30M reads **except S07** (28M reads)
- Coefficient of variation: 14.2%

### Mapping Quality

- **Mean mapping rate**: 93.7% (range: 82% - 96%)
- Sample S07 has notably lower mapping rate (82%) compared to other samples (93-96%)
- This may be due to RNA degradation causing more unmappable fragments

### Duplication Rate

- **Mean duplication rate**: 13.1% (range: 11% - 25%)
- Sample S07 has an elevated duplication rate (25%), roughly double the other samples
- High duplication combined with low total reads suggests library complexity issues

## Batch Effect Assessment

PCA analysis reveals a clear batch effect between batch_1 and batch_2 samples along PC2 (explaining 12% of variance). This is correctable using ComBat-seq and has been included in the analysis design formula.

After batch correction, treatment vs. control separation is clear along PC1 (38% of variance).

## Sample S07 Assessment

Sample S07 (control, batch_1) shows multiple quality concerns:

| Metric | S07 Value | Other Samples (mean) | Status |
|--------|-----------|---------------------|--------|
| RIN score | 6.2 | 8.9 | Below threshold |
| Total reads | 28M | 42.2M | Below recommendation |
| Mapping rate | 82% | 94.8% | Low |
| Duplicate rate | 25% | 12% | High |

**Recommendation**: Consider excluding S07 from downstream analyses. The control group retains n=5 samples, which provides sufficient statistical power for the observed effect sizes. Alternatively, run analyses both with and without S07 and compare results.

## Batch Correction

ComBat-seq was applied to correct for batch effects. Parameters:
- **Method**: ComBat-seq (negative binomial model)
- **Batch variable**: sequencing batch (batch_1, batch_2)
- **Covariates preserved**: treatment group

Batch correction successfully removed the batch effect visible in PCA while preserving biological signal.

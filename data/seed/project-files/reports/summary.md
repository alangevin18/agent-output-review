# Differential Expression Analysis Summary

## Overview

Differential expression analysis comparing treatment (n=6) vs control (n=6) using DESeq2 v1.42.0. Tested 2,847 genes that passed minimum count filter.

## Key Findings

- **847 genes** significantly differentially expressed (adjusted p < 0.05, |log2FC| > 1)
- **412 genes** upregulated in treatment group
- **435 genes** downregulated in treatment group
- Largest fold change: CDH1 (log2FC = -3.21)

## Top Genes

| Gene | log2FC | Adj. P-Value | Direction |
|------|--------|-------------|-----------|
| CDH1 | -3.21 | 0.0002 | Down |
| ERBB2 | 3.45 | 0.00025 | Up |
| EGFR | 3.12 | 0.0005 | Up |
| PTEN | -2.78 | 0.0006 | Down |

## Next Steps

1. Perform pathway enrichment analysis on the 847 significant DEGs
2. Validate top hits with qRT-PCR
3. Investigate CDH1 downregulation

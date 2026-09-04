# Methods: Pathway Enrichment Analysis

## Gene Set Enrichment

Pathway enrichment analysis was performed on the 847 significantly differentially expressed genes identified in the differential expression analysis. We used the hypergeometric test to assess overrepresentation of gene sets from KEGG (release 2024.1) and Gene Ontology (release 2024-01-15) databases.

## Statistical Analysis

- **Test**: Hypergeometric (Fisher's exact test, one-sided)
- **Background set**: All 2,847 genes tested in the differential expression analysis
- **Multiple testing correction**: Benjamini-Hochberg (FDR < 0.05)
- **Gene set size filter**: Minimum 5 genes, maximum 500 genes

## Results

A total of 23 pathways were significantly enriched (adjusted p < 0.05). The most significantly enriched pathways include:

1. **Cell cycle** (28 genes, adj. p = 2.3e-5) — consistent with the proliferative phenotype observed in treatment samples
2. **PI3K-Akt signaling** (35 genes, adj. p = 3.5e-5) — suggests activation of survival signaling
3. **Wnt signaling** (22 genes, adj. p = 6.1e-5) — CDH1 downregulation may indicate EMT involvement

## Software

- clusterProfiler v4.10.0 (R/Bioconductor)
- org.Hs.eg.db v3.18.0 for gene identifier mapping
- pathview v1.42.0 for pathway visualization

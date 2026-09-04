# Methods: Pathway Analysis

## Gene Set Enrichment

Pathway enrichment analysis was performed on significantly differentially expressed genes. We used the hypergeometric test to assess overrepresentation of gene sets from KEGG and Gene Ontology databases.

## Statistical Analysis

- **Test**: Hypergeometric (Fisher's exact test)
- **Multiple testing correction**: Bonferroni (p < 0.05)
- **Gene set size filter**: Minimum 10 genes, maximum 200 genes

## Software

- clusterProfiler v4.8.0 (R/Bioconductor)
- org.Hs.eg.db v3.16.0 for gene identifier mapping

# Supplementary Methods

## 1. RNA Extraction and Quality Control

Total RNA was extracted from frozen tissue samples using the RNeasy Mini Kit (Qiagen) according to the manufacturer's protocol. RNA integrity was assessed using the Agilent 2100 Bioanalyzer with RNA 6000 Nano chips. Samples with RIN > 7.0 were considered acceptable for library preparation.

## 2. Library Preparation

Sequencing libraries were prepared using the TruSeq Stranded mRNA Library Prep Kit (Illumina). Briefly, poly-A mRNA was isolated from 1 ug total RNA using oligo-dT magnetic beads, fragmented to approximately 200 bp, and reverse-transcribed to cDNA. Adapters with unique indices were ligated, and libraries were amplified with 12 cycles of PCR.

## 3. Sequencing

Libraries were pooled in equimolar ratios and sequenced on the Illumina NovaSeq 6000 platform using 2x150 bp paired-end reads. Sequencing was performed across two flow cell lanes (batch_1 and batch_2) to achieve a target depth of 40 million read pairs per sample.

## 4. Read Processing

Raw reads were assessed for quality using FastQC v0.11.9. Adapter sequences and low-quality bases (Q < 20) were trimmed using Trimmomatic v0.39 with parameters: ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15 MINLEN:36.

## 5. Alignment

Trimmed reads were aligned to the human reference genome (GRCh38, Ensembl release 108) using STAR v2.7.10b with default parameters and the following modifications:
- `--outSAMtype BAM SortedByCoordinate`
- `--quantMode GeneCounts`
- `--sjdbOverhang 149`

## 6. Quantification

Gene-level read counts were obtained from STAR's GeneCounts output using the unstranded column. Counts were aggregated at the gene symbol level using the Ensembl-to-HGNC mapping from biomaRt.

## 7. Differential Expression Analysis

Differential expression analysis was performed using DESeq2 v1.42.0 in R v4.3.2. The design formula included treatment group and sequencing batch as covariates:

```
design = ~ treatment + batch
```

Size factors were estimated using the median of ratios method. Genes with fewer than 10 counts across all samples were excluded prior to analysis (1,523 genes removed, 2,847 retained).

The likelihood ratio test (LRT) was used for significance testing with the reduced formula `~ batch`. P-values were adjusted for multiple testing using the Benjamini-Hochberg method. Genes were considered significantly differentially expressed at adjusted p < 0.05 and |log2 fold change| > 1.

## 8. Batch Effect Correction

Principal component analysis revealed a batch effect between sequencing runs along PC2 (12.1% of variance). ComBat-seq was applied to correct for batch effects while preserving the biological signal from the treatment variable. Post-correction PCA confirmed removal of the batch effect.

## 9. Pathway Enrichment

Gene set enrichment analysis was performed using clusterProfiler v4.10.0 against KEGG (release 2024.1) and Gene Ontology (release 2024-01-15) databases. The hypergeometric test was used with Benjamini-Hochberg correction. Gene sets with fewer than 5 or more than 500 genes were excluded.

## 10. Software Versions

| Software | Version |
|----------|---------|
| R | 4.3.2 |
| DESeq2 | 1.42.0 |
| STAR | 2.7.10b |
| Trimmomatic | 0.39 |
| FastQC | 0.11.9 |
| clusterProfiler | 4.10.0 |
| ComBat-seq | 3.48.0 |
| biomaRt | 2.58.0 |

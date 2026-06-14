# 本草方典

A private, responsive Chinese medicine formula and materia medica reference.

## Included

- 273 canonical formula pages consolidated from 412 source-preserving variants
- Clinical correlates merged as tags and detailed links on each canonical formula
- 413 clinical usage links and 264 linked herb records
- Chinese, pinyin, and English full-library search
- Formula and herb detail views, comparison, bookmarks, and study cards
- PWA manifest and offline application shell
- PostgreSQL reference/citation/review schema in `database/schema.sql`
- Page-aware textbook OCR extraction in `scripts/extract_textbooks.py`
- English materia medica matching and enrichment in `scripts/import_english_materia_medica.py`
- Conservative exact-name formula enrichment from American Dragon

## Run

```powershell
npm install
npm run validate:data
npm run dev
```

Open `http://localhost:3000`.

## Textbook review pipeline

```powershell
npm run extract:formulas
npm run import:formula-textbook
npm run extract:herbs
npm run import:english-herbs
npm run import:american-dragon
```

The extraction results are written to `data/review`. Every candidate starts as
`pending`; it must be reviewed before being promoted into the canonical
database. The source PDFs remain outside the repository.

## Safety and copyright

This app is a private educational reference. It does not diagnose or prescribe.
Textbook content should not be publicly redistributed without permission.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

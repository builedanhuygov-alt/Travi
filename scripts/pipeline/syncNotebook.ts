import fs from 'fs';
import path from 'path';

const appPyPath = path.resolve(process.cwd(), 'colab/app.py');
const nbPath = path.resolve(process.cwd(), 'colab/travi_colab_qwen2.ipynb');

const appPyContent = fs.readFileSync(appPyPath, 'utf8');
const nb = JSON.parse(fs.readFileSync(nbPath, 'utf8'));

const cellSource = [
  '# STEP 5: WRITE AUDITED & HARDENED FASTAPI BACKEND APPLICATION SCRIPT (app.py)\n',
  '# Hardened CORS, 16KB body size limit, prompt injection defense, and multi-collection RAG\n',
  'with open("app.py", "w", encoding="utf-8") as f:\n',
  `    f.write(${JSON.stringify(appPyContent)})\n`,
  'print("Saved audited app.py with Multi-Collection RAG Grounding, Adaptive Profiles, 16KB Guard, and Token Security.")\n',
];

nb.cells[4].source = cellSource;

fs.writeFileSync(nbPath, JSON.stringify(nb, null, 2), 'utf8');
console.log('Successfully synchronized colab/travi_colab_qwen2.ipynb with colab/app.py');

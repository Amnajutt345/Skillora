// CV reading and skill extraction. Everything runs in the browser.
// Supported files: PDF (text based, not scanned images) and plain text.

const MAX_BYTES = 5 * 1024 * 1024;

// Extra spellings people use on CVs -> catalogue skill
const ALIASES = {
  reactjs: 'React', 'react.js': 'React', nodejs: 'Node.js', node: 'Node.js', expressjs: 'Express.js', express: 'Express.js',
  vue: 'Vue.js', vuejs: 'Vue.js', nextjs: 'Next.js', postgres: 'PostgreSQL', mongo: 'MongoDB', js: 'JavaScript', ts: 'TypeScript',
  tailwind: 'Tailwind CSS', sklearn: 'Scikit-learn', 'scikit learn': 'Scikit-learn', tensorflow: 'TensorFlow', 'rest api': 'REST APIs',
  restful: 'REST APIs', golang: 'Go', html5: 'HTML', css3: 'CSS', 'machine learning': 'Machine Learning', ml: 'Machine Learning',
};

async function pdfText(file) {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => it.str).join(' '));
  }
  return pages.join('\n');
}

export async function readCv(file) {
  if (file.size > MAX_BYTES) throw new Error('The file is larger than 5 MB.');
  const name = file.name.toLowerCase();
  let text;
  if (name.endsWith('.pdf')) {
    try {
      text = await pdfText(file);
    } catch {
      throw new Error('This PDF could not be read. Try another file.');
    }
  } else if (name.endsWith('.txt')) {
    text = await file.text();
  } else {
    throw new Error('Unsupported file type. Upload a PDF or a plain text (.txt) CV.');
  }
  if (text.trim().length < 20) throw new Error('No text was found in this file. Scanned image CVs are not supported.');
  return text;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function mentions(text, term, caseSensitive) {
  const re = new RegExp(`(?<![A-Za-z0-9+#])${escapeRe(term)}(?![A-Za-z0-9+#])`, caseSensitive ? '' : 'i');
  return re.test(text);
}

// Returns catalogue skills that appear in the CV text.
export function extractSkills(text, catalogueNames) {
  const found = new Set();
  catalogueNames.forEach((name) => {
    // one or two letter names (C, Go) are matched case-sensitively to avoid false hits
    if (mentions(text, name, name.length <= 2)) found.add(name);
  });
  const lookup = new Map(catalogueNames.map((n) => [n.toLowerCase(), n]));
  Object.entries(ALIASES).forEach(([alias, skill]) => {
    const name = lookup.get(skill.toLowerCase());
    if (name && alias.length > 2 && mentions(text, alias, false)) found.add(name);
  });
  return [...found].sort((a, b) => a.localeCompare(b));
}

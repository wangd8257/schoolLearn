import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const cloudbaseRoot = path.resolve(projectRoot, '..', 'cloudbase-todo-knowledge');
const sourceManifestPath = path.join(projectRoot, 'huiben', 'manifest.json');
const functionRoot = path.join(cloudbaseRoot, 'functions', 'knowledge-api');
const uploadRoot = path.join(cloudbaseRoot, '.cloudbase-reading-upload');

/**
 * 生成默认阅读资料的 CloudBase 存储清单和稳定文件名。
 * @returns {void}
 */
function main() {
  const sourceText = fs.readFileSync(sourceManifestPath, 'utf8').replace(/^\uFEFF/u, '');
  const source = JSON.parse(sourceText);
  const books = (Array.isArray(source.books) ? source.books : []).map((book) => {
    const fileKind = String(book.fileKind || path.extname(book.fileName || '').slice(1)).toLowerCase();
    const extension = fileKind === 'equb' ? 'equb' : fileKind === 'epub' ? 'epub' : 'pdf';
    const storageName = `${book.id}.${extension}`;
    const localPath = path.join(projectRoot, 'huiben', book.fileName);
    if (!fs.existsSync(localPath)) throw new Error(`默认阅读资料不存在：${localPath}`);
    return {
      id: String(book.id),
      title: String(book.title || book.fileName || '未命名绘本'),
      fileName: String(book.fileName || `${book.id}.${extension}`),
      fileKind,
      category: book.category || '绘本',
      size: Number(book.size || fs.statSync(localPath).size),
      storageName,
      localPath,
    };
  });

  fs.rmSync(uploadRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(uploadRoot, 'reading', 'books'), { recursive: true });
  books.forEach((book) => {
    fs.copyFileSync(book.localPath, path.join(uploadRoot, 'reading', 'books', book.storageName));
  });

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    storagePrefix: 'reading/books',
    books: books.map(({ localPath, ...book }) => book),
  };
  fs.writeFileSync(path.join(functionRoot, 'reading-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(uploadRoot, 'reading', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    bookCount: books.length,
    totalBytes: books.reduce((sum, book) => sum + book.size, 0),
    uploadRoot,
    functionManifest: path.join(functionRoot, 'reading-manifest.json'),
  }, null, 2));
}

main();

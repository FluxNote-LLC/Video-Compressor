from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
with ZipFile(root / 'public/source.zip', 'w', ZIP_DEFLATED) as archive:
    for name in ['app', 'components', 'hooks', 'lib', 'scripts', 'docs']:
        for path in (root / name).rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts:
                archive.write(path, 'frame/' + str(path.relative_to(root)))
    for name in ['package.json', 'package-lock.json', 'README.md', 'LICENSE', 'THIRD_PARTY.md', 'vite.config.ts', 'next.config.ts', 'tsconfig.json', 'components.json', '.gitignore', '.oxlintrc.json', '.oxfmtrc.json']:
        archive.write(root / name, 'frame/' + name)
    archive.writestr('frame/.openai/hosting.json', '{"d1":null,"r2":null}\n')
    archive.write(root / 'public/favicon.svg', 'frame/public/favicon.svg')

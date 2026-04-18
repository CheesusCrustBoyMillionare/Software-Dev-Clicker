#!/usr/bin/env python3
"""build.py — concatenates src/ into gamedev-clicker.html (+ index.html copy).
Run with: python build.py"""
import os
from pathlib import Path

js_files = sorted(f.name for f in Path('src/js').iterdir() if f.suffix == '.js')

parts = [
    Path('src/head.html').read_text(encoding='utf-8'),
    '<style>\n',
    Path('src/styles.css').read_text(encoding='utf-8'),
    '</style>\n</head>\n<body>\n',
    Path('src/body.html').read_text(encoding='utf-8'),
    '<script>\n',
    *[Path(f'src/js/{f}').read_text(encoding='utf-8') for f in js_files],
    '</script>\n</body>\n</html>\n',
]

output = ''.join(parts)
Path('gamedev-clicker.html').write_text(output, encoding='utf-8')
Path('index.html').write_text(output, encoding='utf-8')

size_kb = len(output.encode('utf-8')) / 1024
line_count = output.count('\n') + 1
print(f'Build complete: gamedev-clicker.html ({size_kb:.1f} KB, {line_count} lines)')
print(f'JS modules concatenated: {len(js_files)}')
print(f'  ' + ', '.join(js_files))
print(f'Also wrote: index.html (copy)')

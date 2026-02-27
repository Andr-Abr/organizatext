#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io

# Forzar UTF-8 en stdout/stderr para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import os
import warnings
from pathlib import Path

# Silenciar warnings
warnings.filterwarnings('ignore')

# Importar librerías de procesamiento
try:
    from PyPDF2 import PdfReader
    import docx
    import markdown
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {e}", "success": False}))
    sys.exit(1)


def extract_text_from_pdf(filepath):
    """Extrae texto de PDF"""
    reader = PdfReader(filepath)
    text = []
    for page in reader.pages:
        text.append(page.extract_text())
    return "\n".join(text)


def extract_text_from_docx(filepath):
    """Extrae texto de DOCX"""
    doc = docx.Document(filepath)
    return "\n".join([para.text for para in doc.paragraphs])


def extract_text_from_md(filepath):
    """Extrae texto de Markdown"""
    with open(filepath, 'r', encoding='utf-8') as f:
        md_content = f.read()
    # Convertir markdown a texto plano (quita formato)
    html = markdown.markdown(md_content)
    # Quitar tags HTML básico
    import re
    text = re.sub('<[^<]+?>', '', html)
    return text


def extract_text_from_txt(filepath):
    """Extrae texto de TXT"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def process_document(filepath):
    """Procesa un documento y retorna JSON con metadata"""
    path = Path(filepath)
    
    if not path.exists():
        return {"error": "File not found", "success": False}
    
    file_ext = path.suffix.lower()
    
    try:
        if file_ext == '.pdf':
            text = extract_text_from_pdf(filepath)
        elif file_ext in ['.docx', '.doc']:
            text = extract_text_from_docx(filepath)
        elif file_ext == '.md':
            text = extract_text_from_md(filepath)
        elif file_ext == '.txt':
            text = extract_text_from_txt(filepath)
        else:
            return {"error": f"Unsupported file type: {file_ext}", "success": False}
        
        # Calcular metadata
        word_count = len(text.split())
        char_count = len(text)
        
        return {
            "filename": path.name,
            "filepath": str(path.absolute()),
            "extension": file_ext,
            "text": text,
            "word_count": word_count,
            "char_count": char_count,
            "success": True
        }
    
    except Exception as e:
        return {"error": str(e), "success": False}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: process_document.py <filepath>", "success": False}))
        sys.exit(1)
    
    filepath = sys.argv[1]
    result = process_document(filepath)
    print(json.dumps(result, ensure_ascii=False))
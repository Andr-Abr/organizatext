#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io

# Forzar UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import os
import warnings

warnings.filterwarnings('ignore')
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'

import lancedb

DB_PATH = "./data/lancedb"
TABLE_NAME = "documents"

def list_documents():
    """Lista todos los documentos CON TEXTO COMPLETO"""
    try:
        db = lancedb.connect(DB_PATH)
        table = db.open_table(TABLE_NAME)
        
        df = table.to_pandas()
        
        docs = []
        for _, row in df.iterrows():
            metadata = json.loads(row['metadata']) if row['metadata'] else {}
            docs.append({
                "id": row['id'],
                "text": row['text'],  # TEXTO COMPLETO, sin truncar
                "metadata": metadata
            })
        
        return docs
    
    except Exception as e:
        return [{"error": str(e)}]


if __name__ == "__main__":
    docs = list_documents()
    print(json.dumps(docs, ensure_ascii=False))
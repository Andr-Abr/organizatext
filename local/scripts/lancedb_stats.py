#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io

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

def get_stats():
    """Obtiene estadísticas de la base de datos"""
    try:
        db = lancedb.connect(DB_PATH)
        table = db.open_table(TABLE_NAME)
        
        # Contar documentos
        df = table.to_pandas()
        total_docs = len(df)
        
        # IDs únicos
        unique_ids = df['id'].nunique()
        
        return {
            "total_documents": total_docs,
            "unique_documents": unique_ids,
            "table_name": TABLE_NAME,
            "db_path": DB_PATH
        }
    
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    stats = get_stats()
    print(json.dumps(stats))
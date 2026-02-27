#!/usr/bin/env python3
# Inicializa la base de datos LanceDB

import lancedb
from sentence_transformers import SentenceTransformer

# Inicializar modelo de embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

# Conectar a LanceDB
db = lancedb.connect('./data/lancedb')

# Crear tabla si no existe
try:
    table = db.open_table('documents')
    print("Tabla ya existe")
except:
    # Crear tabla vacía
    import pyarrow as pa
    schema = pa.schema([
        pa.field("id", pa.string()),
        pa.field("text", pa.string()),
        pa.field("vector", pa.list_(pa.float32(), 384)),
        pa.field("metadata", pa.string())
    ])
    table = db.create_table('documents', schema=schema)
    print("Tabla creada")
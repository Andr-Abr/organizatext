package com.organizatext.llm

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LlmPromptBuilder @Inject constructor() {

    fun keywordExtractionPrompt(text: String, topN: Int = 10): String {
        val preview = text.take(1500)
        return """Extrae las $topN palabras clave más importantes del siguiente texto en español.
Responde ÚNICAMENTE con las palabras clave separadas por comas.
No incluyas numeración, explicaciones ni texto adicional.

Texto:
$preview

Palabras clave:"""
    }

    fun categoryAssignmentPrompt(
        text: String,
        categories: List<String>
    ): String {
        val preview = text.take(1000)
        val catList = categories.joinToString(", ")
        return """Analiza el siguiente texto y determina a cuál de estas categorías pertenece: $catList

Reglas:
- Responde ÚNICAMENTE con el nombre exacto de una categoría de la lista
- No expliques tu elección
- Si ninguna categoría encaja, responde: Sin categoría

Texto:
$preview

Categoría:"""
    }

    fun semanticSummaryPrompt(text: String): String {
        val preview = text.take(2000)
        return """Resume el siguiente texto en máximo 3 oraciones en español.
Sé conciso y captura la idea principal.

Texto:
$preview

Resumen:"""
    }
}
package com.organizatext.llm

import android.content.Context
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

sealed class LlmResult {
    data class Success(val response: String) : LlmResult()
    data class Error(val message: String) : LlmResult()
}

@Singleton
class MediaPipeLlmEngine @Inject constructor(
    @ApplicationContext private val context: Context,
    private val modelDownloader: ModelDownloader
) {
    private var llmInference: LlmInference? = null
    private var loadedModelId: String? = null

    fun getLoadedModelId(): String? = loadedModelId

    fun isLoaded(): Boolean = llmInference != null

    suspend fun loadModel(model: ModelInfo): Result<Unit> =
        withContext(Dispatchers.IO) {
            if (loadedModelId == model.id && llmInference != null) return@withContext Result.success(Unit)
            try {
                unload()
                val modelPath = modelDownloader.getModelPath(model)
                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelPath)
                    .setMaxTokens(1024)
                    .setMaxTopK(40)
                    .build()
                llmInference = LlmInference.createFromOptions(context, options)
                loadedModelId = model.id
                Result.success(Unit)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun extractKeywords(text: String, topN: Int = 10): LlmResult =
        withContext(Dispatchers.Default) {
            val engine = llmInference ?: return@withContext LlmResult.Error("Modelo no cargado")
            try {
                val prompt = buildKeywordPrompt(text, topN)
                val response = engine.generateResponse(prompt)
                LlmResult.Success(parseKeywords(response))
            } catch (e: Exception) {
                LlmResult.Error(e.message ?: "Error en inferencia")
            }
        }

    suspend fun extractKeywordsChunked(
        text: String,
        topN: Int = 10
    ): LlmResult = withContext(Dispatchers.Default) {
        val engine = llmInference ?: return@withContext LlmResult.Error("Modelo no cargado")

        try {
            // NUEVO: Limpiar texto PRIMERO
            val cleanedText = sanitizeText(text)
            android.util.Log.d("LlmEngine", "Texto original: ${text.length} chars, limpio: ${cleanedText.length} chars")

            // Dividir el texto limpio en palabras
            val words = cleanedText.split(Regex("\\s+")).filter { it.isNotBlank() }

            val chunkSize = 300
            val chunks = words.chunked(chunkSize).map { it.joinToString(" ") }

            android.util.Log.d("LlmEngine", "Total chunks: ${chunks.size}, palabras totales: ${words.size}")

            val selectedChunks = when {
                chunks.isEmpty() -> {
                    android.util.Log.w("LlmEngine", "No hay chunks, texto vacío")
                    return@withContext LlmResult.Error("Texto vacío")
                }
                chunks.size == 1 -> {
                    android.util.Log.d("LlmEngine", "Solo 1 chunk, usando completo")
                    listOf(chunks[0])
                }
                chunks.size == 2 -> {
                    android.util.Log.d("LlmEngine", "2 chunks, usando inicio y final")
                    listOf(chunks[0], chunks[1])
                }
                chunks.size == 3 -> {
                    android.util.Log.d("LlmEngine", "3 chunks, usando todos")
                    chunks
                }
                else -> {
                    val inicio = chunks.first()
                    val medio = chunks[chunks.size / 2]
                    val fin = chunks.last()
                    android.util.Log.d("LlmEngine", "Más de 3 chunks, usando inicio/medio/fin")
                    listOf(inicio, medio, fin)
                }
            }

            val allKeywords = mutableSetOf<String>()

            selectedChunks.forEachIndexed { index, chunk ->
                android.util.Log.d("LlmEngine", "Procesando chunk ${index + 1}/${selectedChunks.size}")
                val prompt = buildKeywordPrompt(chunk, topN)
                val response = engine.generateResponse(prompt)
                val keywords = parseKeywords(response)

                keywords.split(",").forEach { keyword ->
                    val cleaned = keyword.trim()
                    if (cleaned.isNotBlank() && cleaned.length > 2) {
                        allKeywords.add(cleaned)
                    }
                }
                android.util.Log.d("LlmEngine", "Chunk ${index + 1} aportó keywords, total acumulado: ${allKeywords.size}")
            }

            val finalKeywords = allKeywords
                .take(topN)
                .joinToString(",")

            android.util.Log.d("LlmEngine", "Keywords finales (${allKeywords.size} únicas, mostrando top $topN): $finalKeywords")

            LlmResult.Success(finalKeywords)

        } catch (e: Exception) {
            android.util.Log.e("LlmEngine", "Error en chunking: ${e.message}", e)
            LlmResult.Error(e.message ?: "Error en inferencia chunked")
        }
    }

    suspend fun suggestCategory(
        text: String,
        availableCategories: List<String>
    ): LlmResult = withContext(Dispatchers.Default) {
        val engine = llmInference ?: return@withContext LlmResult.Error("Modelo no cargado")
        try {
            val prompt = buildCategoryPrompt(text, availableCategories)
            val response = engine.generateResponse(prompt)
            LlmResult.Success(response.trim())
        } catch (e: Exception) {
            LlmResult.Error(e.message ?: "Error en inferencia")
        }
    }

    fun unload() {
        llmInference?.close()
        llmInference = null
        loadedModelId = null
    }

    // NUEVO: Sanitizar texto antes de procesarlo
    private fun sanitizeText(text: String): String {
        return text
            // Remover tags HTML/XML
            .replace(Regex("<[^>]*>"), " ")
            // Remover símbolos especiales problemáticos
            .replace(Regex("[❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴]"), " ")
            // Normalizar saltos de línea múltiples
            .replace(Regex("\n{3,}"), "\n\n")
            // Normalizar espacios múltiples
            .replace(Regex(" {2,}"), " ")
            // Normalizar tabs
            .replace("\t", " ")
            // Remover líneas que solo tienen símbolos
            .split("\n")
            .filterNot { line ->
                line.trim().all { char ->
                    !char.isLetterOrDigit() && char !in setOf(',', '.', '!', '?', '-', '(', ')')
                }
            }
            .joinToString("\n")
            .trim()
    }

    private fun buildKeywordPrompt(text: String, topN: Int): String {
        // Sanitizar ANTES de tomar el preview
        val cleanedText = sanitizeText(text)
        val preview = cleanedText.take(1500)

        return """Extrae las $topN palabras clave más importantes del siguiente texto.
Responde ÚNICAMENTE con las palabras clave separadas por comas, sin numeración ni explicación.

Texto:
$preview

Palabras clave:"""
    }

    private fun buildCategoryPrompt(text: String, categories: List<String>): String {
        val cleanedText = sanitizeText(text)
        val preview = cleanedText.take(1000)
        val cats = categories.joinToString(", ")

        return """Analiza el siguiente texto y asígnale UNA categoría de esta lista: $cats

Responde ÚNICAMENTE con el nombre exacto de la categoría, sin explicación.

Texto:
$preview

Categoría:"""
    }

    private fun parseKeywords(response: String): String =
        response.trim()
            .replace(Regex("^\\d+\\.\\s*", RegexOption.MULTILINE), "")
            .split(",", "\n")
            .map { it.trim() }
            .filter {
                it.isNotBlank() &&
                        it.length > 2 &&
                        it.length <= 60 &&                  // descarta bloques largos
                        it.count { c -> c == ' ' } <= 5     // máximo 5 espacios = término corto
            }
            .take(10)
            .joinToString(",")

    suspend fun chat(prompt: String): LlmResult =
        withContext(Dispatchers.IO) {
            val engine = llmInference ?: return@withContext LlmResult.Error("Modelo no cargado")
            try {
                val response = engine.generateResponse(prompt)
                LlmResult.Success(
                    response.trim()
                        .removePrefix("Asistente:")
                        .trim()
                )
            } catch (e: Exception) {
                LlmResult.Error(e.message ?: "Error en inferencia")
            }
        }
}


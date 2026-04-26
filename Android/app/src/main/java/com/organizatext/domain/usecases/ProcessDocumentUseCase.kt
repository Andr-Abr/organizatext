package com.organizatext.domain.usecases

import com.organizatext.data.repository.DocumentRepository
import com.organizatext.llm.LlmResult
import com.organizatext.llm.MediaPipeLlmEngine
import com.organizatext.nlp.RakeExtractor
import com.organizatext.nlp.RegexExtractor
import javax.inject.Inject

class ProcessDocumentUseCase @Inject constructor(
    private val repository: DocumentRepository,
    private val rakeExtractor: RakeExtractor,
    private val regexExtractor: RegexExtractor,
    private val llmEngine: MediaPipeLlmEngine
) {
    suspend operator fun invoke(
        documentId: String,
        content: String,
        fileName: String
    ) {
        val wordCount = content.split(Regex("\\s+")).filter { it.isNotBlank() }.size
        val useUltra = llmEngine.isLoaded() && wordCount >= 10

        android.util.Log.d("ProcessDoc", "useUltra=$useUltra, wordCount=$wordCount, isLoaded=${llmEngine.isLoaded()}")

        val tags = if (useUltra) {
            // CAMBIO: Usar chunking para textos largos (más de 400 palabras)
            val result = if (wordCount > 400) {
                android.util.Log.d("ProcessDoc", "Texto largo detectado ($wordCount palabras), usando chunking")
                llmEngine.extractKeywordsChunked(content, topN = 10)
            } else {
                android.util.Log.d("ProcessDoc", "Texto corto ($wordCount palabras), extracción normal")
                llmEngine.extractKeywords(content, topN = 10)
            }

            when (result) {
                is LlmResult.Success -> {
                    android.util.Log.d("ProcessDoc", "LLM tags: ${result.response}")
                    result.response
                }
                is LlmResult.Error -> {
                    android.util.Log.d("ProcessDoc", "LLM error: ${result.message}, usando RAKE fallback")
                    extractBasicKeywords(content)
                }
            }
        } else {
            extractBasicKeywords(content)
        }

        val regexData = regexExtractor.extract(content)
        repository.updateTags(documentId, tags)
        repository.updatePii(documentId, regexData.hasPii)
    }

    private fun extractBasicKeywords(content: String): String {
        return rakeExtractor.extract(content).take(10).joinToString(",")
    }
}
package com.organizatext.nlp

import com.organizatext.data.room.DocumentEntity
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class ProcessingResult(
    val entity: DocumentEntity,
    val isSuccess: Boolean,
    val errorMessage: String? = null
)

@Singleton
class TextProcessor @Inject constructor(
    private val rakeExtractor: RakeExtractor,
    private val regexExtractor: RegexExtractor
) {
    fun process(
        fileName: String,
        content: String,
        fileSizeBytes: Long = 0L
    ): ProcessingResult {
        return try {
            val words = content.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
            val wordCount = words.size

            val tags = rakeExtractor.extract(content, topN = 10)
            val extraction = regexExtractor.extract(content)

            val entity = DocumentEntity(
                id = UUID.randomUUID().toString(),
                fileName = fileName,
                content = content,
                wordCount = wordCount,
                charCount = content.length,
                category = "Sin categoría",
                tags = tags.joinToString(","),
                urls = extraction.urls.joinToString(","),
                emails = extraction.emails.joinToString(","),
                phones = extraction.phones.joinToString(","),
                hasPii = extraction.hasPii,
                piiTypes = extraction.piiTypes.joinToString(","),
                processedAt = System.currentTimeMillis(),
                fileSizeBytes = fileSizeBytes
            )

            ProcessingResult(entity = entity, isSuccess = true)
        } catch (e: Exception) {
            ProcessingResult(
                entity = DocumentEntity(
                    id = UUID.randomUUID().toString(),
                    fileName = fileName,
                    content = "",
                    wordCount = 0,
                    charCount = 0
                ),
                isSuccess = false,
                errorMessage = e.message
            )
        }
    }

    fun needsUltraMode(content: String): Boolean =
        content.trim().split(Regex("\\s+")).filter { it.isNotBlank() }.size > 500
}
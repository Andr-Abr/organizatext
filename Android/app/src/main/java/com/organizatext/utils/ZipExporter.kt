package com.organizatext.utils

import android.content.Context
import android.net.Uri
import com.organizatext.data.room.DocumentEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.BufferedOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ZipExporter @Inject constructor(
    @ApplicationContext private val context: Context
) {
    fun exportToUri(
        documents: List<DocumentEntity>,
        destinationUri: Uri
    ): Result<Int> {
        return try {
            val contentResolver = context.contentResolver
            contentResolver.openOutputStream(destinationUri)?.use { outputStream ->
                ZipOutputStream(BufferedOutputStream(outputStream)).use { zip ->

                    val byCategory = documents.groupBy {
                        sanitizeFolderName(it.category)
                    }

                    byCategory.forEach { (category, docs) ->
                        docs.forEach { doc ->
                            val entryName = "$category/${doc.fileName}"
                            zip.putNextEntry(ZipEntry(entryName))
                            zip.write(doc.content.toByteArray(Charsets.UTF_8))
                            zip.closeEntry()
                        }
                    }

                    val metadata = buildMetadataText(documents)
                    zip.putNextEntry(ZipEntry("metadata.txt"))
                    zip.write(metadata.toByteArray(Charsets.UTF_8))
                    zip.closeEntry()
                }
            }
            Result.success(documents.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun sanitizeFolderName(name: String): String =
        name.replace(Regex("[<>:\"/\\\\|?*]"), "_")
            .trim()
            .ifEmpty { "Sin_categoria" }

    private fun buildMetadataText(documents: List<DocumentEntity>): String {
        val sb = StringBuilder()
        sb.appendLine("Organizatext — Exportación")
        sb.appendLine("Total archivos: ${documents.size}")
        sb.appendLine("=".repeat(40))
        documents.forEach { doc ->
            sb.appendLine("\nArchivo: ${doc.fileName}")
            sb.appendLine("Categoría: ${doc.category}")
            sb.appendLine("Palabras: ${doc.wordCount}")
            sb.appendLine("Tags: ${doc.tags}")
            if (doc.hasPii) sb.appendLine("⚠ PII detectado: ${doc.piiTypes}")
        }
        return sb.toString()
    }
}
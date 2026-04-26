package com.organizatext.utils

import android.content.Context
import android.net.Uri
import javax.inject.Inject
import javax.inject.Singleton

data class ReadResult(
    val fileName: String,
    val content: String,
    val sizeBytes: Long
)

@Singleton
class TxtFileReader @Inject constructor(
    @dagger.hilt.android.qualifiers.ApplicationContext
    private val context: Context
) {
    fun read(uri: Uri): ReadResult? {
        return try {
            val contentResolver = context.contentResolver
            val fileName = resolveFileName(uri) ?: "archivo_sin_nombre.txt"
            val sizeBytes = resolveFileSize(uri)
            val content = contentResolver.openInputStream(uri)?.use { stream ->
                stream.bufferedReader(Charsets.UTF_8).readText()
            } ?: return null

            ReadResult(
                fileName = fileName,
                content = content,
                sizeBytes = sizeBytes
            )
        } catch (e: Exception) {
            null
        }
    }

    fun readMultiple(uris: List<Uri>): List<ReadResult> =
        uris.mapNotNull { read(it) }

    private fun resolveFileName(uri: Uri): String? {
        var name: String? = null
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(
                android.provider.OpenableColumns.DISPLAY_NAME
            )
            if (cursor.moveToFirst() && nameIndex >= 0) {
                name = cursor.getString(nameIndex)
            }
        }
        return name ?: uri.lastPathSegment
    }

    private fun resolveFileSize(uri: Uri): Long {
        var size = 0L
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)
            if (cursor.moveToFirst() && sizeIndex >= 0) {
                size = cursor.getLong(sizeIndex)
            }
        }
        return size
    }
}
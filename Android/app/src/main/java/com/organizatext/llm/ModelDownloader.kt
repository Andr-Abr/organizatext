package com.organizatext.llm

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

data class DownloadProgress(
    val bytesDownloaded: Long,
    val totalBytes: Long,
    val percentage: Int,
    val isComplete: Boolean = false,
    val error: String? = null
)

sealed class ModelInfo(
    val id: String,
    val displayName: String,
    val fileName: String,
    val downloadUrl: String,
    val sizeBytes: Long,
    val ramRequiredGb: Double,
    val hfRepoUrl: String,
    val mode: ModelMode
) {
    enum class ModelMode { COMPACT, ULTRA, MYTHIC, HAX }

    object Qwen25_0_5B : ModelInfo(
        id = "qwen25_0_5b",
        displayName = "Qwen 2.5 0.5B",
        fileName = "Qwen2.5-0.5B-Instruct_multi-prefill-seq_q8_ekv1280.task",
        downloadUrl = "https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct/resolve/main/Qwen2.5-0.5B-Instruct_multi-prefill-seq_q8_ekv1280.task",
        sizeBytes = 550_000_000L,
        ramRequiredGb = 1.0,
        hfRepoUrl = "https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct",
        mode = ModelMode.COMPACT
    )

    object Gemma3_1B : ModelInfo(
        id = "gemma3_1b",
        displayName = "Gemma 3 1B",
        fileName = "gemma3-1b-it-int4.task",
        downloadUrl = "https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4.task",
        sizeBytes = 560_000_000L,
        ramRequiredGb = 2.0,
        hfRepoUrl = "https://huggingface.co/litert-community/Gemma3-1B-IT",
        mode = ModelMode.ULTRA
    )

    object Qwen25_1_5B : ModelInfo(
        id = "qwen25_1_5b",
        displayName = "Qwen 2.5 1.5B",
        fileName = "Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv1280.task",
        downloadUrl = "https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct/resolve/main/Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv1280.task",
        sizeBytes = 1_600_000_000L,
        ramRequiredGb = 2.5,
        hfRepoUrl = "https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct",
        mode = ModelMode.MYTHIC
    )


    // NUEVO: MODO HAX - Gemma 4 E4B
    object Gemma4_E4B : ModelInfo(
        id = "gemma4_e4b",
        displayName = "Gemma 4 E4B",
        fileName = "gemma-4-E4B-it-web.task",
        downloadUrl = "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-web.task",
        sizeBytes = 3_180_000_000L,  // ~2.96 GB
        ramRequiredGb = 3.5,
        hfRepoUrl = "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm",
        mode = ModelMode.HAX
    )
}

@Singleton
class ModelDownloader @Inject constructor(
    @ApplicationContext private val context: Context
) {
    val modelsDir: File get() = File(context.filesDir, "llm_models").also { it.mkdirs() }

    fun isModelDownloaded(model: ModelInfo): Boolean =
        File(modelsDir, model.fileName).exists()

    fun getModelPath(model: ModelInfo): String =
        File(modelsDir, model.fileName).absolutePath

    fun getDownloadedModels(): List<ModelInfo> =
        listOf(ModelInfo.Qwen25_0_5B, ModelInfo.Gemma3_1B, ModelInfo.Qwen25_1_5B, ModelInfo.Gemma4_E4B)
            .filter { isModelDownloaded(it) }

    fun downloadModel(model: ModelInfo, hfToken: String = ""): Flow<DownloadProgress> = flow {
        val destFile = File(modelsDir, model.fileName)
        val tempFile = File(modelsDir, "${model.fileName}.tmp")

        try {
            val connection = URL(model.downloadUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 15_000
            connection.readTimeout = 30_000
            connection.instanceFollowRedirects = true
            if (hfToken.isNotBlank()) {
                connection.setRequestProperty("Authorization", "Bearer $hfToken")
            }
            connection.connect()

            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                emit(
                    DownloadProgress(
                        0, 0, 0,
                        error = "Error HTTP ${connection.responseCode} — verificá tu token de Hugging Face"
                    )
                )
                return@flow
            }

            val totalBytes = connection.contentLengthLong
            var bytesDownloaded = 0L

            connection.inputStream.use { input ->
                tempFile.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        bytesDownloaded += bytesRead
                        val percentage = if (totalBytes > 0)
                            ((bytesDownloaded * 100) / totalBytes).toInt()
                        else 0
                        emit(DownloadProgress(bytesDownloaded, totalBytes, percentage))
                    }
                }
            }

            tempFile.renameTo(destFile)
            emit(DownloadProgress(bytesDownloaded, totalBytes, 100, isComplete = true))

        } catch (e: Exception) {
            tempFile.delete()
            emit(DownloadProgress(0, 0, 0, error = e.message ?: "Error desconocido"))
        }
    }.flowOn(Dispatchers.IO)

    fun deleteModel(model: ModelInfo) {
        File(modelsDir, model.fileName).delete()
    }
}

package com.organizatext.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.organizatext.data.repository.DocumentRepository
import com.organizatext.data.room.DocumentEntity
import com.organizatext.domain.usecases.ProcessDocumentUseCase
import com.organizatext.hardware.HardwareDetector
import com.organizatext.nlp.TextProcessor
import com.organizatext.utils.TxtFileReader
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ProcessorUiState(
    val isProcessing: Boolean = false,
    val currentFile: String = "",
    val processedCount: Int = 0,
    val totalCount: Int = 0,
    val successCount: Int = 0,
    val errorCount: Int = 0,
    val showUltraSuggestion: Boolean = false,
    val ultraAvailable: Boolean = false,
    val lastError: String? = null
)

@HiltViewModel
class ProcessorViewModel @Inject constructor(
    private val processDocumentUseCase: ProcessDocumentUseCase,
    private val txtFileReader: TxtFileReader,
    private val textProcessor: TextProcessor,
    private val repository: DocumentRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProcessorUiState())
    val uiState: StateFlow<ProcessorUiState> = _uiState

    init {
        _uiState.update {
            it.copy(ultraAvailable = HardwareDetector.supportsUltraMode(context))
        }
    }

    fun processFiles(uris: List<Uri>) {
        viewModelScope.launch {
            val readResults = txtFileReader.readMultiple(uris)
            if (readResults.isEmpty()) return@launch

            val needsUltra = readResults.any { textProcessor.needsUltraMode(it.content) }

            _uiState.update {
                it.copy(
                    isProcessing = true,
                    totalCount = readResults.size,
                    processedCount = 0,
                    successCount = 0,
                    errorCount = 0,
                    showUltraSuggestion = needsUltra && it.ultraAvailable,
                    lastError = null
                )
            }

            var successCount = 0
            var errorCount = 0

            readResults.forEachIndexed { index, fileData ->
                _uiState.update { state ->
                    state.copy(
                        processedCount = index + 1,
                        currentFile = fileData.fileName
                    )
                }
                try {
                    val documentId = UUID.randomUUID().toString()
                    val entity = DocumentEntity(
                        id = documentId,
                        fileName = fileData.fileName,
                        content = fileData.content,
                        wordCount = fileData.content.split(Regex("\\s+"))
                            .filter { it.isNotBlank() }.size,
                        charCount = fileData.content.length,
                        fileSizeBytes = fileData.sizeBytes,
                        tags = "",
                        category = "Sin categoría",
                        hasPii = false
                    )
                    repository.save(entity)
                    processDocumentUseCase(documentId, fileData.content, fileData.fileName)
                    successCount++
                } catch (e: Exception) {
                    errorCount++
                }
            }

            _uiState.update {
                it.copy(
                    isProcessing = false,
                    currentFile = "",
                    successCount = successCount,
                    errorCount = errorCount
                )
            }
        }
    }

    fun dismissUltraSuggestion() {
        _uiState.update { it.copy(showUltraSuggestion = false) }
    }

    fun clearState() {
        _uiState.update {
            it.copy(
                processedCount = 0,
                totalCount = 0,
                successCount = 0,
                errorCount = 0,
                lastError = null
            )
        }
    }
}
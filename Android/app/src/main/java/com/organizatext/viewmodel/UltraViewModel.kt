package com.organizatext.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.organizatext.data.prefs.UserPreferences
import com.organizatext.data.room.DocumentEntity
import com.organizatext.llm.DownloadProgress
import com.organizatext.llm.LlmResult
import com.organizatext.llm.MediaPipeLlmEngine
import com.organizatext.llm.ModelDownloader
import com.organizatext.llm.ModelInfo
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UltraUiState(
    val availableModels: List<ModelInfo> = listOf(
        ModelInfo.Qwen25_0_5B,
        ModelInfo.Gemma3_1B,
        ModelInfo.Qwen25_1_5B,
        ModelInfo.Gemma4_E4B
    ),
    val downloadedModels: List<ModelInfo> = emptyList(),
    val selectedModel: ModelInfo? = null,
    val isModelLoaded: Boolean = false,
    val isDownloading: Boolean = false,
    val downloadingModelId: String? = null,
    val downloadProgress: DownloadProgress? = null,
    val isProcessing: Boolean = false,
    val lastResult: String? = null,
    val errorMessage: String? = null,
    val hfToken: String = "",
    val isAutoCategorizing: Boolean = false,
    val autoCategorizeProgress: String = ""
)

@HiltViewModel
class UltraViewModel @Inject constructor(
    private val llmEngine: MediaPipeLlmEngine,
    private val modelDownloader: ModelDownloader,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(UltraUiState())
    val uiState: StateFlow<UltraUiState> = _uiState

    init {
        refreshDownloadedModels()
        viewModelScope.launch {
            userPreferences.hfToken.collect { token ->
                _uiState.update { it.copy(hfToken = token) }
            }
        }
        val loadedId = llmEngine.getLoadedModelId()
        if (loadedId != null) {
            val loadedModel = listOf(
                ModelInfo.Qwen25_0_5B,
                ModelInfo.Gemma3_1B,
                ModelInfo.Qwen25_1_5B,
                ModelInfo.Gemma4_E4B
            ).firstOrNull { it.id == loadedId }
            _uiState.update {
                it.copy(isModelLoaded = true, selectedModel = loadedModel)
            }
        }
    }

    fun refreshDownloadedModels() {
        val downloaded = modelDownloader.getDownloadedModels()
        _uiState.update { it.copy(downloadedModels = downloaded) }
    }

    fun selectModel(model: ModelInfo) {
        _uiState.update { it.copy(selectedModel = model, errorMessage = null) }
    }

    fun saveHfToken(token: String) {
        viewModelScope.launch {
            userPreferences.setHfToken(token)
        }
    }

    fun downloadModel(model: ModelInfo) {
        viewModelScope.launch {
            val token = userPreferences.hfToken.first()
            _uiState.update {
                it.copy(
                    isDownloading = true,
                    downloadingModelId = model.id,
                    errorMessage = null
                )
            }
            modelDownloader.downloadModel(model, token).collect { progress ->
                _uiState.update { it.copy(downloadProgress = progress) }
                if (progress.isComplete) {
                    refreshDownloadedModels()
                    _uiState.update {
                        it.copy(
                            isDownloading = false,
                            downloadingModelId = null,
                            downloadProgress = null
                        )
                    }
                }
                if (progress.error != null) {
                    _uiState.update {
                        it.copy(
                            isDownloading = false,
                            downloadingModelId = null,
                            downloadProgress = null,
                            errorMessage = progress.error
                        )
                    }
                }
            }
        }
    }

    fun loadModel(model: ModelInfo) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, errorMessage = null) }
            val result = llmEngine.loadModel(model)
            result.fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isModelLoaded = true,
                            isProcessing = false,
                            selectedModel = model
                        )
                    }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(
                            isModelLoaded = false,
                            isProcessing = false,
                            errorMessage = "Error cargando modelo: ${e.message}"
                        )
                    }
                }
            )
        }
    }

    fun extractKeywords(text: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, errorMessage = null) }
            when (val result = llmEngine.extractKeywords(text)) {
                is LlmResult.Success -> {
                    _uiState.update {
                        it.copy(isProcessing = false, lastResult = result.response)
                    }
                }
                is LlmResult.Error -> {
                    _uiState.update {
                        it.copy(isProcessing = false, errorMessage = result.message)
                    }
                }
            }
        }
    }

    fun autoCategorize(
        documents: List<DocumentEntity>,
        availableCategories: List<String>,
        onAssign: (documentId: String, category: String) -> Unit
    ) {
        viewModelScope.launch {
            if (!llmEngine.isLoaded()) return@launch

            val validCategories = availableCategories.filter { it != "Sin categoría" }
            if (validCategories.isEmpty()) return@launch

            val docsToProcess = documents.filter {
                it.category == "Sin categoría" && it.tags.isNotBlank()
            }
            if (docsToProcess.isEmpty()) return@launch

            _uiState.update {
                it.copy(
                    isAutoCategorizing = true,
                    autoCategorizeProgress = "0/${docsToProcess.size}"
                )
            }

            docsToProcess.forEachIndexed { index, doc ->
                _uiState.update {
                    it.copy(
                        autoCategorizeProgress = "${index + 1}/${docsToProcess.size}"
                    )
                }

                val keywords = doc.tags.split(",")
                    .map { it.trim() }
                    .filter { it.isNotBlank() }

                val prompt = """Categorías disponibles: ${validCategories.joinToString(", ")}

Documento: "${doc.fileName}"
Keywords: ${keywords.joinToString(", ")}

Respondé ÚNICAMENTE con el nombre exacto de una categoría de la lista. Si ninguna encaja, respondé: Sin categoría"""

                when (val result = llmEngine.chat(prompt)) {
                    is LlmResult.Success -> {
                        val suggested = result.response
                            .trim()
                            .lines()
                            .firstOrNull { it.isNotBlank() }
                            ?.trim() ?: ""

                        val matched = validCategories.firstOrNull {
                            it.equals(suggested, ignoreCase = true)
                        }
                        if (matched != null) {
                            onAssign(doc.id, matched)
                        }
                    }
                    is LlmResult.Error -> { /* mantiene en Sin categoría */ }
                }
            }

            _uiState.update {
                it.copy(
                    isAutoCategorizing = false,
                    autoCategorizeProgress = ""
                )
            }
        }
    }

    fun unloadModel() {
        llmEngine.unload()
        _uiState.update { it.copy(isModelLoaded = false) }
    }

    fun deleteModel(model: ModelInfo) {
        modelDownloader.deleteModel(model)
        refreshDownloadedModels()
        if (_uiState.value.selectedModel?.id == model.id) {
            unloadModel()
            _uiState.update { it.copy(selectedModel = null) }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    override fun onCleared() {
        super.onCleared()
        // No descargar el modelo aquí — debe persistir entre navegaciones
        // El usuario lo libera explícitamente con el botón "Liberar de memoria"
    }
}
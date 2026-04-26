package com.organizatext.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.organizatext.data.room.DocumentEntity
import com.organizatext.llm.LlmResult
import com.organizatext.llm.MediaPipeLlmEngine
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatMessage(
    val text: String,
    val isUser: Boolean
)

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isThinking: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val llmEngine: MediaPipeLlmEngine
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState

    private var contextSummary: String = ""

    fun setDocumentContext(documents: List<DocumentEntity>) {
        contextSummary = buildContextSummary(documents)
    }

    fun sendMessage(userMessage: String) {
        if (userMessage.isBlank()) return

        _uiState.update {
            it.copy(
                messages = it.messages + ChatMessage(userMessage, isUser = true),
                isThinking = true,
                errorMessage = null
            )
        }

        viewModelScope.launch {
            val prompt = buildPrompt(userMessage)
            when (val result = llmEngine.chat(prompt)) {
                is LlmResult.Success -> {
                    _uiState.update {
                        it.copy(
                            messages = it.messages + ChatMessage(result.response, isUser = false),
                            isThinking = false
                        )
                    }
                }
                is LlmResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isThinking = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    private fun buildContextSummary(documents: List<DocumentEntity>): String {
        val docs = documents.joinToString(", ") { doc ->
            val tags = doc.tags.takeIf { it.isNotBlank() } ?: "sin tags"
            val pii = if (doc.hasPii) " ⚠PII" else ""
            "\"${doc.fileName}\" [${doc.category}, tags: $tags, ${doc.wordCount} palabras$pii]"
        }
        return "Documentos (${documents.size}): $docs"
    }

    private fun buildPrompt(userMessage: String): String {
        val history = _uiState.value.messages
            .takeLast(6) // últimas 3 rondas para no saturar el contexto
            .joinToString("\n") { msg ->
                if (msg.isUser) "Usuario: ${msg.text}"
                else "Asistente: ${msg.text}"
            }

        return """Eres un asistente que analiza documentos de texto. Responde en español, de forma concisa.

Contexto: $contextSummary

${if (history.isNotEmpty()) "Conversación previa:\n$history\n" else ""}Usuario: $userMessage
Asistente:"""
    }
}
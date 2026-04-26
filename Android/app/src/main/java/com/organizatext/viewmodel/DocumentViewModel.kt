package com.organizatext.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.organizatext.data.prefs.UserPreferences
import com.organizatext.data.repository.DocumentRepository
import com.organizatext.data.room.DocumentEntity
import com.organizatext.domain.usecases.AssignCategoryUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DocumentUiState(
    val documents: List<DocumentEntity> = emptyList(),
    val categories: List<String> = emptyList(),
    val selectedCategory: String? = null,
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DocumentViewModel @Inject constructor(
    private val repository: DocumentRepository,
    private val assignCategoryUseCase: AssignCategoryUseCase,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(DocumentUiState())
    val uiState: StateFlow<DocumentUiState> = _uiState

    val allDocuments: StateFlow<List<DocumentEntity>> = repository
        .getAllDocuments()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allCategories: StateFlow<List<String>> = repository
        .getAllCategories()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val customCategories: StateFlow<List<String>> = userPreferences
        .customCategories
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun assignCategory(documentId: String, category: String) {
        viewModelScope.launch {
            assignCategoryUseCase(documentId, category)
        }
    }

    fun assignTags(documentId: String, tags: List<String>) {
        viewModelScope.launch {
            assignCategoryUseCase.assignTags(documentId, tags)
        }
    }

    fun deleteDocument(documentId: String) {
        viewModelScope.launch {
            repository.deleteById(documentId)
        }
    }

    fun deleteAll() {
        viewModelScope.launch {
            repository.deleteAll()
        }
    }

    fun addCustomCategory(category: String) {
        viewModelScope.launch {
            userPreferences.addCustomCategory(category)
        }
    }

    fun removeCustomCategory(category: String) {
        viewModelScope.launch {
            userPreferences.removeCustomCategory(category)
        }
    }

    fun setError(message: String?) {
        _uiState.update { it.copy(errorMessage = message) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
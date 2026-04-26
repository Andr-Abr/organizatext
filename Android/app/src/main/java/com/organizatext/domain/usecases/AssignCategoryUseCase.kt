package com.organizatext.domain.usecases

import com.organizatext.data.repository.DocumentRepository
import javax.inject.Inject

class AssignCategoryUseCase @Inject constructor(
    private val repository: DocumentRepository
) {
    suspend operator fun invoke(documentId: String, category: String) {
        val document = repository.getById(documentId) ?: return
        repository.update(document.copy(category = category))
    }

    suspend fun assignTags(documentId: String, tags: List<String>) {
        val document = repository.getById(documentId) ?: return
        repository.update(document.copy(tags = tags.joinToString(",")))
    }

    suspend fun assignCategoryAndTags(
        documentId: String,
        category: String,
        tags: List<String>
    ) {
        val document = repository.getById(documentId) ?: return
        repository.update(
            document.copy(
                category = category,
                tags = tags.joinToString(",")
            )
        )
    }
}
package com.organizatext.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.organizatext.ui.components.FileCard
import com.organizatext.ui.components.UltraSuggestionBanner
import com.organizatext.viewmodel.DocumentViewModel
import com.organizatext.viewmodel.ProcessorViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToViewer: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToCategories: () -> Unit,
    documentViewModel: DocumentViewModel = hiltViewModel(),
    processorViewModel: ProcessorViewModel = hiltViewModel()
) {
    val documents by documentViewModel.allDocuments.collectAsState()
    val processorState by processorViewModel.uiState.collectAsState()
    val customCategories by documentViewModel.customCategories.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var editingKeywordsDocId by remember { mutableStateOf<String?>(null) }
    var keywordsInput by remember { mutableStateOf("") }

    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) processorViewModel.processFiles(uris)
    }

    LaunchedEffect(processorState.successCount) {
        if (processorState.successCount > 0 && !processorState.isProcessing) {
            snackbarHostState.showSnackbar("${processorState.successCount} archivo(s) procesado(s)")
            processorViewModel.clearState()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Organizatext") },
                actions = {
                    IconButton(onClick = onNavigateToCategories) {
                        Icon(Icons.Default.Category, contentDescription = "Categorías")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Ajustes")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { filePicker.launch(arrayOf("text/plain")) },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Cargar .txt") }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (processorState.isProcessing) {
                LinearProgressIndicator(
                    progress = {
                        if (processorState.totalCount > 0)
                            processorState.processedCount.toFloat() / processorState.totalCount
                        else 0f
                    },
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = "Procesando ${processorState.currentFile}... " +
                            "${processorState.processedCount}/${processorState.totalCount}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            if (processorState.showUltraSuggestion) {
                UltraSuggestionBanner(
                    onDismiss = { processorViewModel.dismissUltraSuggestion() }
                )
            }

            if (documents.isEmpty() && !processorState.isProcessing) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No hay archivos procesados.\nTocá + para cargar archivos .txt",
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(items = documents, key = { it.id }) { document ->
                        FileCard(
                            document = document,
                            onViewClick = { onNavigateToViewer(document.id) },
                            onDeleteClick = { documentViewModel.deleteDocument(document.id) },
                            onCategoryChange = { newCategory ->
                                documentViewModel.assignCategory(document.id, newCategory)
                            },
                            onEditKeywords = {
                                editingKeywordsDocId = document.id
                                keywordsInput = document.tags
                            },
                            customCategories = customCategories
                        )
                    }
                }
            }
        }

        editingKeywordsDocId?.let { docId ->
            AlertDialog(
                onDismissRequest = { editingKeywordsDocId = null },
                title = { Text("Editar keywords") },
                text = {
                    Column {
                        Text(
                            text = "Separadas por coma",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        OutlinedTextField(
                            value = keywordsInput,
                            onValueChange = { keywordsInput = it },
                            label = { Text("Keywords") },
                            minLines = 3
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        val tags = keywordsInput
                            .split(",")
                            .map { it.trim() }
                            .filter { it.isNotEmpty() }
                        documentViewModel.assignTags(docId, tags)
                        editingKeywordsDocId = null
                    }) {
                        Text("Guardar")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { editingKeywordsDocId = null }) {
                        Text("Cancelar")
                    }
                }
            )
        }
    }
}
package com.organizatext.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.organizatext.data.room.DocumentEntity
import com.organizatext.viewmodel.CategoryZipViewModel
import com.organizatext.viewmodel.DocumentViewModel
import com.organizatext.viewmodel.UltraViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryScreen(
    onNavigateBack: () -> Unit,
    onNavigateToViewer: (String) -> Unit,
    onNavigateToChat: (List<DocumentEntity>) -> Unit,
    documentViewModel: DocumentViewModel = hiltViewModel(),
    categoryZipViewModel: CategoryZipViewModel = hiltViewModel(),
    ultraViewModel: UltraViewModel = hiltViewModel()
) {
    val ultraState by ultraViewModel.uiState.collectAsState()
    val zipExporter = categoryZipViewModel.zipExporter

    val documents by documentViewModel.allDocuments.collectAsState()
    val dbCategories by documentViewModel.allCategories.collectAsState()
    val customCategories by documentViewModel.customCategories.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val allCategories = remember(dbCategories, customCategories) {
        (listOf("Sin categoría") + customCategories + dbCategories)
            .distinct()
            .sortedWith(compareBy { if (it == "Sin categoría") "" else it })
    }

    var expandedCategories by remember { mutableStateOf(setOf<String>()) }
    var selectedCategories by remember { mutableStateOf(setOf<String>()) }
    var selectedDocIds by remember { mutableStateOf(setOf<String>()) }
    var showNewCategoryDialog by remember { mutableStateOf(false) }
    var showMoveDialog by remember { mutableStateOf(false) }
    var newCategoryName by remember { mutableStateOf("") }

    var zipDestinationUri by remember { mutableStateOf<Uri?>(null) }
    var pendingExportCategory by remember { mutableStateOf<String?>(null) }

    val zipLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/zip")
    ) { uri ->
        uri?.let { dest ->
            val category = pendingExportCategory ?: return@let
            val docsToExport = documents.filter { it.category == category }
            scope.launch {
                val result = zipExporter.exportToUri(docsToExport, dest)
                result.fold(
                    onSuccess = { count ->
                        snackbarHostState.showSnackbar("$count archivo(s) exportados")
                    },
                    onFailure = {
                        snackbarHostState.showSnackbar("Error al exportar: ${it.message}")
                    }
                )
                pendingExportCategory = null
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Categorías") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                },
                actions = {
                    // NUEVO: Botón para eliminar documentos seleccionados
                    if (selectedDocIds.isNotEmpty()) {
                        IconButton(onClick = {
                            scope.launch {
                                selectedDocIds.forEach { docId ->
                                    documentViewModel.deleteDocument(docId)
                                }
                                val count = selectedDocIds.size
                                selectedDocIds = emptySet()
                                snackbarHostState.showSnackbar("$count documento(s) eliminado(s)")
                            }
                        }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Eliminar documentos",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }

                    // Botón existente para eliminar categorías
                    if (selectedCategories.isNotEmpty()) {
                        IconButton(onClick = {
                            selectedCategories.forEach { cat ->
                                documents.filter { it.category == cat }.forEach { doc ->
                                    documentViewModel.assignCategory(doc.id, "Sin categoría")
                                }
                                documentViewModel.removeCustomCategory(cat)
                            }
                            selectedCategories = emptySet()
                            scope.launch {
                                snackbarHostState.showSnackbar("Categorías eliminadas")
                            }
                        }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Eliminar categorías"
                            )
                        }
                    }

                    // NUEVO: Botón para mover documentos (ya existente, solo reubicado)
                    if (selectedDocIds.isNotEmpty()) {
                        IconButton(onClick = { showMoveDialog = true }) {
                            Icon(
                                Icons.Default.KeyboardArrowDown,
                                contentDescription = "Mover documentos"
                            )
                        }

                        val selectedDocs = documents.filter { it.id in selectedDocIds }
                        IconButton(
                            onClick = {
                                if (!ultraState.isModelLoaded) {
                                    scope.launch {
                                        snackbarHostState.showSnackbar(
                                            "Cargá un modelo en Ajustes para usar el chat"
                                        )
                                    }
                                } else {
                                    onNavigateToChat(selectedDocs)
                                }
                            }
                        ) {
                            Icon(
                                Icons.Default.ChatBubbleOutline,
                                contentDescription = "Chat con documentos"
                            )
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showNewCategoryDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Nueva categoría")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (allCategories.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No hay categorías.\nTocá + para crear una.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(padding)
            ) {
                items(allCategories) { category ->
                    val docsInCategory = documents.filter { it.category == category }
                    val isExpanded = category in expandedCategories
                    val isSelected = category in selectedCategories

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected)
                                MaterialTheme.colorScheme.secondaryContainer
                            else
                                MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = isSelected,
                                    onCheckedChange = {
                                        selectedCategories = if (it)
                                            selectedCategories + category
                                        else
                                            selectedCategories - category
                                    }
                                )
                                Text(
                                    text = category,
                                    style = MaterialTheme.typography.titleSmall,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "${docsInCategory.size} docs",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                IconButton(onClick = {
                                    pendingExportCategory = category
                                    zipLauncher.launch("$category.zip")
                                }) {
                                    Icon(
                                        Icons.Default.Download,
                                        contentDescription = "Exportar ZIP"
                                    )
                                }
                                IconButton(onClick = {
                                    expandedCategories = if (isExpanded)
                                        expandedCategories - category
                                    else
                                        expandedCategories + category
                                }) {
                                    Icon(
                                        if (isExpanded) Icons.Default.KeyboardArrowUp
                                        else Icons.Default.KeyboardArrowDown,
                                        contentDescription = null
                                    )
                                }
                            }

                            if (isExpanded) {
                                if (docsInCategory.isEmpty()) {
                                    Text(
                                        text = "Sin documentos asignados",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(
                                            start = 56.dp, bottom = 8.dp
                                        )
                                    )
                                } else {
                                    Column(
                                        modifier = Modifier.padding(
                                            start = 16.dp, end = 8.dp, bottom = 8.dp
                                        )
                                    ) {
                                        docsInCategory.forEach { doc ->
                                            val isDocSelected = doc.id in selectedDocIds
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Checkbox(
                                                    checked = isDocSelected,
                                                    onCheckedChange = {
                                                        selectedDocIds = if (it)
                                                            selectedDocIds + doc.id
                                                        else
                                                            selectedDocIds - doc.id
                                                    }
                                                )
                                                Text(
                                                    text = doc.fileName,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                TextButton(
                                                    onClick = { onNavigateToViewer(doc.id) }
                                                ) {
                                                    Text("Ver")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showNewCategoryDialog) {
            AlertDialog(
                onDismissRequest = {
                    showNewCategoryDialog = false
                    newCategoryName = ""
                },
                title = { Text("Nueva categoría") },
                text = {
                    OutlinedTextField(
                        value = newCategoryName,
                        onValueChange = { newCategoryName = it },
                        label = { Text("Nombre") },
                        singleLine = true
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        val trimmed = newCategoryName.trim()
                        if (trimmed.isNotEmpty() && trimmed !in allCategories) {
                            documentViewModel.addCustomCategory(trimmed)
                            scope.launch {
                                snackbarHostState.showSnackbar("Categoría '$trimmed' creada")
                            }
                        }
                        showNewCategoryDialog = false
                        newCategoryName = ""
                    }) {
                        Text("Crear")
                    }
                },
                dismissButton = {
                    TextButton(onClick = {
                        showNewCategoryDialog = false
                        newCategoryName = ""
                    }) {
                        Text("Cancelar")
                    }
                }
            )
        }

        if (showMoveDialog) {
            var targetCategory by remember { mutableStateOf("") }
            AlertDialog(
                onDismissRequest = { showMoveDialog = false },
                title = { Text("Mover ${selectedDocIds.size} documento(s) a...") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        allCategories.forEach { cat ->
                            TextButton(
                                onClick = { targetCategory = cat },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = cat,
                                    color = if (targetCategory == cat)
                                        MaterialTheme.colorScheme.primary
                                    else
                                        MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            if (targetCategory.isNotEmpty()) {
                                selectedDocIds.forEach { docId ->
                                    documentViewModel.assignCategory(docId, targetCategory)
                                }
                                scope.launch {
                                    snackbarHostState.showSnackbar(
                                        "${selectedDocIds.size} docs movidos a '$targetCategory'"
                                    )
                                }
                                selectedDocIds = emptySet()
                                showMoveDialog = false
                            }
                        },
                        enabled = targetCategory.isNotEmpty()
                    ) {
                        Text("Mover")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showMoveDialog = false }) {
                        Text("Cancelar")
                    }
                }
            )
        }
    }
}
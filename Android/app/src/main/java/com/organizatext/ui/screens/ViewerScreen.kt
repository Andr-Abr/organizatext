package com.organizatext.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DriveFileRenameOutline
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.organizatext.viewmodel.DocumentViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewerScreen(
    documentId: String,
    onNavigateBack: () -> Unit,
    documentViewModel: DocumentViewModel = hiltViewModel()
) {
    val documents by documentViewModel.allDocuments.collectAsState()
    val document = documents.find { it.id == documentId }
    var searchQuery by remember { mutableStateOf("") }
    var currentMatchIndex by remember { mutableIntStateOf(0) }
    val scrollState = rememberScrollState()
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()

    var showRenameDialog by remember { mutableStateOf(false) }
    var renameInput by remember { mutableStateOf("") }

    val content = document?.content ?: "Documento no encontrado."
    val lineHeightPx = with(density) { 20.sp.toPx() }
    val charsPerLine = 55

    val matchPositions by remember(searchQuery, content) {
        derivedStateOf {
            if (searchQuery.isBlank()) emptyList()
            else {
                val positions = mutableListOf<Int>()
                val lower = content.lowercase()
                val query = searchQuery.lowercase()
                var start = 0
                while (start < content.length) {
                    val idx = lower.indexOf(query, start)
                    if (idx == -1) break
                    positions.add(idx)
                    start = idx + query.length
                }
                positions
            }
        }
    }

    LaunchedEffect(currentMatchIndex, matchPositions) {
        if (matchPositions.isNotEmpty()) {
            val charPos = matchPositions[currentMatchIndex]
            val linesBeforeMatch = content.substring(0, charPos).count { it == '\n' } +
                    (charPos / charsPerLine)
            val scrollTarget = (linesBeforeMatch * lineHeightPx).toInt()
            val scrollValue = (scrollTarget - 200).coerceAtLeast(0)
            scrollState.animateScrollTo(scrollValue)
        }
    }

    val highlightColor = MaterialTheme.colorScheme.primaryContainer
    val highlightTextColor = MaterialTheme.colorScheme.onPrimaryContainer
    val activeHighlightColor = MaterialTheme.colorScheme.primary
    val activeHighlightTextColor = MaterialTheme.colorScheme.onPrimary

    val annotatedText = buildAnnotatedString {
        if (searchQuery.isBlank()) {
            append(content)
        } else {
            val lower = content.lowercase()
            val query = searchQuery.lowercase()
            var start = 0
            var matchCount = 0
            while (start < content.length) {
                val idx = lower.indexOf(query, start)
                if (idx == -1) {
                    append(content.substring(start))
                    break
                }
                append(content.substring(start, idx))
                val isCurrentMatch = matchCount == currentMatchIndex
                withStyle(
                    SpanStyle(
                        background = if (isCurrentMatch) activeHighlightColor
                        else highlightColor,
                        color = if (isCurrentMatch) activeHighlightTextColor
                        else highlightTextColor
                    )
                ) {
                    append(content.substring(idx, idx + searchQuery.length))
                }
                matchCount++
                start = idx + searchQuery.length
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(document?.fileName ?: "Documento") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        renameInput = document?.fileName ?: ""
                        showRenameDialog = true
                    }) {
                        Icon(
                            Icons.Default.DriveFileRenameOutline,
                            contentDescription = "Renombrar"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        currentMatchIndex = 0
                    },
                    placeholder = { Text("Buscar...") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )

                if (matchPositions.isNotEmpty()) {
                    Text(
                        text = "${currentMatchIndex + 1}/${matchPositions.size}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    IconButton(
                        onClick = { if (currentMatchIndex > 0) currentMatchIndex-- },
                        enabled = currentMatchIndex > 0
                    ) {
                        Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Anterior")
                    }
                    IconButton(
                        onClick = {
                            if (currentMatchIndex < matchPositions.size - 1)
                                currentMatchIndex++
                        },
                        enabled = currentMatchIndex < matchPositions.size - 1
                    ) {
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Siguiente")
                    }
                } else if (searchQuery.isNotBlank()) {
                    Text(
                        text = "Sin resultados",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            Box(modifier = Modifier.fillMaxSize()) {
                SelectionContainer {
                    Text(
                        text = annotatedText,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(16.dp)
                    )
                }

                if (scrollState.maxValue > 0) {
                    var isDragging by remember { mutableStateOf(false) }

                    val thumbRatio = scrollState.viewportSize.toFloat() /
                            (scrollState.viewportSize + scrollState.maxValue).toFloat()
                    val thumbHeightFraction = thumbRatio.coerceIn(0.05f, 0.5f)
                    val scrollFraction = if (scrollState.maxValue > 0)
                        scrollState.value.toFloat() / scrollState.maxValue.toFloat()
                    else 0f
                    val trackHeightFraction = 1f - thumbHeightFraction
                    val thumbOffsetFraction = scrollFraction * trackHeightFraction

                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .fillMaxHeight()
                            .width(20.dp)
                            .padding(end = 2.dp, top = 8.dp, bottom = 8.dp)
                            .pointerInput(Unit) {
                                detectVerticalDragGestures(
                                    onDragStart = { isDragging = true },
                                    onDragEnd = { isDragging = false },
                                    onDragCancel = { isDragging = false },
                                    onVerticalDrag = { _, dragAmount ->
                                        val trackHeightPx = size.height.toFloat()
                                        val dragFraction = dragAmount / trackHeightPx
                                        val newScrollValue = (scrollState.value +
                                                dragFraction * scrollState.maxValue)
                                            .toInt()
                                            .coerceIn(0, scrollState.maxValue)
                                        scope.launch {
                                            scrollState.scrollTo(newScrollValue)
                                        }
                                    }
                                )
                            }
                    ) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .fillMaxHeight(thumbOffsetFraction + thumbHeightFraction)
                                .padding(top = with(density) {
                                    (thumbOffsetFraction * scrollState.viewportSize)
                                        .toDp()
                                        .coerceAtLeast(0.dp)
                                })
                                .width(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(
                                    MaterialTheme.colorScheme.onSurface.copy(
                                        alpha = if (isDragging ||
                                            scrollState.isScrollInProgress) 0.8f else 0.4f
                                    )
                                )
                        )
                    }
                }
            }
        }

        if (showRenameDialog) {
            AlertDialog(
                onDismissRequest = { showRenameDialog = false },
                title = { Text("Renombrar archivo") },
                text = {
                    OutlinedTextField(
                        value = renameInput,
                        onValueChange = { renameInput = it },
                        label = { Text("Nombre") },
                        singleLine = true
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        val trimmed = renameInput.trim()
                        if (trimmed.isNotEmpty() && document != null) {
                            documentViewModel.renameDocument(document.id, trimmed)
                        }
                        showRenameDialog = false
                    }) {
                        Text("Guardar")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showRenameDialog = false }) {
                        Text("Cancelar")
                    }
                }
            )
        }
    }
}
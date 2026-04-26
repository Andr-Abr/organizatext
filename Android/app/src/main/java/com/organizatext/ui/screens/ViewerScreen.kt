package com.organizatext.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.organizatext.viewmodel.DocumentViewModel
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.height
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
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

            // En la parte donde está el Text del contenido, reemplazar por:
            Box(
                modifier = Modifier
                    .fillMaxSize()
            ) {
                Text(
                    text = annotatedText,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(16.dp)
                )

                // Scrollbar visual simple
                if (scrollState.maxValue > 0) {
                    val density = LocalDensity.current

                    val thumbHeightPx by remember {
                        derivedStateOf {
                            // Estimación: 20% del viewport como tamaño mínimo del thumb
                            scrollState.viewportSize.toFloat() * 0.2f
                        }
                    }

                    val thumbOffsetPx by remember {
                        derivedStateOf {
                            val scrollableRange = scrollState.maxValue.toFloat()
                            val scrollProgress = scrollState.value / scrollableRange
                            val trackHeight = scrollState.viewportSize.toFloat() - thumbHeightPx
                            scrollProgress * trackHeight
                        }
                    }

                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .fillMaxHeight()
                            .width(8.dp)
                            .padding(end = 2.dp, top = 16.dp, bottom = 16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(y = with(density) { thumbOffsetPx.toDp() })
                                .width(6.dp)
                                .height(with(density) { thumbHeightPx.toDp() })
                                .clip(RoundedCornerShape(3.dp))
                                .background(
                                    MaterialTheme.colorScheme.onSurface.copy(
                                        alpha = if (scrollState.isScrollInProgress) 0.8f else 0.4f
                                    )
                                )
                        )
                    }
                }
            }
        }
    }
}
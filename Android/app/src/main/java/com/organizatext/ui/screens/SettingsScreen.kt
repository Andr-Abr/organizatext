package com.organizatext.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.organizatext.hardware.HardwareDetector
import com.organizatext.llm.ModelInfo
import com.organizatext.viewmodel.UltraViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    ultraViewModel: UltraViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val ultraState by ultraViewModel.uiState.collectAsState()
    var showDeleteConfirm by remember { mutableStateOf<ModelInfo?>(null) }
    var showTokenDialog by remember { mutableStateOf(false) }
    var tokenInput by remember { mutableStateOf("") }
    var tokenVisible by remember { mutableStateOf(false) }

    val availableRamGb = HardwareDetector.availableRamGb(context)
    val supportsCompact = HardwareDetector.supportsCompactMode(context)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ajustes") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Modo básico (NLP local)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "RAKE + expresiones regulares",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "Funciona en todos los dispositivos. Rápido y sin consumo extra.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = "Modelos LLM locales",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "RAM disponible: ${"%.1f".format(availableRamGb)} GB",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    val supportsHax = HardwareDetector.supportsHaxMode(context)
                    val supportsMythic = HardwareDetector.supportsMythicMode(context)
                    val supportsUltra = HardwareDetector.supportsUltraMode(context)
                    val supportsCompact = HardwareDetector.supportsCompactMode(context)

                    Text(
                        text = when {
                            supportsHax -> "✓ Modo HAX disponible (3.5+ GB) - Dispositivo de alta gama"
                            supportsMythic -> "✓ Modo Mítico disponible (2.5+ GB) · Modo HAX requiere más RAM"
                            supportsUltra -> "✓ Modo Ultra disponible (2.0+ GB) · Modos Mítico/HAX requieren más RAM"
                            supportsCompact -> "✓ Modo Compacto disponible (1.0+ GB) · Modos Ultra/Mítico/HAX requieren más RAM"
                            else -> "✗ RAM insuficiente para modelos LLM (mínimo 1 GB libre)"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = when {
                            supportsHax -> Color(0xFFFF6B35)  // Naranja/rojo intenso para HAX
                            supportsMythic -> MaterialTheme.colorScheme.primary
                            supportsUltra -> MaterialTheme.colorScheme.tertiary
                            supportsCompact -> MaterialTheme.colorScheme.secondary
                            else -> MaterialTheme.colorScheme.error
                        },
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            if (supportsCompact) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Token de Hugging Face",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = if (ultraState.hfToken.isNotBlank())
                                        "Token guardado ✓"
                                    else
                                        "Requerido solo para modelos Gemma",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (ultraState.hfToken.isNotBlank())
                                        MaterialTheme.colorScheme.primary
                                    else
                                        MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            TextButton(onClick = {
                                tokenInput = ultraState.hfToken
                                showTokenDialog = true
                            }) {
                                Text(if (ultraState.hfToken.isNotBlank()) "Cambiar" else "Configurar")
                            }
                        }
                        if (ultraState.hfToken.isBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Los modelos Qwen se pueden descargar sin token. Los modelos Gemma (Gemma 3 1B y Gemma 4 E4B) requieren un token de Hugging Face.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                ultraState.availableModels.forEach { model ->
                    val modelSupported = HardwareDetector.supportsModel(context, model)
                    val isDownloaded = ultraState.downloadedModels.any { it.id == model.id }
                    val isLoaded = ultraState.selectedModel?.id == model.id && ultraState.isModelLoaded
                    val isThisDownloading = ultraState.isDownloading &&
                            ultraState.downloadingModelId == model.id

                    val modeLabel = when (model.mode) {
                        ModelInfo.ModelMode.COMPACT -> "Modo Compacto"
                        ModelInfo.ModelMode.ULTRA -> "Modo Ultra"
                        ModelInfo.ModelMode.MYTHIC -> "Modo Mítico"
                        ModelInfo.ModelMode.HAX -> "Modo HAX"
                    }

                    val modeLabelColor = when (model.mode) {
                        ModelInfo.ModelMode.COMPACT -> MaterialTheme.colorScheme.tertiary
                        ModelInfo.ModelMode.ULTRA -> MaterialTheme.colorScheme.primary
                        ModelInfo.ModelMode.MYTHIC -> MaterialTheme.colorScheme.error
                        ModelInfo.ModelMode.HAX -> Color(0xFFFF6B35)  // Color distintivo para HAX
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = when {
                                isLoaded -> MaterialTheme.colorScheme.primaryContainer
                                !modelSupported -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                                else -> MaterialTheme.colorScheme.surface
                            }
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = model.displayName,
                                            style = MaterialTheme.typography.bodyLarge,
                                            fontWeight = FontWeight.Medium
                                        )
                                        Text(
                                            text = modeLabel,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = modeLabelColor,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                    Text(
                                        text = "${"%.0f".format(model.sizeBytes / 1_000_000.0)} MB · RAM mínima: ${"%.1f".format(model.ramRequiredGb)} GB",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (!modelSupported) {
                                        Text(
                                            text = "RAM insuficiente en este momento",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.error
                                        )
                                    }

                                    // Advertencia especial para Gemma 4 E4B
                                    if (model.id == "gemma4_e4b") {
                                        Text(
                                            text = "⚠️ Modelo de alto rendimiento. Solo para dispositivos de gama alta con 8+ GB RAM total.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFFFF6B35),
                                            fontWeight = FontWeight.Medium
                                        )
                                    }

                                    when {
                                        isLoaded -> Text(
                                            text = "✓ Cargado en memoria",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.Medium
                                        )
                                        isDownloaded -> Text(
                                            text = "✓ Descargado",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.tertiary
                                        )
                                    }
                                }

                                if (isDownloaded) {
                                    IconButton(onClick = { showDeleteConfirm = model }) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Eliminar",
                                            tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                } else {
                                    IconButton(
                                        onClick = {
                                            // Pedir token para AMBOS modelos Gemma
                                            if ((model.id == "gemma3_1b" || model.id == "gemma4_e4b") &&
                                                ultraState.hfToken.isBlank()) {
                                                showTokenDialog = true
                                            } else {
                                                ultraViewModel.downloadModel(model)
                                            }
                                        },
                                        enabled = !ultraState.isDownloading && modelSupported
                                    ) {
                                        Icon(
                                            Icons.Default.Download,
                                            contentDescription = "Descargar",
                                            tint = if (modelSupported)
                                                MaterialTheme.colorScheme.onSurface
                                            else
                                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                        )
                                    }
                                }
                            }

                            if (isThisDownloading) {
                                Spacer(modifier = Modifier.height(8.dp))
                                val progress = ultraState.downloadProgress
                                if (progress != null) {
                                    LinearProgressIndicator(
                                        progress = { progress.percentage / 100f },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    Text(
                                        text = "${progress.percentage}% · " +
                                                "${"%.0f".format(progress.bytesDownloaded / 1_000_000.0)} MB / " +
                                                "${"%.0f".format(progress.totalBytes / 1_000_000.0)} MB",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            if (isDownloaded && !isLoaded && modelSupported) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = { ultraViewModel.loadModel(model) },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !ultraState.isProcessing
                                ) {
                                    if (ultraState.isProcessing &&
                                        ultraState.selectedModel?.id == model.id
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.padding(end = 8.dp)
                                        )
                                    }
                                    Text("Cargar modelo")
                                }
                            }

                            if (isLoaded) {
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedButton(
                                    onClick = { ultraViewModel.unloadModel() },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = MaterialTheme.colorScheme.error
                                    )
                                ) {
                                    Text("Liberar de memoria")
                                }
                            }
                        }
                    }
                }

                if (ultraState.errorMessage != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = ultraState.errorMessage!!,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.weight(1f)
                            )
                            TextButton(onClick = { ultraViewModel.clearError() }) {
                                Text("OK")
                            }
                        }
                    }
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Modelos LLM no disponibles",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Text(
                            text = "RAM disponible insuficiente (${"%.1f".format(availableRamGb)} GB). Se requiere mínimo 1 GB libre y Android 10+.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
    }

    if (showTokenDialog) {
        AlertDialog(
            onDismissRequest = { showTokenDialog = false },
            title = { Text("Token de Hugging Face") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Necesitás una cuenta en huggingface.co, aceptar la licencia de los modelos Gemma y generar un token en Settings → Access Tokens (tipo Read).",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = tokenInput,
                        onValueChange = { tokenInput = it },
                        label = { Text("Token HF (hf_...)") },
                        singleLine = true,
                        visualTransformation = if (tokenVisible)
                            VisualTransformation.None
                        else
                            PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password
                        ),
                        trailingIcon = {
                            IconButton(onClick = { tokenVisible = !tokenVisible }) {
                                Icon(
                                    if (tokenVisible) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    contentDescription = null
                                )
                            }
                        }
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    ultraViewModel.saveHfToken(tokenInput.trim())
                    showTokenDialog = false
                }) { Text("Guardar") }
            },
            dismissButton = {
                TextButton(onClick = { showTokenDialog = false }) { Text("Cancelar") }
            }
        )
    }

    showDeleteConfirm?.let { model ->
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Eliminar modelo") },
            text = { Text("¿Eliminar ${model.displayName}? Tendrás que descargarlo de nuevo.") },
            confirmButton = {
                TextButton(onClick = {
                    ultraViewModel.deleteModel(model)
                    showDeleteConfirm = null
                }) { Text("Eliminar", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = null }) { Text("Cancelar") }
            }
        )
    }
}
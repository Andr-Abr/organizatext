package com.organizatext.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.organizatext.data.room.DocumentEntity
import com.organizatext.ui.screens.CategoryScreen
import com.organizatext.ui.screens.ChatScreen
import com.organizatext.ui.screens.HomeScreen
import com.organizatext.ui.screens.SettingsScreen
import com.organizatext.ui.screens.ViewerScreen

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Viewer : Screen("viewer/{documentId}") {
        fun createRoute(documentId: String) = "viewer/$documentId"
    }
    object Categories : Screen("categories")
    object Settings : Screen("settings")
    object Chat : Screen("chat")
}

// Pasamos los documentos en memoria via el NavController's backstack entry
// usando un companion object para evitar serialización
object ChatDocumentHolder {
    var documents: List<DocumentEntity> = emptyList()
}

@Composable
fun OrganizatextNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToViewer = { documentId ->
                    navController.navigate(Screen.Viewer.createRoute(documentId))
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onNavigateToCategories = {
                    navController.navigate(Screen.Categories.route)
                }
            )
        }
        composable(Screen.Viewer.route) { backStackEntry ->
            val documentId = backStackEntry.arguments?.getString("documentId") ?: ""
            ViewerScreen(
                documentId = documentId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Categories.route) {
            CategoryScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToViewer = { documentId ->
                    navController.navigate(Screen.Viewer.createRoute(documentId))
                },
                onNavigateToChat = { documents ->
                    ChatDocumentHolder.documents = documents
                    navController.navigate(Screen.Chat.route)
                }
            )
        }
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Chat.route) {
            ChatScreen(
                documents = ChatDocumentHolder.documents,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
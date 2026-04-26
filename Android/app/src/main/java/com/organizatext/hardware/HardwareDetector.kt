package com.organizatext.hardware

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import com.organizatext.llm.ModelInfo

object HardwareDetector {

    fun isEmulator(): Boolean =
        Build.FINGERPRINT.contains("generic") ||
                Build.FINGERPRINT.contains("emulator") ||
                Build.FINGERPRINT.contains("sdk_gphone") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK") ||
                Build.MODEL.contains("sdk_gphone") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                Build.BRAND.startsWith("generic") ||
                Build.DEVICE.startsWith("generic") ||
                Build.PRODUCT.contains("sdk_gphone") ||
                Build.PRODUCT.contains("emulator") ||
                Build.HARDWARE.contains("goldfish") ||
                Build.HARDWARE.contains("ranchu")

    fun availableRamBytes(context: Context): Long {
        val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val info = ActivityManager.MemoryInfo()
        manager.getMemoryInfo(info)
        return info.availMem
    }

    fun totalRamBytes(context: Context): Long {
        val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val info = ActivityManager.MemoryInfo()
        manager.getMemoryInfo(info)
        return info.totalMem
    }

    fun availableRamGb(context: Context): Double =
        availableRamBytes(context).toDouble() / (1024 * 1024 * 1024)

    fun supportsCompactMode(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        if (isEmulator()) return true
        return availableRamGb(context) >= 1.0
    }

    fun supportsUltraMode(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        if (isEmulator()) return true
        return availableRamGb(context) >= 2.0
    }

    fun supportsMythicMode(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        if (isEmulator()) return true
        return availableRamGb(context) >= 2.5
    }

    fun supportsHaxMode(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        if (isEmulator()) return true
        return availableRamGb(context) >= 3.5
    }

    fun supportsModel(context: Context, model: ModelInfo): Boolean {
        if (isEmulator()) return true
        return availableRamGb(context) >= model.ramRequiredGb
    }

    fun getRecommendedModel(context: Context): ModelInfo? {
        if (!supportsCompactMode(context)) return null
        val ramGb = availableRamGb(context)
        return when {
            ramGb >= 3.5 -> ModelInfo.Gemma4_E4B    // <- Hax
            ramGb >= 2.5 -> ModelInfo.Qwen25_1_5B  // <- Mítico
            ramGb >= 2.0 -> ModelInfo.Gemma3_1B    // <- Ultra
            ramGb >= 1.0 -> ModelInfo.Qwen25_0_5B  // <- Compacto
            else -> null
        }
    }
}
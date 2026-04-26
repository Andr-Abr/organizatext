package com.organizatext.nlp

import javax.inject.Inject
import javax.inject.Singleton

data class ExtractionResult(
    val urls: List<String>,
    val emails: List<String>,
    val phones: List<String>,
    val hasPii: Boolean,
    val piiTypes: List<String>
)

@Singleton
class RegexExtractor @Inject constructor() {

    private val urlRegex = Regex("https?://[^\\s]+")
    private val emailRegex = Regex("[\\w.-]+@[\\w.-]+\\.\\w+")
    private val phoneRegex = Regex("(\\+\\d{1,3}[\\s-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}")
    private val docRegex = Regex("\\b\\d{8,10}\\b")

    fun extract(text: String): ExtractionResult {
        val urls = urlRegex.findAll(text).map { it.value }.distinct().toList()
        val emails = emailRegex.findAll(text).map { it.value }.distinct().toList()
        val phones = phoneRegex.findAll(text).map { it.value }.distinct().toList()

        val piiTypes = mutableListOf<String>()
        if (emails.isNotEmpty()) piiTypes.add("emails")
        if (phones.isNotEmpty()) piiTypes.add("teléfonos")
        if (docRegex.containsMatchIn(text)) piiTypes.add("posibles documentos")

        return ExtractionResult(
            urls = urls,
            emails = emails,
            phones = phones,
            hasPii = piiTypes.isNotEmpty(),
            piiTypes = piiTypes
        )
    }
}
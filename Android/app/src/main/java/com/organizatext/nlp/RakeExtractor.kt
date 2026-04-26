package com.organizatext.nlp

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RakeExtractor @Inject constructor() {

    private val stopwords = setOf(
        "el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber",
        "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo",
        "pero", "más", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese",
        "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy", "sin",
        "vez", "mucho", "saber", "qué", "sobre", "mi", "alguno", "mismo", "yo",
        "también", "hasta", "año", "dos", "querer", "entre", "así", "primero",
        "desde", "grande", "eso", "ni", "nos", "llegar", "pasar", "tiempo", "ella",
        "sí", "día", "uno", "bien", "poco", "deber", "entonces", "poner", "cosa",
        "tanto", "hombre", "parecer", "nuestro", "tan", "donde", "ahora", "parte",
        "después", "vida", "quedar", "siempre", "creer", "hablar", "llevar", "dejar",
        "nada", "cada", "seguir", "menos", "nuevo", "encontrar", "algo", "solo",
        "the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in",
        "to", "of", "for", "with", "this", "that", "it", "be", "as", "by", "are",
        "was", "were", "been", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "from", "not", "its", "also"
    )

    fun extract(text: String, topN: Int = 10): List<String> {
        if (text.isBlank()) return emptyList()

        val normalized = normalize(text)
        val sentences = splitIntoSentences(normalized)
        val candidates = sentences.flatMap { extractCandidates(it) }

        if (candidates.isEmpty()) return emptyList()

        val wordFreq = mutableMapOf<String, Int>()
        val wordDegree = mutableMapOf<String, Int>()

        candidates.forEach { phrase ->
            val words = phrase.split(" ")
            val len = words.size
            words.forEach { word ->
                wordFreq[word] = (wordFreq[word] ?: 0) + 1
                wordDegree[word] = (wordDegree[word] ?: 0) + len
            }
        }

        val wordScores = wordFreq.keys.associateWith { word ->
            (wordDegree[word] ?: 0).toDouble() / (wordFreq[word] ?: 1).toDouble()
        }

        val phraseScores = candidates.associateWith { phrase ->
            val words = phrase.split(" ")
            val score = words.sumOf { wordScores[it] ?: 0.0 }
            val bonus = if (words.size > 1) 1.5 else 1.0
            score * bonus
        }

        return phraseScores.entries
            .sortedByDescending { it.value }
            .take(topN)
            .map { it.key }
    }

    private fun normalize(text: String): String =
        text.lowercase()
            .replace(Regex("[àáâãäå]"), "a")
            .replace(Regex("[èéêë]"), "e")
            .replace(Regex("[ìíîï]"), "i")
            .replace(Regex("[òóôõö]"), "o")
            .replace(Regex("[ùúûü]"), "u")
            .replace(Regex("[ñ]"), "n")
            .replace(Regex("[^a-z0-9\\s]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()

    private fun splitIntoSentences(text: String): List<String> =
        text.split(Regex("[.!?;\\n]+"))
            .map { it.trim() }
            .filter { it.isNotEmpty() }

    private fun extractCandidates(sentence: String): List<String> {
        val words = sentence.split(" ")
        val candidates = mutableListOf<String>()
        val current = mutableListOf<String>()

        words.forEach { word ->
            if (word.length < 2 || stopwords.contains(word)) {
                if (current.isNotEmpty()) {
                    candidates.add(current.joinToString(" "))
                    current.clear()
                }
            } else {
                current.add(word)
            }
        }
        if (current.isNotEmpty()) candidates.add(current.joinToString(" "))

        return candidates
    }
}
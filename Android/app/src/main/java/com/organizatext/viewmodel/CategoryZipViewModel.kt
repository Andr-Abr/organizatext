package com.organizatext.viewmodel

import androidx.lifecycle.ViewModel
import com.organizatext.utils.ZipExporter
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class CategoryZipViewModel @Inject constructor(
    val zipExporter: ZipExporter
) : ViewModel()
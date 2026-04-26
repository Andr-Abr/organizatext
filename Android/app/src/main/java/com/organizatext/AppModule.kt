package com.organizatext

import android.content.Context
import androidx.room.Room
import com.organizatext.data.room.AppDatabase
import com.organizatext.data.room.DocumentDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "organizatext_db"
        ).build()

    @Provides
    @Singleton
    fun provideDocumentDao(database: AppDatabase): DocumentDao =
        database.documentDao()
}
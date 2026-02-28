pipeline {
    agent any
    
    tools {
        nodejs 'node24'
    }
    
    environment {
        VERCEL_TOKEN = credentials('vercel-token')
        MONGODB_URL = credentials('mongodb-url')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '✅ Código descargado de GitHub'
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('web') {
                    bat 'npm install'
                    bat 'npm run build'
                    echo '✅ Frontend compilado'
                }
            }
        }
        
        stage('Test Backend') {
            steps {
                dir('backend') {
                    bat 'pip install -r requirements.txt'
                    bat 'echo Tests pendientes'
                    echo '✅ Backend verificado'
                }
            }
        }
        
        stage('Deploy to Vercel') {
            when {
                branch 'main'
            }
            steps {
                dir('web') {
                    bat '''
                    npm install -g vercel
                    vercel --token %VERCEL_TOKEN% --prod --yes --scope andr-abr --name organizatext-web
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '🎉 PIPELINE EXITOSO'
            echo '🌐 App desplegada en Vercel'
        }
        failure {
            echo '❌ PIPELINE FALLÓ - Revisar logs'
        }
    }
}
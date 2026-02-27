package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

var backendProcess *exec.Cmd

func startBackend() {
	// Buscar backend.exe junto al ejecutable actual
	exePath, err := os.Executable()
	if err != nil {
		log.Println("No se pudo obtener ruta del ejecutable:", err)
		return
	}

	exeDir := filepath.Dir(exePath)
	backendPath := filepath.Join(exeDir, "backend.exe")

	// En desarrollo, buscar en la carpeta actual
	if _, err := os.Stat(backendPath); os.IsNotExist(err) {
		// Obtener directorio de trabajo actual
		wd, _ := os.Getwd()
		backendPath = filepath.Join(wd, "backend.exe")
	}

	log.Println("Iniciando backend desde:", backendPath)

	backendProcess = exec.Command(backendPath)
	backendProcess.Dir = filepath.Dir(backendPath)
	backendProcess.Env = append(os.Environ(), "ENV_FILE="+filepath.Join(filepath.Dir(backendPath), ".env"))
	backendProcess.Stdout = os.Stdout
	backendProcess.Stderr = os.Stderr

	if err := backendProcess.Start(); err != nil {
		log.Println("Error al iniciar backend:", err)
		return
	}

	log.Println("Backend iniciado con PID:", backendProcess.Process.Pid)
}

func waitForBackend() {
	log.Println("Esperando que el backend esté listo...")
	for i := 0; i < 30; i++ {
		resp, err := http.Get("http://localhost:8001/health")
		if err == nil && resp.StatusCode == 200 {
			log.Println("Backend listo!")
			return
		}
		time.Sleep(1 * time.Second)
	}
	log.Println("Backend tardó demasiado, continuando de todas formas...")
}

func stopBackend() {
	if backendProcess != nil && backendProcess.Process != nil {
		log.Println("Cerrando backend...")
		backendProcess.Process.Kill()
	}
}

func main() {
	startBackend()
	waitForBackend()

	app := application.New(application.Options{
		Name:        "Organizatext Desktop",
		Description: "App local para procesamiento de documentos con IA",
		Services: []application.Service{
			application.NewService(&GreetService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Organizatext",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Width:            1200,
		Height:           800,
	})

	err := app.Run()

	stopBackend()

	if err != nil {
		log.Fatal(err)
	}
}

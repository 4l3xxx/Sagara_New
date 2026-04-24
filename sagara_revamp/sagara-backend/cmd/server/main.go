package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"sagara-backend/internal/handler"
	"sagara-backend/pkg/db"
)

func main() {
	// Simple env var for DB connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:alex12345@localhost:5432/sagara_revamp?sslmode=disable"
		log.Println("DATABASE_URL not set, trying to connect with password alex12345 to sagara_revamp")

	}

	database, err := db.Connect(dsn)
	if err != nil {
		log.Printf("Warning: Failed to connect to database: %v. Server will start but DB features may fail.\n", err)
		// For demo purposes, we might proceed or exit.
		// os.Exit(1)
	}
	defer func() {
		if database != nil {
			database.Close()
		}
	}()

	mux := http.NewServeMux()

	// Consultation Handler
	mux.HandleFunc("/api/consultation", handler.CreateConsultationHandler(database))

	// Placeholder Handlers for other specified routes
	mux.HandleFunc("/api/services", func(w http.ResponseWriter, r *http.Request) {
		// Mock implementation
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Implement services logic here"})
	})

	mux.HandleFunc("/api/portfolio", handler.GetPortfolioHandler(database))

	mux.HandleFunc("/api/about", handler.GetAboutSectionHandler(database))

	mux.HandleFunc("/api/stats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Implement stats logic here"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, enableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow specific origins if needed, here allowing all for ease of development
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

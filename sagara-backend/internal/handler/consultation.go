package handler

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func CreateConsultationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			FullName      string `json:"full_name"`
			BusinessEmail string `json:"business_email"`
			ServiceType   string `json:"service_type"`
			Message       string `json:"message"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		id := uuid.New().String()
		query := `
			INSERT INTO consultation_requests (id, full_name, business_email, service_type, message)
			VALUES ($1, $2, $3, $4, $5)
		`
		_, err := db.Exec(query, id, req.FullName, req.BusinessEmail, req.ServiceType, req.Message)
		if err != nil {
			log.Printf("Error saving consultation: %v\n", err)
			http.Error(w, "Failed to save request: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Konsultasi berhasil dikirim", "id": id})
	}
}

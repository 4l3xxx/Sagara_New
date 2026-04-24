package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"sagara-backend/internal/model"
)

func GetAboutSectionHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Example: get section by key from URL? 
		// For simplicity, let's just use a query param or hardcode for now.
		sectionKey := r.URL.Query().Get("key")
		if sectionKey == "" {
			http.Error(w, "Section key is required", http.StatusBadRequest)
			return
		}

		var s model.AboutSection
		var statsJSON []byte
		query := `
			SELECT section_key, title_en, title_id, content_en, content_id, stats 
			FROM about_sections 
			WHERE section_key = $1
		`
		err := db.QueryRow(query, sectionKey).Scan(
			&s.SectionKey, &s.TitleEn, &s.TitleId, &s.ContentEn, &s.ContentId, &statsJSON,
		)
		if err == sql.ErrNoRows {
			http.Error(w, "Section not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if statsJSON != nil {
			json.Unmarshal(statsJSON, &s.Stats)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(s)
	}
}

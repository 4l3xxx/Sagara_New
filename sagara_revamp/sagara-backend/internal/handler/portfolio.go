package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"sagara-backend/internal/model"
)

func GetPortfolioHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`
			SELECT id, title_en, title_id, 
			       COALESCE(subtitle_en, ''), COALESCE(subtitle_id, ''), industry, 
			       description_en, description_id, 
			       COALESCE(impact_en, ''), COALESCE(impact_id, ''), 
			       COALESCE(image_url, ''), COALESCE(case_study_url, ''), is_featured 
			FROM portfolio_items 
			ORDER BY created_at DESC
		`)
		if err != nil {
			http.Error(w, "Failed to fetch portfolio: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()


		var items []model.PortfolioItem
		for rows.Next() {
			var i model.PortfolioItem
			err := rows.Scan(
				&i.ID, &i.TitleEn, &i.TitleId, &i.SubtitleEn, &i.SubtitleId, &i.Industry,
				&i.DescriptionEn, &i.DescriptionId, &i.ImpactEn, &i.ImpactId,
				&i.ImageURL, &i.CaseStudyURL, &i.IsFeatured,
			)
			if err != nil {
				http.Error(w, "Error scanning rows", http.StatusInternalServerError)
				return
			}
			items = append(items, i)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items)
	}
}

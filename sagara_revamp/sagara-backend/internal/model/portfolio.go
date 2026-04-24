package model

type PortfolioItem struct {
	ID            int               `json:"id"`
	TitleEn       string            `json:"title_en"`
	TitleId       string            `json:"title_id"`
	SubtitleEn    string            `json:"subtitle_en"`
	SubtitleId    string            `json:"subtitle_id"`
	Industry      string            `json:"industry"` // healthcare, smart_city, government, etc.
	DescriptionEn string            `json:"description_en"`
	DescriptionId string            `json:"description_id"`
	ImpactEn      string            `json:"impact_en"`
	ImpactId      string            `json:"impact_id"`
	ImageURL      string            `json:"image_url,omitempty"`
	CaseStudyURL  string            `json:"case_study_url,omitempty"`
	IsFeatured    bool              `json:"is_featured"`
}


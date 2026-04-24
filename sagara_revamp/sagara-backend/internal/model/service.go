package model

type Service struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	TargetAudience string `json:"target_audience"` // corporate, sme, government
}

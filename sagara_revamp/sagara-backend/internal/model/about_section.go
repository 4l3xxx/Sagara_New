package model

type AboutSection struct {
	SectionKey string         `json:"section_key"` // e.g., "mission", "smart_village"
	TitleEn    string         `json:"title_en"`
	TitleId    string         `json:"title_id"`
	ContentEn  string         `json:"content_en"`
	ContentId  string         `json:"content_id"`
	Stats      map[string]int `json:"stats,omitempty"` // e.g., {"villages_digitized": 10000}
}


package model

import "time"

type ConsultationRequest struct {
	ID            string `json:"id"`
	FullName      string `json:"full_name"`
	BusinessEmail string `json:"business_email"`
	ServiceType   string `json:"service_type"`
	Message       string `json:"message"`
	Status        string `json:"status"` // default: "new"
	CreatedAt     time.Time
}

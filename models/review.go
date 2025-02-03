package models

import "github.com/google/uuid"

const (
	CHECK  string = "checking"
	ACCEPT string = "accept"
)

type Review struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;constraint:OnDelete:CASCADE"`
	DishID      uuid.UUID `gorm:"type:uuid;not null;constraint:OnDelete:CASCADE"`
	TextMessage string    `gorm:"type:text;not null" json:"text_message"`
	Mark        uint      `gorm:"not null;default:0;check:mark BETWEEN 1 AND 5" json:"mark"`
	Status      string    `gorm:"type:text;not null,default=checking"`
}

package models

import "github.com/google/uuid"

type Checker struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	OrderID     uuid.UUID `gorm:"unique;not null;OnDelete:CASCADE"`
	CodeChecker uint      `gorm:"not null;default:0;primary_key"`
}

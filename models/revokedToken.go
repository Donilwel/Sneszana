package models

import "time"

type RevokedToken struct {
	ID        uint   `gorm:"primaryKey"`
	Token     string `gorm:"unique;not null"`
	CreatedAt time.Time
}

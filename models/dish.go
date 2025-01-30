package models

import "github.com/google/uuid"

type Dish struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name         string    `gorm:"type:varchar(100);not null"`
	Description  string    `gorm:"type:text"`
	Price        float64   `gorm:"type:decimal(10,2);not null"`
	ImageURL     string    `gorm:"type:varchar(255)"`
	Ingredients  string    `gorm:"type:text"`
	RestaurantID uuid.UUID `gorm:"not null"` // Внешний ключ
}

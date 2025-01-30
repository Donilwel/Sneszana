package models

import "github.com/google/uuid"

type Restaurant struct {
	ID       uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name     string    `gorm:"type:varchar(100);not null"`
	Location string    `gorm:"type:varchar(100);not null"`
	Rating   float64   `gorm:"type:decimal(3,2);default:0.0"`
	Menu     []Dish    `gorm:"foreignKey:RestaurantID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

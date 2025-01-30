package models

import "time"

const (
	CREATED         string = "created"
	CANCELED        string = "cancelled"
	COOKING         string = "cooking"
	WAITFREECOURIER string = "waitfreecourier"
	ONTHEWAY        string = "ontheway"
	DELIVERED       string = "delivered"
	CLOSED          string = "closed"
)

type Order struct {
	ID                  uint      `gorm:"primary_key"`
	UserID              uint      `gorm:"not null;OnDelete:CASCADE"`
	CourierID           uint      `gorm:"not null;OnDelete:CASCADE"`
	Status              string    `gorm:"type:varchar(50);not null;default:'created'"`
	OrderSet            []Dish    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	PreparationTime     time.Time `gorm:"precision:6"`        // Время начала готовки
	PreparationDuration int       `gorm:"not null;default:0"` // Время готовки в минутах
	DeliveryTime        time.Time `gorm:"precision:6"`        // Время доставки
	DeliveryDuration    int       `gorm:"not null;default:0"` // Время доставки в минутах
	CreatedAt           time.Time `gorm:"precision:6"`
	UpdatedAt           time.Time `gorm:"precision:6"`
	Price               float64   `gorm:"type:decimal(10,2);not null"`
}

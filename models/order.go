package models

import (
	"github.com/google/uuid"
	"time"
)

const (
	CREATED         string = "created"
	CANCELED        string = "cancelled"
	COOKING         string = "cooking"
	WAITFREECOURIER string = "waitfreecourier"
	ONTHEWAY        string = "ontheway"
	CLOSED          string = "closed"
)

type OrderDish struct {
	ID      uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrderID uuid.UUID `gorm:"type:uuid;not null;index"`
	DishID  uuid.UUID `gorm:"type:uuid;not null;index"`
	Count   int       `gorm:"not null;default:1"`
}

type Order struct {
	ID                  uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID              uuid.UUID   `gorm:"type:uuid;not null;OnDelete:CASCADE"`
	CourierID           uuid.UUID   `gorm:"type:uuid;not null;default='none';OnDelete:CASCADE"`
	Status              string      `gorm:"type:varchar(50);not null;default:'created'"`
	OrderItems          []OrderDish `gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	PreparationTime     time.Time   `gorm:"precision:6"`
	PreparationDuration int         `gorm:"not null;default:0"`
	DeliveryTime        time.Time   `gorm:"precision:6"`
	DeliveryDuration    int         `gorm:"not null;default:0"`
	CreatedAt           time.Time   `gorm:"precision:6"`
	UpdatedAt           time.Time   `gorm:"precision:6"`
	Price               float64     `gorm:"type:decimal(10,2);not null"`
}

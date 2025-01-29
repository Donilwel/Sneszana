package models

import (
	"time"
)

const (
	UNACTIVE string = "UNACTIVE"
	ACTIVE   string = "ACTIVE"
	WAITING  string = "WAITING"
)

type Courier struct {
	ID          uint    `gorm:"primaryKey"`
	UserID      uint    `gorm:"not null;index"`
	User        User    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;"`
	Vehicle     string  `gorm:"type:varchar(100);not null;default:'NONE'"`
	Status      string  `gorm:"type:varchar(100);not null;default:'UNACTIVE'"`
	CountOrders uint    `gorm:"default:0"`
	Rating      float32 `gorm:"type:decimal(10,2);not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

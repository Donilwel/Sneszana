package models

import (
	"gorm.io/gorm"
	"time"
)

const (
	UNACTIVE string = "UNACTIVE"
	ACTIVE   string = "ACTIVE"
	WAITING  string = "WAITING"
)

type Courier struct {
	ID          uint           `gorm:"primaryKey"`
	UserID      uint           `gorm:"unique;not null;OnDelete:CASCADE"`
	User        User           `gorm:"foreignKey:UserID"`
	Rating      float64        `gorm:"type:decimal(3,2);default:0.0"`
	Vehicle     string         `gorm:"type:varchar(50);not null;default:'NONE'"`
	OrdersCount int            `gorm:"default:0"`
	Status      string         `gorm:"type:varchar(20);not null;default:'UNACTIVE'"`
	CreatedAt   time.Time      `gorm:"precision:6"`
	UpdatedAt   time.Time      `gorm:"precision:6"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

const (
	ADMIN_ROLE    string = "ADMIN_ROLE"
	COURIER_ROLE  string = "COURIER_ROLE"
	CUSTOMER_ROLE string = "CUSTOMER_ROLE"
)

type User struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	Name        string         `gorm:"type:varchar(100);not null"`
	Email       string         `gorm:"type:varchar(100);unique;not null"`
	PhoneNumber string         `gorm:"type:varchar(15);unique;not null"`
	Password    string         `gorm:"type:varchar(255);not null"`
	Role        string         `gorm:"type:varchar(100);not null;default:'CUSTOMER_ROLE'"`
	CreatedAt   time.Time      `gorm:"precision:6"`
	UpdatedAt   time.Time      `gorm:"precision:6"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

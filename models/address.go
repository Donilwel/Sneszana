package models

import "github.com/google/uuid"

type Address struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primary_key" json:"id"`
	OrderID       uuid.UUID `gorm:"type:uuid;not null" json:"order_id"`
	Phone         string    `gorm:"not null" json:"phone"`
	Street        string    `gorm:"not null" json:"street"`
	HouseNumber   string    `gorm:"not null" json:"house_number"`
	Apartment     string    `gorm:"not null" json:"apartment"`
	DomophoneCode string    `gorm:"not null" json:"domophone_code"`
}

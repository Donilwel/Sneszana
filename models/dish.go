package models

type Dish struct {
	ID           uint    `gorm:"primaryKey"`
	Name         string  `gorm:"type:varchar(100);not null"`
	Description  string  `gorm:"type:text"`
	Price        float64 `gorm:"type:decimal(10,2);not null"`
	ImageURL     string  `gorm:"type:varchar(255)"`
	Ingredients  string  `gorm:"type:text"`
	RestaurantID uint    `gorm:"not null"`
}

package models

type Restaurant struct {
	ID       uint    `gorm:"primaryKey"`
	Name     string  `gorm:"type:varchar(100);not null"`
	Location string  `gorm:"type:varchar(100);not null"`
	Rating   float64 `gorm:"type:decimal(3,2);default:0.0"`
	Menu     []Dish  `gorm:"foreignKey:RestaurantID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

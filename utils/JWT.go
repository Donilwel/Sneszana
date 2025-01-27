package utils

import (
	"github.com/golang-jwt/jwt/v4"
	"time"
)

var jwtSecret = []byte("h8hjfdjfd04kfmfdo32nifsdnf3")

func GenerateJWT(userId uint, email string) (string, error) {
	claims := jwt.MapClaims{
		"userID": userId,
		"email":  email,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

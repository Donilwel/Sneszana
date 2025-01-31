package utils

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"context"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"log"
	"net/http"
	"strings"
	"time"
)

var jwtSecret = []byte("h8hjfdjfd04kfmfdo32nifsdnf3")

func GenerateJWT(userId uuid.UUID, email string) (string, error) {
	claims := jwt.MapClaims{
		"userID": userId.String(),
		"email":  email,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthMiddleware(requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := r.Header.Get("Authorization")
			if tokenString == "" {
				log.Println("missing token")
				http.Error(w, "missing token", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(tokenString, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				log.Println("invalid token format")
				http.Error(w, "invalid token format", http.StatusUnauthorized)
				return
			}
			tokenString = parts[1]
			var revokedToken models.RevokedToken
			if err := migrations.DB.Where("token = ?", tokenString).First(&revokedToken).Error; err == nil {
				log.Println("please re-login, you logout")
				http.Error(w, "please re-login, you logout", http.StatusUnauthorized)
				return
			}
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return jwtSecret, nil
			})

			if err != nil || !token.Valid {
				log.Println("invalid token")
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				log.Println("invalid token claims")
				http.Error(w, "invalid token claims", http.StatusUnauthorized)
				return
			}

			userID, ok := claims["userID"].(string)
			if !ok {
				log.Println("userID not found in token")
				http.Error(w, "userID not found in token", http.StatusUnauthorized)
				return
			}

			var user models.User
			if err := migrations.DB.Where("id = ?", userID).First(&user).Error; err != nil {
				log.Println("user not found")
				http.Error(w, "user not found", http.StatusUnauthorized)
				return
			}

			role := user.Role

			if requiredRole != "" && role != requiredRole {
				log.Println("role mismatch")
				http.Error(w, "forbidden: insufficient permissions", http.StatusForbidden)
				return
			}

			ctx := context.WithValue(r.Context(), "userID", userID)
			ctx = context.WithValue(ctx, "role", role)
			r = r.WithContext(ctx)
			log.Println("role user is correct")
			next.ServeHTTP(w, r)
		})
	}
}

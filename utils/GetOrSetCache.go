package utils

import (
	"context"
	"encoding/json"
	"github.com/sirupsen/logrus"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func GetOrSetTCache[T any](ctx context.Context, rdb *redis.Client, db *gorm.DB, cacheKey string, query *gorm.DB, dest *[]T, ttl time.Duration) (bool, error) {
	cachedData, err := rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		if err = json.Unmarshal([]byte(cachedData), dest); err == nil {
			logrus.Info("Data retrieved from cache: ", cacheKey) // Логируем источник данных
			return true, nil
		}
	}

	if err := query.Find(dest).Error; err != nil {
		return false, err
	}

	if len(*dest) > 0 {
		jsonData, _ := json.Marshal(dest)
		_ = rdb.Set(ctx, cacheKey, jsonData, ttl).Err()
		logrus.Info("Data retrieved from database and cached: ", cacheKey) // Логируем источник данных
	}

	return false, nil
}

package utils

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func GetOrSetCache[T any](ctx context.Context, rdb *redis.Client, db *gorm.DB, cacheKey string, query *gorm.DB, dest *[]T, ttl time.Duration) error {
	cachedData, err := rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		if err = json.Unmarshal([]byte(cachedData), dest); err == nil {
			return nil
		}
	}

	if err := query.Find(dest).Error; err != nil {
		return err
	}

	if len(*dest) > 0 {
		jsonData, _ := json.Marshal(dest)
		_ = rdb.Set(ctx, cacheKey, jsonData, ttl).Err()
	}

	return nil
}

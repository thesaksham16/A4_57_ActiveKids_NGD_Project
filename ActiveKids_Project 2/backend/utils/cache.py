import redis
import json
import os

redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

def cache_user(user):
    key = f"user:{user['username']}"
    redis_client.setex(key, 600, json.dumps(user))  # cache 10 mins

def get_cached_user(username):
    key = f"user:{username}"
    cached = redis_client.get(key)
    return json.loads(cached) if cached else None

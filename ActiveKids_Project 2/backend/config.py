# config.py
from dotenv import load_dotenv
import os
from pymongo import MongoClient
import redis
from cassandra.cluster import Cluster
from neo4j import GraphDatabase

# Load all environment variables from .env
load_dotenv()

# --- MongoDB Connection ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client["activekids_db"]

# --- Redis Connection ---
redis_client = redis.StrictRedis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0
)

# --- Cassandra Connection ---
CASSANDRA_HOST = os.getenv("CASSANDRA_HOST", "127.0.0.1")
CASSANDRA_KEYSPACE = os.getenv("CASSANDRA_KEYSPACE", "activekids_ks")
cluster = Cluster([CASSANDRA_HOST])
cassandra_session = cluster.connect(CASSANDRA_KEYSPACE)

# --- Neo4j Connection ---
neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI", "bolt://localhost:7687"),
    auth=(
        os.getenv("NEO4J_USER", "neo4j"),
        os.getenv("*****1402", "admin")
    )
)

print("✅ All database connections initialized successfully.")


from flask import Blueprint, request, jsonify
from config import mongo_db
from utils.cache import cache_user, get_cached_user

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    if mongo_db.users.find_one({'username': data['username']}):
        return jsonify({'message': 'User already exists'}), 400
    mongo_db.users.insert_one(data)
    return jsonify({'message': 'User registered successfully'}), 201

@users_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    user = mongo_db.users.find_one({'username': data['username'], 'password': data['password']})
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401
    cache_user(user)
    return jsonify({'message': 'Login successful', 'user': {'username': user['username'], 'role': user['role']}})

@users_bp.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    cached = get_cached_user(username)
    if cached:
        return jsonify({'user': cached})
    user = mongo_db.users.find_one({'username': username}, {'_id': 0})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user': user})

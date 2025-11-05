from flask import Blueprint, jsonify, request
from config import mongo_db, cassandra_session

challenges_bp = Blueprint('challenges', __name__)

@challenges_bp.route('/', methods=['GET'])
def get_challenges():
    challenges = list(mongo_db.challenges.find({}, {'_id': 0}))
    return jsonify({'challenges': challenges})

@challenges_bp.route('/submit', methods=['POST'])
def submit_challenge():
    data = request.get_json()
    query = """
        INSERT INTO submissions (username, challenge_id, status, points)
        VALUES (%s, %s, %s, %s)
    """
    cassandra_session.execute(query, (data['username'], data['challenge_id'], 'pending', 0))
    return jsonify({'message': 'Challenge submitted and pending review'}), 201

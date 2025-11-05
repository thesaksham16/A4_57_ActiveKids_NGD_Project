from flask import Blueprint, jsonify
from config import neo4j_driver

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/leaderboard', methods=['GET'])
def leaderboard():
    with neo4j_driver.session() as session:
        query = """
        MATCH (u:User)
        RETURN u.username AS username, u.points AS points
        ORDER BY u.points DESC LIMIT 5
        """
        result = session.run(query)
        leaderboard = [{'username': r['username'], 'points': r['points']} for r in result]
    return jsonify({'leaderboard': leaderboard})

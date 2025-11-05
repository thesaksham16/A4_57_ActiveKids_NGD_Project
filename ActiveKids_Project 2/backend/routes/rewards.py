from flask import Blueprint, jsonify, request
from config import mongo_db

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('/', methods=['GET'])
def get_rewards():
    rewards = list(mongo_db.rewards.find({}, {'_id': 0}))
    return jsonify({'rewards': rewards})

@rewards_bp.route('/redeem', methods=['POST'])
def redeem_reward():
    data = request.get_json()
    reward = mongo_db.rewards.find_one({'id': data['reward_id']})
    if not reward or reward['stock'] <= 0:
        return jsonify({'message': 'Reward unavailable'}), 400

    mongo_db.rewards.update_one({'id': data['reward_id']}, {'$inc': {'stock': -1}})
    mongo_db.users.update_one({'username': data['username']}, {'$inc': {'points': -reward['cost']}})
    return jsonify({'message': f"{reward['name']} redeemed successfully!"})

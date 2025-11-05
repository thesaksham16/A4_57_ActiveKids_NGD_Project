from flask import Flask, send_from_directory, request, jsonify
import os
app = Flask(__name__, static_folder='../frontend', static_url_path='')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'login.html')
@app.route('/<path:filename>')
def frontend_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    # illustrative response
    return jsonify({'success': True, 'message': 'User registered (illustrative).'})
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    # illustrative: accept admin/admin123 for demo
    if data.get('username')=='admin' and data.get('password')=='admin123':
        return jsonify({'success': True, 'user': {'username':'admin','role':'admin','points':0}})
    return jsonify(None)

@app.route('/api/leaderboard')
def leaderboard():
    return jsonify({'leaderboard':[{'username':'user1','points':120},{'username':'user2','points':100}]})

@app.route('/api/redeem', methods=['POST'])
def redeem():
    return jsonify({'success': True, 'message': 'Redeemed (illustrative)', 'updatedPoints': 0})

if __name__=='__main__':
    app.run(debug=True, host='0.0.0.0')

import os
import sqlite3
import datetime
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory, render_template

app = Flask(__name__, static_folder='static', static_url_path='')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'complaints.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max limit

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            road_area TEXT NOT NULL,
            problem_type TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            photo_filename TEXT NOT NULL,
            date_created TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Submitted',
            admin_notes TEXT DEFAULT ''
        )
    ''')
    conn.commit()

    # Check if empty; if so, populate demo complaints
    cursor.execute('SELECT COUNT(*) as count FROM complaints')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_demo_data(cursor)
        conn.commit()
    conn.close()

def seed_demo_data(cursor):
    sample_complaints = [
        (
            'CEP-VAR-2026-001',
            'Rahul Patil',
            '9822145670',
            'Varale Phata Junction',
            'Pothole',
            'Deep 8-inch asphalt pothole on the turn towards Talegaon MIDC. Two-wheelers frequently lose balance, especially during evening traffic.',
            'Varale Phata Chowk, near Petrol Pump (18.7328° N, 73.6821° E)',
            'pothole1.svg',
            '2026-09-10 10:30',
            'In Progress',
            'Repair crew dispatched with cold-mix asphalt. Work in progress under Varale Gram Panchayat engineering division.'
        ),
        (
            'CEP-VAR-2026-002',
            'Sunita Shinde',
            '9890234121',
            'ZP Primary School Road',
            'Broken Road',
            'Road shoulder has caved in heavily along the school boundary wall. Poses serious danger for school vans and walking children.',
            'Opposite Zilla Parishad Primary School, Varale Gaothan',
            'broken_road1.svg',
            '2026-09-11 14:15',
            'Under Review',
            'Site inspection completed by junior engineer. Estimation approved for side barricading and concrete patching.'
        ),
        (
            'CEP-VAR-2026-003',
            'Nilesh Gade',
            '9765432190',
            'Maruti Mandir Chowk',
            'Drainage Problem',
            'Roadside drainage clogged with silt, leading to dirty wastewater flooding onto the main road. Foul smell and slippery road surface.',
            'Near Maruti Mandir, Old Gaothan, Varale',
            'drainage1.svg',
            '2026-09-12 09:00',
            'Submitted',
            'Awaiting administrative review by sanitation and road maintenance team.'
        ),
        (
            'CEP-VAR-2026-004',
            'Amit Deshmukh',
            '9923187654',
            'Talegaon-Chakan Link Road',
            'Damaged Road',
            'Heavy industrial vehicles have worn out the road surface into uneven cracks and depressions over a 50-meter stretch.',
            'Talegaon-Chakan Link Road, Varale Industrial Stretch',
            'damaged_road1.svg',
            '2026-09-08 11:45',
            'Resolved',
            'Resurfacing and patch work completed on 12-Sep-2026. Road cleared for normal heavy vehicle transit.'
        )
    ]

    cursor.executemany('''
        INSERT INTO complaints (
            complaint_id, name, mobile, road_area, problem_type,
            description, location, photo_filename, date_created, status, admin_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_complaints)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM complaints')
    total = cursor.fetchone()['total']

    cursor.execute("SELECT COUNT(*) as pending FROM complaints WHERE status IN ('Submitted', 'Under Review')")
    pending = cursor.fetchone()['pending']

    cursor.execute("SELECT COUNT(*) as in_progress FROM complaints WHERE status = 'In Progress'")
    in_progress = cursor.fetchone()['in_progress']

    cursor.execute("SELECT COUNT(*) as resolved FROM complaints WHERE status = 'Resolved'")
    resolved = cursor.fetchone()['resolved']

    conn.close()
    return jsonify({
        'total': total,
        'pending': pending,
        'in_progress': in_progress,
        'resolved': resolved
    })

@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    status = request.args.get('status')
    search = request.args.get('search')

    query = 'SELECT * FROM complaints WHERE 1=1'
    params = []

    if status and status.lower() != 'all':
        query += ' AND status = ?'
        params.append(status)

    if search:
        query += ' AND (complaint_id LIKE ? OR road_area LIKE ? OR problem_type LIKE ? OR name LIKE ?)'
        like_term = f'%{search}%'
        params.extend([like_term, like_term, like_term, like_term])

    query += ' ORDER BY id DESC'

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    complaints = [dict(row) for row in rows]
    conn.close()

    return jsonify(complaints)

@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM complaints WHERE complaint_id = ?', (complaint_id.strip(),))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify(dict(row))
    return jsonify({'error': 'Complaint not found with ID: ' + complaint_id}), 404

@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    try:
        # Accept multipart form, urlencoded form, or JSON
        if request.is_json:
            data = request.get_json(silent=True) or {}
            photo_file = None
        else:
            data = request.form
            photo_file = request.files.get('photo') if request.files else None

        name = data.get('name', '').strip()
        mobile = data.get('mobile', '').strip()
        road_area = data.get('road_area', '').strip()
        problem_type = data.get('problem_type', '').strip()
        description = data.get('description', '').strip()
        location = data.get('location', '').strip()

        # Basic validations
        if not name or not mobile or not road_area or not problem_type or not description:
            return jsonify({'error': 'Please fill all required fields.'}), 400

        # Save photo or assign default illustration
        photo_filename = None
        if photo_file and photo_file.filename and allowed_file(photo_file.filename):
            filename = secure_filename(photo_file.filename)
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            photo_filename = f"{timestamp}_{filename}"
            photo_file.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
        else:
            # Fallback based on problem type
            mapping = {
                'Pothole': 'pothole1.svg',
                'Damaged Road': 'damaged_road1.svg',
                'Drainage Problem': 'drainage1.svg',
                'Broken Road': 'broken_road1.svg'
            }
            photo_filename = mapping.get(problem_type, 'pothole1.svg')

        now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

        conn = get_db()
        cursor = conn.cursor()

        # Generate unique readable Complaint ID: CEP-VAR-2026-XXX
        cursor.execute('SELECT MAX(id) as max_id FROM complaints')
        row = cursor.fetchone()
        next_num = 101 if not row or not row['max_id'] else row['max_id'] + 101
        complaint_id = f"CEP-VAR-2026-{next_num}"

        cursor.execute('''
            INSERT INTO complaints (
                complaint_id, name, mobile, road_area, problem_type,
                description, location, photo_filename, date_created, status, admin_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', '')
        ''', (
            complaint_id, name, mobile, road_area, problem_type,
            description, location or 'Varale, Pune', photo_filename, now_str
        ))
        conn.commit()

        cursor.execute('SELECT * FROM complaints WHERE complaint_id = ?', (complaint_id,))
        created = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Complaint successfully registered!',
            'complaint_id': complaint_id,
            'data': created
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/complaints/<complaint_id>/status', methods=['PATCH'])
def update_status(complaint_id):
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', '')

        valid_statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved']
        if not new_status or new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Allowed: {", ".join(valid_statuses)}'}), 400

        conn = get_db()
        cursor = conn.cursor()

        if admin_notes:
            cursor.execute('''
                UPDATE complaints
                SET status = ?, admin_notes = ?
                WHERE complaint_id = ?
            ''', (new_status, admin_notes, complaint_id))
        else:
            cursor.execute('''
                UPDATE complaints
                SET status = ?
                WHERE complaint_id = ?
            ''', (new_status, complaint_id))

        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Complaint not found'}), 404

        conn.commit()
        cursor.execute('SELECT * FROM complaints WHERE complaint_id = ?', (complaint_id,))
        updated = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Status updated to {new_status}',
            'data': updated
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-demo', methods=['POST'])
def reset_demo():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM complaints')
        seed_demo_data(cursor)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Demo complaints reset successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("=" * 60)
    print("  Road Complaint System - CEP (Varale, Pune)")
    print("  Server running at: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)

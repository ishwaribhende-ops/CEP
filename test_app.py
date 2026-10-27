import io
import json
import unittest
from app import app, init_db, get_db

class RoadComplaintSystemTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = app.test_client()

    def test_01_index_page(self):
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        text = res.get_data(as_text=True)
        self.assertIn('Road Complaint System', text)
        self.assertIn('Report. Track. Improve Our Roads.', text)
        self.assertIn('Varale, Pune', text)

    def test_02_get_stats(self):
        res = self.client.get('/api/stats')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.get_data(as_text=True))
        self.assertIn('total', data)
        self.assertIn('pending', data)
        self.assertIn('in_progress', data)
        self.assertIn('resolved', data)
        self.assertGreaterEqual(data['total'], 4)

    def test_03_get_complaints_list(self):
        res = self.client.get('/api/complaints')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.get_data(as_text=True))
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 4)

    def test_04_get_single_complaint(self):
        res = self.client.get('/api/complaints/CEP-VAR-2026-001')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.get_data(as_text=True))
        self.assertEqual(data['complaint_id'], 'CEP-VAR-2026-001')
        self.assertEqual(data['problem_type'], 'Pothole')
        self.assertEqual(data['status'], 'In Progress')

    def test_05_create_new_complaint(self):
        form_data = {
            'name': 'Pooja Kulkarni',
            'mobile': '9811223344',
            'road_area': 'Varale Phata Market Area',
            'problem_type': 'Damaged Road',
            'description': 'Asphalt erosion causing slippery loose pebbles across the road turn.',
            'location': 'Near Market Chowk, Varale'
        }
        res = self.client.post('/api/complaints', data=form_data)
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.get_data(as_text=True))
        self.assertTrue(data['success'])
        complaint_id = data['complaint_id']
        self.assertTrue(complaint_id.startswith('CEP-VAR-2026-'))

        # Verify it can be retrieved
        fetch_res = self.client.get(f'/api/complaints/{complaint_id}')
        self.assertEqual(fetch_res.status_code, 200)
        fetched_data = json.loads(fetch_res.get_data(as_text=True))
        self.assertEqual(fetched_data['name'], 'Pooja Kulkarni')
        self.assertEqual(fetched_data['status'], 'Submitted')

        # Test updating status as admin
        patch_res = self.client.patch(f'/api/complaints/{complaint_id}/status',
            data=json.dumps({'status': 'In Progress', 'admin_notes': 'Inspection team dispatched.'}),
            content_type='application/json'
        )
        self.assertEqual(patch_res.status_code, 200)
        patch_data = json.loads(patch_res.get_data(as_text=True))
        self.assertEqual(patch_data['data']['status'], 'In Progress')
        self.assertEqual(patch_data['data']['admin_notes'], 'Inspection team dispatched.')

        # Further update status to Resolved
        resolve_res = self.client.patch(f'/api/complaints/{complaint_id}/status',
            data=json.dumps({'status': 'Resolved', 'admin_notes': 'Road patched and cleared.'}),
            content_type='application/json'
        )
        self.assertEqual(resolve_res.status_code, 200)
        resolved_data = json.loads(resolve_res.get_data(as_text=True))
        self.assertEqual(resolved_data['data']['status'], 'Resolved')

    def test_06_css_and_js_served(self):
        css_res = self.client.get('/css/style.css')
        self.assertEqual(css_res.status_code, 200)
        js_res = self.client.get('/js/app.js')
        self.assertEqual(js_res.status_code, 200)

    def test_07_file_upload_and_search(self):
        # Test multipart with file upload
        test_file = (io.BytesIO(b"<svg>dummy</svg>"), "test_pothole.svg")
        data = {
            'name': 'Ganesh Gaikwad',
            'mobile': '9876543210',
            'road_area': 'ZP Primary School Road',
            'problem_type': 'Broken Road',
            'description': 'Broken edge near school entrance gate.',
            'location': 'Near ZP School, Varale',
            'photo': test_file
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        res_data = json.loads(res.get_data(as_text=True))
        self.assertTrue(res_data['data']['photo_filename'].endswith('test_pothole.svg'))

        # Test search filter
        search_res = self.client.get('/api/complaints?search=Ganesh')
        self.assertEqual(search_res.status_code, 200)
        search_data = json.loads(search_res.get_data(as_text=True))
        self.assertTrue(any(c['name'] == 'Ganesh Gaikwad' for c in search_data))

    def test_08_reset_demo(self):
        res = self.client.post('/api/reset-demo')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.get_data(as_text=True))
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()

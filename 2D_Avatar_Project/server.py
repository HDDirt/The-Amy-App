#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import base64
import os

class AvatarHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save-amy-avatar':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))
                image_data = base64.b64decode(data['image'])
                
                # Save to assets/amy.png
                assets_dir = os.path.join(os.path.dirname(os.getcwd()), 'assets')
                if not os.path.exists(assets_dir):
                    os.makedirs(assets_dir)
                
                with open(os.path.join(assets_dir, 'amy.png'), 'wb') as f:
                    f.write(image_data)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
                
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': str(e)
                }).encode())
            return
            
        return SimpleHTTPRequestHandler.do_POST(self)

def run(port=8001):
    server_address = ('', port)
    httpd = HTTPServer(server_address, AvatarHandler)
    print(f'Server running on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
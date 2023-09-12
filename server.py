import http.server
import socketserver


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')  # Enable CORS
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)


if __name__ == '__main__':
    PORT = 8080  # Specify the desired port number
    Handler = MyHTTPRequestHandler
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        httpd.serve_forever()
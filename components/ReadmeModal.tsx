
import React from 'react';

interface ReadmeModalProps {
  onClose: () => void;
}

const CodeBlock: React.FC<{ children: React.ReactNode, lang: string }> = ({ children, lang }) => (
    <pre className="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
        <code className={`language-${lang} text-sm text-cyan-300`}>
            {children}
        </code>
    </pre>
);

const ReadmeModal: React.FC<ReadmeModalProps> = ({ onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div 
            className="bg-gray-800 text-gray-300 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <header className="p-4 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">Project Explanation & README</h2>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white transition-colors text-3xl font-light"
                    aria-label="Close modal"
                >
                    &times;
                </button>
            </header>
            <main className="p-6 overflow-y-auto">
                <p className="mb-4">This application is a React-based web simulation of the multi-client TCP chat program you requested. While a browser cannot directly implement a Python TCP server, this project faithfully recreates all the requested logic and features in a modern web environment.</p>
                
                <h3 className="text-xl font-semibold mt-6 mb-2 text-cyan-400">How It Works: Simulating the Backend</h3>
                <p>Instead of separate `server.py` and `client.py` files, we have a unified React application where the backend logic is simulated.</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Mock Server (`services/chatService.ts`):</strong> This TypeScript class acts as our `server.py`. It manages the state of users and messages, broadcasts new messages to all clients (by emitting events), and handles connection/disconnection logic. It uses the Singleton pattern to ensure only one "server" instance exists.</li>
                    <li><strong>React UI (`App.tsx` & Components):</strong> This is our `client.py`. The UI components subscribe to events from the `chatService`. When the service emits an event (like a new message), the React components automatically re-render to show the latest state, creating a real-time experience.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-2 text-cyan-400">Core Concepts Explained</h3>
                <h4 className="text-lg font-medium mt-4 text-white">TCP Sockets vs. WebSockets</h4>
                <p>A Python TCP server uses raw TCP sockets for communication. Web browsers cannot use these directly for security reasons. The web equivalent is <strong>WebSockets</strong>, which provides a similar persistent, two-way communication channel over a standard HTTP(S) connection. This app simulates WebSocket behavior using an event-driven service.</p>

                <h4 className="text-lg font-medium mt-4 text-white">Threading vs. Asynchronous JavaScript</h4>
                <p>In the Python client, you requested threading to handle sending and receiving messages simultaneously. In JavaScript, this is handled differently:</p>
                <p>The browser's JavaScript engine is single-threaded but uses an <strong>event loop</strong> to handle asynchronous operations (like waiting for a new message) without blocking the main thread. This means the UI remains responsive and you can type a message while the app is "listening" for new messages from the service—achieving the same goal as threading in this context.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 text-cyan-400">How to Run It</h3>
                <p>This is a self-contained web application. You are already running it! To simulate multiple clients:</p>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Open this application in a new browser tab or window.</li>
                    <li>Enter a different username.</li>
                    <li>You can now chat between the two browser tabs, just as you would with two separate client scripts.</li>
                </ol>

                <h3 className="text-xl font-semibold mt-6 mb-2 text-cyan-400">Feature Implementation</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Timestamps:</strong> Each message object is created with a `new Date()` and formatted in the UI.</li>
                    <li><strong>Colored Usernames:</strong> A hashing function converts each username into a consistent color from a predefined list of Tailwind CSS classes.</li>
                    <li><strong>`/quit` command:</strong> The message input component checks for this command and triggers the logout function if it's entered.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-2 text-cyan-400">Extended Version: Flask-SocketIO Backend</h3>
                <p>To convert this into a web app with a real Python backend, you would:</p>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li><strong>Build a Python Backend:</strong> Use a framework like Flask with the `Flask-SocketIO` extension. This server would manage the actual WebSocket connections.</li>
                    <li><strong>Replace `chatService.ts`:</strong> Instead of the mock service, you would use a WebSocket client library (like `socket.io-client`) in the React app to connect to your Flask server.</li>
                    <li><strong>Emit and Listen:</strong> The React client would emit events (e.g., `'send_message'`) to the server, and the server would broadcast messages back to all connected clients.</li>
                </ol>
                <p>Example Flask-SocketIO server snippet:</p>
                <CodeBlock lang="python">{`
from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('send_message')
def handle_message(data):
    # Broadcast message to all clients
    emit('new_message', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
                `}</CodeBlock>
            </main>
        </div>
    </div>
  );
};

export default ReadmeModal;

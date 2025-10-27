import React from 'react';

interface LoggedOutProps {
  onJoinAgain: () => void;
  onCreateNew: () => void;
  username: string;
}

const LoggedOut: React.FC<LoggedOutProps> = ({ onJoinAgain, onCreateNew, username }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
          Opps!
        </h1>
        <p className="mt-2 text-gray-300 text-lg">
          You left the chat as <span className="font-bold text-white">{username}</span>.
        </p>
        <p className="text-gray-400">Want to jump back in?</p>
        <div className="mt-8 space-y-4">
          <button
            onClick={onJoinAgain}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors duration-200"
          >
            Join Again
          </button>
          <button
            onClick={onCreateNew}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-600 text-lg font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors duration-200"
          >
            Create a New User
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoggedOut;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

interface Agent {
  _id: string;
  name?: string;
  created?: number;
}

const App = () => {
  const [agentName, setAgentName] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/list-agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data.agents);
      setError('');
    } catch (error) {
      setError('Error fetching agents');
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      setError('Please enter an agent name');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/save-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save agent');
      }
  
      const data = await response.json();
      setResponseMessage(data.message);
      setAgentName('');
      await fetchAgents();
    } catch (error) {
      setError('Error saving agent');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {  
    try {
      setIsDeletingId(id);
      setError('');
      setResponseMessage('');
  
      const response = await fetch(`/api/delete-agent/${id}`, { method: 'DELETE' });
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete agent');
      }
  
      setAgents(prevAgents => prevAgents.filter(agent => agent._id !== id));
      setResponseMessage(data.message || 'Agent deleted: ' + {id});
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete agent');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSaveAgent();
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Agent Registry</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter agent name"
          style={{ 
            padding: '8px',
            marginRight: '10px',
            width: '200px'
          }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSaveAgent}
          disabled={isLoading || !agentName.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Saving...' : 'Save Agent'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
      )}
      
      {responseMessage && (
        <p style={{ color: 'green', marginBottom: '10px' }}>{responseMessage}</p>
      )}

      <h2>Saved Agents</h2>
      {isLoading && !isDeletingId ? (
        <p>Loading agents...</p>
      ) : (
        <div>
          {agents.length === 0 ? (
            <p>No agents found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {agents.map((agent) => (
                <li 
                  key={agent._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    marginBottom: '5px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>
                    {agent._id}
                  </span>
                  <button
                    onClick={() => handleDeleteAgent(agent._id)}
                    disabled={isDeletingId === agent._id}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isDeletingId === agent._id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isDeletingId === agent._id ? 'Deleting...' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
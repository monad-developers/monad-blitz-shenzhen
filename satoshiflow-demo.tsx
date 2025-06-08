import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Bot, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Star,
  Coins,
  Activity,
  FileText
} from 'lucide-react';

// Mock data for demonstration
const mockAgents = [
  {
    id: 'agent-translator-001',
    name: 'VideoTranslate AI',
    type: 'Translation & Subtitling',
    reputation: 4.8,
    completedTasks: 1247,
    avgResponseTime: '2.3h',
    rate: '12 USDC/hour',
    specialties: ['Video Translation', 'Subtitle Generation', 'Voice Synthesis'],
    ethicsScore: 98,
    address: '0x742d35Cc6634C0532925a3b8D8432b8DE9C0B'
  },
  {
    id: 'agent-editor-002', 
    name: 'ClipCraft Pro',
    type: 'Video Editing & Post',
    reputation: 4.9,
    completedTasks: 892,
    avgResponseTime: '1.8h',
    rate: '15 USDC/hour',
    specialties: ['Video Editing', 'Color Grading', 'Audio Sync'],
    ethicsScore: 96,
    address: '0x8f5982E4F3b5e8B7C9D1234A5E7F8G9H0I1J2K3L'
  }
];

const mockIntents = [
  {
    id: 'intent-001',
    tokenId: 1,
    from: 'Agent A (Translator)',
    to: 'Agent B (Editor)',
    service: 'Video Translation + Editing',
    amount: '24 USDC',
    deadline: '2 hours',
    status: 'Active',
    progress: 65,
    intentHash: '0xabc123def456...',
    ethicsHash: '0xdao4e5f6...',
    slaTokenId: 'SLA-001'
  },
  {
    id: 'intent-002',
    tokenId: 2,
    from: 'Content Creator',
    to: 'VideoTranslate AI',
    service: 'Multi-language Subtitles',
    amount: '18 USDC',
    deadline: '4 hours',
    status: 'Completed',
    progress: 100,
    intentHash: '0x789xyz321...',
    ethicsHash: '0xethics789...',
    slaTokenId: 'SLA-002'
  }
];

export default function SatoshiFlowDemo() {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({
    receiver: '',
    amount: '',
    deadline: '2',
    service: '',
    intentHash: '',
    ethicsHash: ''
  });
  const [intents, setIntents] = useState(mockIntents);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate wallet connection
  const connectWallet = () => {
    setIsConnected(true);
  };

  // Generate mock hashes
  const generateHashes = () => {
    const intentHash = '0x' + Math.random().toString(16).substr(2, 40);
    const ethicsHash = '0x' + Math.random().toString(16).substr(2, 40);
    setFormData(prev => ({ ...prev, intentHash, ethicsHash }));
  };

  const handleCreateIntent = () => {
    if (!formData.receiver || !formData.amount || !formData.service) {
      alert('Please fill in all required fields');
      return;
    }

    const newIntent = {
      id: `intent-${Date.now()}`,
      tokenId: intents.length + 1,
      from: 'Your Agent',
      to: formData.receiver,
      service: formData.service,
      amount: `${formData.amount} USDC`,
      deadline: `${formData.deadline} hours`,
      status: 'Pending',
      progress: 0,
      intentHash: formData.intentHash,
      ethicsHash: formData.ethicsHash,
      slaTokenId: `SLA-${intents.length + 1}`
    };

    setIntents(prev => [newIntent, ...prev]);
    setFormData({
      receiver: '',
      amount: '',
      deadline: '2',
      service: '',
      intentHash: '',
      ethicsHash: ''
    });
    alert('Intent created successfully! 🎉');
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setFormData(prev => ({
      ...prev,
      receiver: agent.name,
      service: agent.specialties[0]
    }));
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="border-b border-purple-800/30 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SatoshiFlow
                </h1>
                <p className="text-sm text-purple-300">AI Agent Payment Protocol</p>
              </div>
            </div>
            
            <button
              onClick={connectWallet}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isConnected 
                  ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                  : 'bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnected ? 'Connected' : 'Connect Wallet'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-black/20 p-1 rounded-xl mb-8 backdrop-blur-sm">
          {[
            { id: 'marketplace', label: 'Agent Marketplace', icon: Bot },
            { id: 'create', label: 'Create Intent', icon: Zap },
            { id: 'intents', label: 'My Intents', icon: FileText },
            { id: 'sla', label: 'SLA Viewer', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Agent Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">AI Agent Marketplace</h2>
              <p className="text-purple-300">Discover and connect with specialized AI agents</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockAgents.map(agent => (
                <div key={agent.id} className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
                      <p className="text-purple-300 text-sm">{agent.type}</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">{agent.reputation}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-purple-300">Completed Tasks</p>
                      <p className="text-white font-medium">{agent.completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Avg Response</p>
                      <p className="text-white font-medium">{agent.avgResponseTime}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Rate</p>
                      <p className="text-white font-medium">{agent.rate}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Ethics Score</p>
                      <p className="text-green-400 font-medium">{agent.ethicsScore}%</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-purple-300 text-sm mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.specialties.map(specialty => (
                        <span key={specialty} className="bg-purple-600/30 px-2 py-1 rounded-md text-xs text-purple-200">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => selectAgent(agent)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-xl transition-all"
                  >
                    Select Agent
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Intent Form */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Create Payment Intent</h2>
              
              {selectedAgent && (
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <h3 className="font-medium text-purple-200 mb-1">Selected Agent</h3>
                  <p className="text-white">{selectedAgent.name}</p>
                  <p className="text-sm text-purple-300">{selectedAgent.type}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Receiver Agent</label>
                  <input
                    type="text"
                    value={formData.receiver}
                    onChange={e => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
                    placeholder="Agent name or address"
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Amount (USDC)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="24"
                      className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Deadline (hours)</label>
                    <input
                      type="number"
                      value={formData.deadline}
                      onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      placeholder="2"
                      className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Service Description</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={e => setFormData(prev => ({ ...prev, service: e.target.value }))}
                    placeholder="Video Translation + Editing"
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={generateHashes}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-200 hover:bg-purple-600/40 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Generate Intent & Ethics Hashes</span>
                  </button>

                  {formData.intentHash && (
                    <div className="space-y-2">
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-xs text-purple-300 mb-1">Intent Hash</p>
                        <p className="text-sm text-white font-mono break-all">{formData.intentHash}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-xs text-purple-300 mb-1">Ethics Hash</p>
                        <p className="text-sm text-white font-mono break-all">{formData.ethicsHash}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreateIntent}
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {isConnected ? 'Create Intent' : 'Connect Wallet First'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Intents */}
        {activeTab === 'intents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">My Payment Intents</h2>
            
            <div className="space-y-4">
              {intents.map(intent => (
                <div key={intent.id} className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{intent.service}</h3>
                      <p className="text-sm text-purple-300">{intent.from} → {intent.to}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        intent.status === 'Completed' ? 'bg-green-600/20 text-green-400' :
                        intent.status === 'Active' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {intent.status}
                      </span>
                      <span className="text-white font-medium">{intent.amount}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-purple-300">Token ID</p>
                      <p className="text-white font-medium">#{intent.tokenId}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">Deadline</p>
                      <p className="text-white font-medium">{intent.deadline}</p>
                    </div>
                    <div>
                      <p className="text-purple-300">SLA Token</p>
                      <p className="text-white font-medium">{intent.slaTokenId}</p>
                    </div>
                  </div>

                  {intent.status === 'Active' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-purple-300">Progress</span>
                        <span className="text-white">{intent.progress}%</span>
                      </div>
                      <div className="w-full bg-purple-900/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${intent.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-200 hover:bg-purple-600/40 transition-all text-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Explorer</span>
                    </button>
                    
                    {intent.status === 'Active' && (
                      <button className="flex items-center space-x-2 px-3 py-2 bg-green-600/30 border border-green-500/30 rounded-lg text-green-200 hover:bg-green-600/40 transition-all text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Completion</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLA Viewer */}
        {activeTab === 'sla' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Service Level Agreement (SLA) Monitor</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {intents.filter(intent => intent.status !== 'Pending').map(intent => (
                <div key={intent.id} className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">{intent.slaTokenId}</h3>
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-300">Service</span>
                      <span className="text-white">{intent.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">Amount</span>
                      <span className="text-white">{intent.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">Status</span>
                      <span className={intent.status === 'Completed' ? 'text-green-400' : 'text-blue-400'}>
                        {intent.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">Progress</span>
                      <span className="text-white">{intent.progress}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <p className="text-xs text-purple-300 mb-2">Ethics Hash</p>
                    <p className="text-xs text-white font-mono break-all bg-black/20 p-2 rounded">
                      {intent.ethicsHash}
                    </p>
                  </div>

                  <button className="w-full mt-4 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 py-2 px-4 rounded-lg transition-all text-sm">
                    View Full SLA
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">SLA Verification Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Intent Creation</p>
                    <p className="text-purple-300 text-sm">SLA NFT minted</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Execution</p>
                    <p className="text-purple-300 text-sm">Progress tracking</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Verification</p>
                    <p className="text-purple-300 text-sm">ZK proof & payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { journalService } from '../services/journalService';
import { geminiService } from '../services/geminiService';
import { JournalEntry, AIAnalysis } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Save, Trash2, Sparkles, Calendar, ChevronLeft, Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Mobile State
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await journalService.getEntries(user.id);
      setEntries(data);
    } catch (error) {
      console.error("Failed to load entries", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle entry selection
  useEffect(() => {
    if (selectedEntryId) {
      const entry = entries.find(e => e.id === selectedEntryId);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.content);
        setLastSaved(new Date(entry.updatedAt));
        setShowListOnMobile(false);
      }
    } else {
      // New Entry State
      setTitle('');
      setContent('');
      setLastSaved(null);
    }
  }, [selectedEntryId, entries]);

  const handleNewEntry = () => {
    setSelectedEntryId(null);
    setTitle('');
    setContent('');
    setShowListOnMobile(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim() && !content.trim()) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const newEntry: JournalEntry = {
        id: selectedEntryId || crypto.randomUUID(),
        userId: user.id,
        title: title || 'Untitled Entry',
        content,
        createdAt: selectedEntryId 
          ? entries.find(e => e.id === selectedEntryId)?.createdAt || now 
          : now,
        updatedAt: now,
        // Preserve analysis if editing
        aiAnalysis: entries.find(e => e.id === selectedEntryId)?.aiAnalysis
      };

      await journalService.saveEntry(newEntry);
      
      // Optimistic update
      setEntries(prev => {
        const idx = prev.findIndex(e => e.id === newEntry.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newEntry;
          return updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [newEntry, ...prev];
      });

      setSelectedEntryId(newEntry.id);
      setLastSaved(new Date());
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntryId) return;
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await journalService.deleteEntry(selectedEntryId);
      setEntries(prev => prev.filter(e => e.id !== selectedEntryId));
      handleNewEntry();
      setShowListOnMobile(true);
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim() || !selectedEntryId) return;
    if (!process.env.API_KEY) {
        alert("API Key missing. Cannot analyze.");
        return;
    }
    
    setIsAnalyzing(true);
    try {
        const analysis = await geminiService.analyzeEntry(content);
        
        // Update local entry with analysis
        const entryToUpdate = entries.find(e => e.id === selectedEntryId);
        if (entryToUpdate) {
            const updatedEntry = { ...entryToUpdate, aiAnalysis: analysis };
            await journalService.saveEntry(updatedEntry);
            
            setEntries(prev => prev.map(e => e.id === selectedEntryId ? updatedEntry : e));
        }
    } catch (e) {
        console.error("Analysis failed", e);
        alert("Failed to analyze entry. Please try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const currentEntry = entries.find(e => e.id === selectedEntryId);

  return (
    <Layout onNewEntry={handleNewEntry}>
      <div className="flex h-full relative">
        
        {/* Sidebar List (Visible on desktop, toggled on mobile) */}
        <div className={`
          absolute inset-0 z-10 bg-white md:static md:w-80 border-r flex flex-col transition-transform duration-300
          ${showListOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 md:hidden">
            <h2 className="font-bold text-gray-700">My Entries</h2>
            <Button size="sm" onClick={handleNewEntry} icon={<Plus size={16}/>}>New</Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
               <div className="p-4 text-center text-gray-500 text-sm">Loading entries...</div>
            ) : entries.length === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">
                 <p className="mb-2">No entries yet.</p>
                 <Button variant="ghost" onClick={handleNewEntry}>Start writing</Button>
               </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {entries.map(entry => (
                  <li key={entry.id}>
                    <button
                      onClick={() => setSelectedEntryId(entry.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedEntryId === entry.id ? 'bg-primary-50 border-l-4 border-primary-500' : 'border-l-4 border-transparent'}`}
                    >
                      <h3 className={`font-medium truncate ${selectedEntryId === entry.id ? 'text-primary-900' : 'text-gray-900'}`}>
                        {entry.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {entry.content}
                      </p>
                      {entry.aiAnalysis && (
                        <div className="mt-2 flex items-center space-x-2">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                 entry.aiAnalysis.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                 entry.aiAnalysis.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                 'bg-blue-100 text-blue-800'
                             }`}>
                                 {entry.aiAnalysis.sentiment}
                             </span>
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden w-full">
           
           {/* Mobile Nav for Editor */}
           <div className="md:hidden p-2 border-b flex items-center bg-white">
             <button onClick={() => setShowListOnMobile(true)} className="p-2 mr-2 text-gray-600">
                <ChevronLeft />
             </button>
             <span className="font-semibold text-gray-700">
               {selectedEntryId ? 'Edit Entry' : 'New Entry'}
             </span>
           </div>

           {/* Toolbar */}
           <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
              <div className="text-sm text-gray-500">
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
              </div>
              <div className="flex space-x-2">
                {selectedEntryId && (
                  <Button 
                    variant="ghost" 
                    onClick={handleDelete} 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
                
                {selectedEntryId && (
                    <Button
                        variant="secondary"
                        onClick={handleAnalyze}
                        isLoading={isAnalyzing}
                        disabled={!content || isAnalyzing}
                        title="Analyze with AI"
                        icon={<Sparkles size={16} className={isAnalyzing ? "animate-pulse" : "text-purple-600"} />}
                    >
                        <span className="hidden sm:inline">Reflect AI</span>
                    </Button>
                )}

                <Button 
                    onClick={handleSave} 
                    isLoading={isSaving}
                    icon={<Save size={18} />}
                >
                    Save
                </Button>
              </div>
           </div>

           {/* Editor Inputs */}
           <div className="flex-1 overflow-y-auto p-6 md:p-8">
             <input
               type="text"
               placeholder="Entry Title..."
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               className="w-full text-3xl md:text-4xl font-bold text-gray-800 placeholder-gray-300 border-none focus:ring-0 outline-none mb-6 bg-transparent"
             />
             <textarea
               placeholder="Write your thoughts here..."
               value={content}
               onChange={(e) => setContent(e.target.value)}
               className="w-full h-[calc(100%-100px)] resize-none text-lg leading-relaxed text-gray-700 placeholder-gray-300 border-none focus:ring-0 outline-none journal-font bg-transparent"
             />
             
             {/* AI Insights Panel */}
             {currentEntry?.aiAnalysis && (
                 <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center gap-2 mb-4 text-indigo-800 font-semibold">
                         <Sparkles size={20} />
                         <h3>AI Insights</h3>
                     </div>
                     
                     <div className="grid gap-4 md:grid-cols-2">
                         <div className="bg-white p-4 rounded-lg shadow-sm">
                             <h4 className="text-xs uppercase font-bold text-gray-400 mb-2">Summary</h4>
                             <p className="text-gray-700 text-sm">{currentEntry.aiAnalysis.summary}</p>
                         </div>
                         <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                             <h4 className="text-xs uppercase font-bold text-gray-400 mb-2">Advice</h4>
                             <p className="text-gray-700 text-sm italic">"{currentEntry.aiAnalysis.advice}"</p>
                         </div>
                     </div>
                     
                     <div className="mt-4 flex flex-wrap gap-2">
                         {currentEntry.aiAnalysis.tags.map(tag => (
                             <span key={tag} className="px-2 py-1 bg-white text-indigo-600 text-xs rounded-full border border-indigo-100 font-medium">
                                 #{tag}
                             </span>
                         ))}
                     </div>
                 </div>
             )}
           </div>
        </div>
      </div>
    </Layout>
  );
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UPDATED: Added Claude (default) + ChatGPT model selector.
 * Gemini retained only for audio transcription.
 * Changes marked with // *** ADDED *** or // *** CHANGED ***
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  FileText, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Settings,
  BookOpen,
  MessageSquare,
  FileUp,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Save,
  LogOut,
  LogIn,
  User as UserIcon,
  Search,
  Cloud,
  X,
  Type,
  Share2,
  Shield,
  Calendar,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Anthropic from '@anthropic-ai/sdk';           // *** ADDED ***
import OpenAI from 'openai';                          // *** ADDED ***
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  or,
  Timestamp,
  serverTimestamp,
  getDocFromServer,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { DEFAULT_LIBRARY, LibraryItem } from './lib/defaultLibrary';
import { formatLibraryName } from './lib/utils';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface ExtractedFile {
  id: string;
  name: string;
  content: string;
  type: string;
}

interface Student {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  dob?: string;
  age?: string;
  pronouns?: string;
  school?: string;
  evalType?: string;
  eligibilityAreas?: string[];
  clinicalDirection: string;
  brainDump: string;
  generatedReport: string;
  selectedItems: string[];
  extractedFiles: ExtractedFile[];
  updatedAt: any;
  ownerId: string;
}

// *** ADDED: Type for model selection ***
type ModelChoice = 'claude' | 'chatgpt' | 'gemini';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) message = `Firebase Error: ${parsed.error}`;
      } catch (e) {
        message = this.state.error.message || message;
      }
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-rose-100">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-600 text-sm mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-sage-600 text-white rounded-xl font-bold hover:bg-sage-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function METApp() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [school, setSchool] = useState('');
  const [evalType, setEvalType] = useState('Initial');
  const [eligibilityAreas, setEligibilityAreas] = useState<string[]>([]);
  
  const [clinicalDirection, setClinicalDirection] = useState('');
  const [brainDump, setBrainDump] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(DEFAULT_LIBRARY);
  const [selectedItems, setSelectedItems] = useState<string[]>(['v-lisa', 'i-std', 'i-source']);
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveExporting, setIsDriveExporting] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedFileName, setPastedFileName] = useState('');
  const [importCategory, setImportCategory] = useState<'auto' | LibraryItem['category']>('auto');
  const [hiddenLibraryIds, setHiddenLibraryIds] = useState<string[]>([]);
  const [recordingTarget, setRecordingTarget] = useState<'brainDump' | 'clinicalDirection' | 'refinementInput'>('brainDump');

  // *** ADDED: Model selection state — Claude is the default ***
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('claude');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatSessionRef = useRef<any>(null); // kept for Gemini refinement fallback

  // *** ADDED: Shared conversation history for Claude & ChatGPT multi-turn refinement ***
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  // *** ADDED: Store system prompt so refinement can reuse it ***
  const systemPromptRef = useRef<string>('');

  // --- API Client Initialization ---
  // Gemini — kept for audio transcription only
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  // *** ADDED: Claude client ***
  const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    dangerouslyAllowBrowser: true,
  });

  // *** ADDED: OpenAI (ChatGPT) client ***
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true,
  });

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Connection Test ---
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // --- Load Students List ---
  useEffect(() => {
    if (!user) {
      setStudents([]);
      return;
    }

    const q = query(
      collection(db, 'students'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, [user]);

  // --- Load Library from Firestore ---
  useEffect(() => {
    if (!user) {
      const savedLibrary = localStorage.getItem('met_library');
      let items: LibraryItem[] = [];
      if (savedLibrary) {
        try {
          const parsed = JSON.parse(savedLibrary);
          if (Array.isArray(parsed)) items = parsed;
        } catch (e) {
          items = [];
        }
      }
      
      const filteredUserItems = items.filter(i => 
        !DEFAULT_LIBRARY.some(def => 
          def.name.toLowerCase() === i.name.toLowerCase() && def.category === i.category
        )
      );
      
      const merged = [...filteredUserItems];
      DEFAULT_LIBRARY.forEach(def => {
        if (!hiddenLibraryIds.includes(def.id)) {
          merged.push(def);
        }
      });
      setLibraryItems(merged.filter(i => !hiddenLibraryIds.includes(i.id)));
      return;
    }

    const q = query(
      collection(db, 'library'), 
      where('ownerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items: LibraryItem[] = [];
      if (!snapshot.empty) {
        items = snapshot.docs.map(doc => {
          const data = doc.data();
          let name = data.name;
          if (data.ownerId === user.uid && name === name.toUpperCase()) {
            name = formatLibraryName(name);
            updateDoc(doc.ref, { name }).catch(console.error);
          }
          return { id: doc.id, ...data, name } as LibraryItem;
        });
      }

      const filteredUserItems = items.filter(i => 
        !DEFAULT_LIBRARY.some(def => 
          def.name.toLowerCase() === i.name.toLowerCase() && def.category === i.category
        )
      );

      const merged = [...filteredUserItems];
      DEFAULT_LIBRARY.forEach(def => {
        if (!hiddenLibraryIds.includes(def.id)) {
          merged.push(def);
        }
      });
      setLibraryItems(merged.filter(i => !hiddenLibraryIds.includes(i.id)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'library');
    });

    return () => unsubscribe();
  }, [user, hiddenLibraryIds]);

  // --- Load Hidden Items ---
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('met_hidden_library');
      if (saved) setHiddenLibraryIds(JSON.parse(saved));
      return;
    }

    const q = query(collection(db, 'hidden_library_items'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().itemId);
      setHiddenLibraryIds(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hidden_library_items');
    });

    return () => unsubscribe();
  }, [user]);

  // --- Local Storage Sync for Unauthenticated Users ---
  useEffect(() => {
    if (!user && libraryItems.length > DEFAULT_LIBRARY.length) {
      localStorage.setItem('met_library', JSON.stringify(libraryItems));
    }
  }, [libraryItems, user]);

  // --- Functions ---
  const showStatus = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
      showStatus("Logged in successfully", "success");
    } catch (err) {
      console.error("Login error:", err);
      showStatus("Login failed", "error");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentStudentId(null);
      resetForm(false);
      showStatus("Logged out", "info");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const resetForm = (openModal: any = true) => {
    const shouldOpen = typeof openModal === 'boolean' ? openModal : true;
    setStudentName('');
    setFirstName('');
    setLastName('');
    setGrade('');
    setDob('');
    setAge('');
    setPronouns('');
    setSchool('');
    setEvalType('Initial');
    setEligibilityAreas([]);
    setClinicalDirection('');
    setBrainDump('');
    setGeneratedReport('');
    setExtractedFiles([]);
    setSelectedItems(['v-lisa', 'i-std', 'i-source']);
    setCurrentStudentId(null);
    if (shouldOpen) setIsNewCaseModalOpen(true);
  };

  const saveStudent = async (saveAsNew = false) => {
    if (!user) {
      showStatus("Please log in to save", "error");
      return;
    }
    if (!studentName.trim()) {
      showStatus("Student name is required", "error");
      return;
    }

    setIsSaving(true);
    const studentId = (saveAsNew || !currentStudentId) ? Math.random().toString(36).substr(2, 9) : currentStudentId;
    
    const studentData = {
      name: studentName,
      firstName,
      lastName,
      grade,
      dob,
      age,
      pronouns,
      school,
      evalType,
      eligibilityAreas,
      clinicalDirection,
      brainDump,
      generatedReport,
      selectedItems,
      extractedFiles,
      ownerId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'students', studentId), studentData);
      setCurrentStudentId(studentId);
      showStatus(saveAsNew ? "New student case created" : "Student case saved", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${studentId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const loadStudent = (student: Student) => {
    setCurrentStudentId(student.id);
    setStudentName(student.name);
    
    if (!student.firstName && !student.lastName && student.name) {
      const parts = student.name.trim().split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(student.name);
        setLastName('');
      }
    } else {
      setFirstName(student.firstName || '');
      setLastName(student.lastName || '');
    }

    setGrade(student.grade || '');
    setDob(student.dob || '');
    setAge(student.age || '');
    setPronouns(student.pronouns || '');
    setSchool(student.school || '');
    setEvalType(student.evalType || 'Initial');
    setEligibilityAreas(student.eligibilityAreas || []);
    setClinicalDirection(student.clinicalDirection || '');
    setBrainDump(student.brainDump || '');
    setGeneratedReport(student.generatedReport || '');
    setSelectedItems(student.selectedItems || ['v-lisa', 'i-std', 'i-source']);
    setExtractedFiles(student.extractedFiles || []);
    showStatus(`Loaded case: ${student.name}`, "success");
  };

  const deleteStudent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this student case?")) return;

    try {
      await deleteDoc(doc(db, 'students', id));
      if (currentStudentId === id) resetForm();
      showStatus("Student case deleted", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    }
  };

  const handleLibraryImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    showStatus(`Importing ${files.length} library items...`);
    
    const newItems: LibraryItem[] = [];
    for (const file of Array.from(files)) {
      const lowerName = file.name.toLowerCase();
      
      if (!lowerName.endsWith('.md') || lowerName.includes('readme')) continue;

      const content = await file.text();
      let category: LibraryItem['category'] = 'skills';
      
      if (importCategory !== 'auto') {
        category = importCategory;
      } else {
        if (lowerName.includes('voice checker')) category = 'skills';
        else if (lowerName.includes('voice')) category = 'voice';
        else if (lowerName.includes('instruction') || lowerName.includes('met framework')) category = 'instructions';
        else if (lowerName.includes('gold') || lowerName.includes('example') || lowerName.includes('standard') || lowerName.includes('sample') || lowerName.includes('exemplar')) category = 'gold';
        else if (lowerName.includes('eligibility') || lowerName.includes('criteria') || lowerName.includes('reference') || lowerName.includes('assurance') || lowerName.includes('statement')) category = 'references';
      }

      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        name: formatLibraryName(file.name),
        content,
        category
      });
    }

    if (user) {
      for (const item of newItems) {
        try {
          await setDoc(doc(db, 'library', item.id), { ...item, ownerId: user.uid });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `library/${item.id}`);
        }
      }
    } else {
      const currentCustom = JSON.parse(localStorage.getItem('met_library') || '[]');
      const updatedCustom = [...currentCustom, ...newItems.map(i => ({ ...i, ownerId: 'local' }))];
      localStorage.setItem('met_library', JSON.stringify(updatedCustom));
      setLibraryItems(prev => [...prev, ...newItems.map(i => ({ ...i, ownerId: 'local' }))]);
    }
    showStatus(`Imported ${newItems.length} items successfully`, "success");
  };

  const fixLibraryNames = async () => {
    if (!user) return;
    showStatus("Cleaning up library names...");
    let fixedCount = 0;
    
    for (const item of libraryItems) {
      if (item.ownerId === user.uid) {
        const newName = formatLibraryName(item.name);
        if (newName !== item.name) {
          try {
            await updateDoc(doc(db, 'library', item.id), { name: newName });
            fixedCount++;
          } catch (error) {
            console.error("Error fixing name for", item.id, error);
          }
        }
      }
    }
    showStatus(`Fixed ${fixedCount} library names`, "success");
  };

  const resetLibrary = async () => {
    if (!confirm("⚠️ WIPE ALL UPLOADED FILES?\n\nThis will permanently delete all your custom library items and restore the default settings. This cannot be undone. Are you sure?")) return;

    setIsSaving(true);
    setLibraryItems(DEFAULT_LIBRARY);
    setHiddenLibraryIds([]);
    setSelectedItems(['v-lisa', 'i-std', 'i-source']);
    
    try {
      if (user) {
        const q = query(collection(db, 'library'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        const hq = query(collection(db, 'hidden_library_items'), where('userId', '==', user.uid));
        const hSnapshot = await getDocs(hq);
        const hDeletePromises = hSnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(hDeletePromises);
      }
      
      localStorage.removeItem('met_library');
      localStorage.removeItem('met_hidden_library');
      
      showStatus("Library wiped and reset to defaults", "success");
    } catch (error) {
      console.error("Reset error:", error);
      showStatus("Failed to wipe library. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLibraryItem = async (item: LibraryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isOwner = item.ownerId === user?.uid || item.ownerId === 'local';
    const isDefault = !item.ownerId;

    if (isOwner && !confirm(`⚠️ PERMANENTLY DELETE\n\nAre you sure you want to delete "${item.name}"? This cannot be undone.`)) return;
    if (isDefault && !confirm(`⚠️ HIDE ITEM\n\nHide "${item.name}" from your library? You can restore it later.`)) return;

    if (user) {
      try {
        if (item.ownerId === user.uid) {
          await deleteDoc(doc(db, 'library', item.id));
        } else {
          await addDoc(collection(db, 'hidden_library_items'), {
            userId: user.uid,
            itemId: item.id,
            createdAt: serverTimestamp()
          });
        }
        showStatus("Item removed", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `library/${item.id}`);
      }
    } else {
      if (isDefault) {
        const newHidden = [...hiddenLibraryIds, item.id];
        setHiddenLibraryIds(newHidden);
        localStorage.setItem('met_hidden_library', JSON.stringify(newHidden));
      } else {
        const current = JSON.parse(localStorage.getItem('met_library') || '[]');
        const updated = current.filter((i: any) => i.id !== item.id);
        localStorage.setItem('met_library', JSON.stringify(updated));
        setLibraryItems(prev => prev.filter(i => i.id !== item.id));
      }
      showStatus("Item removed", "success");
    }
  };

  const startRecording = async (target: 'brainDump' | 'clinicalDirection' | 'refinementInput' = 'brainDump') => {
    try {
      setRecordingTarget(target);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob, target);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showStatus("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Audio transcription stays on Gemini — it's uniquely good at this
  const transcribeAudio = async (blob: Blob, target: 'brainDump' | 'clinicalDirection' | 'refinementInput') => {
    setIsTranscribing(true);
    showStatus("Transcribing audio...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Transcribe this audio accurately. Only return the transcription text." },
                { inlineData: { data: base64Audio, mimeType: "audio/webm" } }
              ]
            }
          ]
        });

        const transcript = response.text || "";
        
        if (target === 'clinicalDirection') {
          setClinicalDirection(prev => prev + (prev ? "\n\n" : "") + transcript);
        } else if (target === 'refinementInput') {
          setRefinementInput(prev => prev + (prev ? "\n\n" : "") + transcript);
        } else {
          setBrainDump(prev => prev + (prev ? "\n\n" : "") + transcript);
        }
        
        showStatus("Transcription complete!", "success");
      };
    } catch (err) {
      console.error("Transcription error:", err);
      showStatus("Transcription failed", "error");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePasteSource = () => {
    if (!pastedText.trim()) return;
    const name = pastedFileName.trim() || `Pasted Source ${new Date().toLocaleTimeString()}`;
    setExtractedFiles(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content: pastedText,
      type: "text/plain"
    }]);
    setPastedText('');
    setPastedFileName('');
    setIsPasteModalOpen(false);
    showStatus("Source text added", "success");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    showStatus(`Processing ${files.length} file(s)...`);
    
    for (const file of Array.from(files)) {
      try {
        let text = "";
        if (file.type === "text/plain") {
          text = await file.text();
        } else if (file.type === "application/pdf") {
          text = await extractTextFromPdf(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          text = await extractTextFromDocx(file);
        } else if (file.type.startsWith("image/")) {
          text = await extractTextFromImage(file);
        }

        setExtractedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: text,
          type: file.type
        }]);
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        showStatus(`Failed to process ${file.name}`, "error");
      }
    }
    showStatus("Files processed successfully", "success");
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    const result = await Tesseract.recognize(file, 'eng');
    return result.data.text;
  };

  // *** CHANGED: generateReport now routes to Claude (default) or ChatGPT ***
  const generateReport = async () => {
    setIsGenerating(true);
    const modelLabel = selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini';
    showStatus(`Generating report with ${modelLabel}...`);

    try {
      const selectedVoice = libraryItems.filter(i => i.category === 'voice' && selectedItems.includes(i.id)).map(i => i.content).join("\n");
      const selectedInstructions = libraryItems.filter(i => i.category === 'instructions' && selectedItems.includes(i.id)).map(i => i.content).join("\n");
      const selectedSkills = libraryItems.filter(i => i.category === 'skills' && selectedItems.includes(i.id)).map(i => i.content).join("\n");
      const selectedGold = libraryItems.filter(i => i.category === 'gold' && selectedItems.includes(i.id)).map(i => i.content).join("\n");
      const selectedReferences = libraryItems.filter(i => i.category === 'references' && selectedItems.includes(i.id)).map(i => i.content).join("\n");
      const sourceData = extractedFiles.map(f => `File: ${f.name}\nContent: ${f.content}`).join("\n\n");

      const userPrompt = `
=== CLINICAL DIRECTION ===
${clinicalDirection || "No specific clinical direction provided."}

=== VOICE LOCK ===
${selectedVoice || "Follow Lisa's Authentic Voice: Direct, concrete, school-based, professional but human. State concerns plainly. No softening."}

=== PROJECT INSTRUCTIONS ===
${selectedInstructions || "Follow Lisa's MET Framework: Strict score classification, no em dashes, no contrast constructions."}

=== SKILL ===
${selectedSkills || "Apply clinical synthesis skills as defined in Lisa's framework."}

=== GOLD STANDARD ===
${selectedGold || "Refer to gold standard reports for structure and clinical organization."}

=== ELIGIBILITY REFERENCES ===
${selectedReferences || "No specific eligibility references provided."}

=== SOURCE DATA ===
${sourceData || "No source files uploaded."}

=== BRAIN DUMP / NOTES ===
${brainDump || "No additional notes provided."}

INSTRUCTION:
1. ANALYZE: First, identify the key clinical patterns, strengths, and weaknesses across all SOURCE DATA.
2. SYNTHESIZE: Connect these findings into a cohesive narrative. Do not just list facts. Tell the student's story as it relates to their educational performance.
3. WRITE: Generate the MET report section following the PRIORITIES IN THIS EXACT ORDER:
   - **Authentic Lisa Voice First**: Match the exact tone, phrasing, and personality from the VOICE LOCK. No AI fluff.
   - **Natural Story-Like Narrative**: Tell a cohesive, flowing story. Use sophisticated sentence structures and natural rhythm. Avoid short, 4-5 word sentences; instead, combine related ideas into flowing, meaningful sentences that reflect clinical depth. Avoid choppy or list-like output.
   - **Strict Rule Following**: Obey all rules (no em-dashes, no contrast constructions, no softening severity, precise scoring, banned words).
   - Format in Markdown with clear paragraphs.
`;

      // *** ADDED: System prompt stored in ref so refinement can reuse it ***
      const systemPrompt = `
You are helping Lisa Work, a school psychologist, write Multidisciplinary Evaluation Team (MET) reports.
You write in Lisa's authentic voice and follow her MET framework exactly.

PRIORITIES IN THIS EXACT ORDER:
1. **Authentic Lisa Voice First** — Match the exact tone, phrasing, directness, warmth, and personality from the VOICE LOCK section (especially the v-lisa file from the 4-hour interview). This is the highest priority. Never add AI-style fluff, softening, or generic language.
2. **Natural Story-Like Narrative** — Tell a cohesive, flowing story about this child. Synthesize all data into one unified clinical picture that feels human and school-based. Use sophisticated sentence structures and natural rhythm — never sound robotic, choppy, basic, or list-like. Avoid short, 4-5 word sentences; instead, combine related ideas into flowing, meaningful sentences that reflect a 24-year veteran's clinical depth.
3. **Strict Rule Following** — Obey every rule without exception:
   - No em-dashes (use commas or periods instead).
   - No contrast constructions ("not X but Y" or similar).
   - Never soften severity — state what actually happened plainly.
   - Precise scoring: Average ≥ 25th percentile, Low Average 11–24th, Below Average ≤ 10th.
   - Direct, concrete, professional-but-human school language.
   - No words like "reflects", "furthermore", "notably", "highlights", "additionally", "appears", "consistent with".

Write in clear paragraphs. The final report should read exactly like something Lisa would write herself.
`;
      systemPromptRef.current = systemPrompt;

      // *** CHANGED: Route to Claude or ChatGPT ***
      if (selectedModel === 'claude') {
        // --- Claude ---
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          temperature: 0.4,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const reportText = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('');

        // Store history for multi-turn refinement
        conversationHistoryRef.current = [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: reportText },
        ];
        chatSessionRef.current = null; // clear any previous Gemini session

        setGeneratedReport(reportText);

      } else {
        // --- ChatGPT ---
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const reportText = response.choices[0].message.content || '';

        // Store history for multi-turn refinement
        conversationHistoryRef.current = [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: reportText },
        ];
        chatSessionRef.current = null;

        setGeneratedReport(reportText);
      } else {
        // --- Gemini ---
        const chat = ai.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
            topP: 1.0,
          }
        });
        chatSessionRef.current = chat;
        conversationHistoryRef.current = [];
        const response = await chat.sendMessage({ message: userPrompt });
        setGeneratedReport(response.text || "");
      }

      showStatus("Report generated!", "success");
      
      if (currentStudentId) {
        saveStudent(false);
      }
    } catch (err) {
      console.error("Generation error:", err);
      showStatus("Failed to generate report", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // *** CHANGED: refineReport now routes to Claude or ChatGPT ***
  const refineReport = async () => {
    if (!refinementInput.trim()) return;
    if (conversationHistoryRef.current.length === 0 && !chatSessionRef.current) return;

    setIsRefining(true);
    showStatus(`Refining with ${selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'}...`);

    const refinementMessage = `REFINEMENT INSTRUCTION: ${refinementInput}\n\nUpdate the report based on this instruction while maintaining all previous rules and voice lock.`;

    try {
      if (selectedModel === 'claude') {
        // --- Claude refinement ---
        const messages = [
          ...conversationHistoryRef.current,
          { role: 'user' as const, content: refinementMessage },
        ];

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          temperature: 0.4,
          system: systemPromptRef.current,
          messages,
        });

        const refined = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('');

        conversationHistoryRef.current = [
          ...messages,
          { role: 'assistant', content: refined },
        ];

        setGeneratedReport(refined);

      } else if (selectedModel === 'chatgpt') {
        // --- ChatGPT refinement ---
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPromptRef.current },
          ...conversationHistoryRef.current.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: refinementMessage },
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.4,
          messages,
        });

        const refined = response.choices[0].message.content || '';

        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: 'user', content: refinementMessage },
          { role: 'assistant', content: refined },
        ];

        setGeneratedReport(refined);

      } else if (chatSessionRef.current) {
        // Fallback: legacy Gemini session still active
        const response = await chatSessionRef.current.sendMessage({ 
          message: `REFINEMENT INSTRUCTION: ${refinementInput}\n\nUpdate the report based on this instruction while maintaining all previous rules and voice lock.` 
        });
        setGeneratedReport(response.text || "");
      }

      setRefinementInput('');
      showStatus("Report refined!", "success");

      if (currentStudentId) {
        saveStudent(false);
      }
    } catch (err) {
      console.error("Refinement error:", err);
      showStatus("Failed to refine report", "error");
    } finally {
      setIsRefining(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    showStatus("Copied to clipboard", "success");
  };

  const shareApp = async () => {
    const shareData = {
      title: 'MET Report Writer',
      text: 'Check out this MET Report Writer tool for school psychologists.',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showStatus("App link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error("Share error:", err);
      await navigator.clipboard.writeText(window.location.href);
      showStatus("App link copied to clipboard!", "success");
    }
  };

  const exportToDrive = async () => {
    if (!user) {
      showStatus("Please log in to export to Drive", "error");
      return;
    }

    let currentToken = googleAccessToken;
    if (!currentToken) {
      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          currentToken = credential.accessToken;
          setGoogleAccessToken(currentToken);
        } else {
          showStatus("Failed to obtain Google Drive access", "error");
          return;
        }
      } catch (err) {
        console.error("Drive auth error:", err);
        showStatus("Google Drive authentication failed", "error");
        return;
      }
    }

    if (!generatedReport) {
      showStatus("No report to export", "error");
      return;
    }

    setIsDriveExporting(true);
    showStatus("Exporting to Google Drive...");

    try {
      const studentFolderName = `MET Reports - ${studentName || 'Unnamed Student'}`;
      let folderId = '';

      const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${studentFolderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const searchResult = await searchResponse.json();
      
      if (searchResult.files && searchResult.files.length > 0) {
        folderId = searchResult.files[0].id;
      } else {
        const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: studentFolderName,
            mimeType: 'application/vnd.google-apps.folder'
          })
        });
        const folderResult = await createFolderResponse.json();
        folderId = folderResult.id;
      }

      const fileName = `MET_Report_Section_${new Date().toISOString().split('T')[0]}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
              body { 
                font-family: "Times New Roman", Times, serif; 
                font-size: 10pt; 
                line-height: 1.05;
              }
              h1, h2, h3 { font-family: "Times New Roman", Times, serif; }
            </style>
          </head>
          <body>
            ${generatedReport.split('\n').map(line => `<p>${line}</p>`).join('')}
          </body>
        </html>
      `;

      const metadata = {
        name: fileName,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([htmlContent], { type: 'text/html' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&convert=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Drive API error');
      }

      const result = await response.json();
      showStatus("Exported to Google Drive successfully!", "success");
      window.open(`https://docs.google.com/document/d/${result.id}/edit`, '_blank');
    } catch (error) {
      console.error("Drive export error:", error);
      showStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsDriveExporting(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MET_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleItem = (id: string, category: LibraryItem['category']) => {
    if (category === 'voice') {
      const categoryIds = libraryItems.filter(i => i.category === category).map(i => i.id);
      setSelectedItems(prev => [...prev.filter(i => !categoryIds.includes(i)), id]);
    } else {
      setSelectedItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  // --- Render Helpers ---
  const renderLibrarySection = (title: string, category: LibraryItem['category'], icon: React.ReactNode, type: 'single' | 'multi' = 'multi') => {
    const items = libraryItems.filter(i => i.category === category);
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sage-700 font-bold text-xs uppercase tracking-wider">
          {icon}
          <span>{title}</span>
          <span className="ml-auto text-[10px] bg-sage-200 px-1.5 py-0.5 rounded text-sage-600">
            {type === 'single' ? 'Single' : 'Multi'}
          </span>
        </div>
        <div className="space-y-2">
          {items.map(item => {
            const isOwner = item.ownerId === user?.uid || item.ownerId === 'local';
            
            return (
              <div key={item.id} className="group relative">
                <button
                  onClick={() => toggleItem(item.id, category)}
                  className={cn(
                    "w-full text-left p-3 pr-16 rounded-xl border transition-all duration-200 text-sm",
                    selectedItems.includes(item.id)
                      ? "bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-200"
                      : "bg-white border-sage-200 text-sage-800 hover:border-sage-400"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.name}</span>
                      {selectedItems.includes(item.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    {item.ownerId === 'local' && (
                      <span className="text-[10px] opacity-60 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Local File
                      </span>
                    )}
                    {!item.ownerId && (
                      <span className="text-[10px] opacity-60 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Project File
                      </span>
                    )}
                  </div>
                </button>
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                  <button
                    onClick={(e) => deleteLibraryItem(item, e)}
                    className={cn(
                      "p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                      selectedItems.includes(item.id) ? "hover:bg-white/20 text-white" : "hover:bg-rose-50 text-rose-400 hover:text-rose-600"
                    )}
                    title={isOwner ? "Delete item permanently" : "Hide item from library"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-xs text-sage-400 italic px-3">No items in this category</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sage-100 text-slate-800 font-sans selection:bg-sage-200">
      {/* Header */}
      <header className="h-16 border-b border-sage-200 flex items-center justify-between px-6 bg-sage-600 text-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">MET Report Writer</h1>
        </div>
        
        <div className="flex items-center gap-4">

          {/* *** ADDED: Model selector toggle *** */}
          <div className="flex items-center gap-1 bg-white/15 rounded-full p-1 border border-white/20">
            <button
              onClick={() => setSelectedModel('claude')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all",
                selectedModel === 'claude'
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-white/70 hover:text-white"
              )}
              title="Use Claude (default — best voice fidelity)"
            >
              Claude
            </button>
            <button
              onClick={() => setSelectedModel('chatgpt')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all",
                selectedModel === 'chatgpt'
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-white/70 hover:text-white"
              )}
              title="Use ChatGPT (GPT-4o)"
            >
              ChatGPT
            </button>
            <button
              onClick={() => setSelectedModel('gemini')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all",
                selectedModel === 'gemini'
                  ? "bg-white text-sage-700 shadow-sm"
                  : "text-white/70 hover:text-white"
              )}
              title="Gemini (original)"
            >
              Gemini
            </button>
          </div>

          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm",
                  statusMessage.type === 'success' ? "bg-emerald-500 text-white" :
                  statusMessage.type === 'error' ? "bg-rose-500 text-white" :
                  "bg-white text-sage-700"
                )}
              >
                {statusMessage.type === 'error' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>

          {user ? (
            <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-sage-400 flex items-center justify-center text-[10px] font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{user.displayName || user.email}</span>
              <button onClick={logout} className="p-1 hover:text-rose-200 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 bg-white text-sage-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-sage-50 transition-all shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}

          <button 
            onClick={shareApp}
            className="p-2 text-white/80 hover:text-white transition-colors"
            title="Share App"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-white/80 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Sidebar: Case Manager & Library (25%) */}
        <aside className="w-[25%] border-r border-sage-200 flex flex-col bg-white/50">
          {/* Case Manager Section */}
          <div className="p-4 border-b border-sage-200 bg-white/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sage-700">
                <Users className="w-5 h-5" />
                <h2 className="font-semibold text-sm">Caseload ({students.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-sage-500 font-medium animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Saving...
                  </div>
                ) : currentStudentId && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    Saved
                  </div>
                )}
              </div>
            </div>

            {user ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-sage-50 border border-sage-200 rounded-xl text-sm focus:ring-2 focus:ring-sage-500/50 outline-none transition-all"
                  />
                </div>

                <div className="max-h-[160px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                    <div
                      key={student.id}
                      onClick={() => loadStudent(student)}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all",
                        currentStudentId === student.id 
                          ? "bg-sage-600 text-white shadow-md" 
                          : "hover:bg-sage-100 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserIcon className={cn("w-4 h-4 shrink-0", currentStudentId === student.id ? "text-white" : "text-sage-500")} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{student.name}</span>
                          {student.updatedAt && (
                            <span className={cn("text-[10px] opacity-60", currentStudentId === student.id ? "text-white" : "text-slate-400")}>
                              Last updated: {new Date(student.updatedAt.seconds * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteStudent(student.id, e)}
                        className={cn(
                          "p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                          currentStudentId === student.id ? "hover:bg-white/20 text-white" : "hover:bg-rose-100 text-rose-500"
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <p className="text-xs text-sage-400 italic text-center py-4">No student cases found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-sage-50 rounded-2xl border border-dashed border-sage-200">
                <p className="text-xs text-sage-500 mb-3">Login to manage student cases</p>
                <button 
                  onClick={login}
                  className="text-xs font-bold text-sage-600 hover:underline"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </div>

          {/* Library Section */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sage-700">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="font-semibold">Library</h2>
                </div>
                <button 
                  onClick={resetLibrary}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded transition-colors uppercase tracking-wider"
                  title="Delete all your uploaded files and restore defaults"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-sage-500 uppercase tracking-tighter">Import Destination</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value as any)}
                    className="flex-1 bg-white border border-sage-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sage-500"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="voice">Voice Anchors</option>
                    <option value="instructions">Project Instructions</option>
                    <option value="skills">Skills</option>
                    <option value="gold">Gold Standards</option>
                    <option value="references">Eligibility References</option>
                  </select>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept=".md"
                      onChange={handleLibraryImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="Import .md files to library"
                    />
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-sage-600 text-white hover:bg-sage-700 rounded-lg transition-all text-xs font-bold shadow-sm">
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Import</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {renderLibrarySection("Voice Anchors", "voice", <MessageSquare className="w-3 h-3" />, 'single')}
            {renderLibrarySection("Project Instructions", "instructions", <FileText className="w-3 h-3" />, 'multi')}
            {renderLibrarySection("Skills", "skills", <Wand2 className="w-3 h-3" />, 'multi')}
            {renderLibrarySection("Gold Standards", "gold", <CheckCircle2 className="w-3 h-3" />, 'multi')}
            {renderLibrarySection("Eligibility References", "references", <FileText className="w-3 h-3" />, 'multi')}
            
            <button 
              onClick={resetLibrary}
              disabled={isSaving}
              className="w-full mt-8 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {isSaving ? "Resetting..." : "Reset Library"}
            </button>
          </div>
        </aside>

        {/* Middle Column: Inputs (30%) */}
        <section className="w-[30%] border-r border-sage-200 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white/30">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name..."
                className="w-full pl-4 pr-24 py-3 bg-white border border-sage-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-sage-500/50 outline-none transition-all shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  onClick={resetForm}
                  className="p-1.5 bg-sage-600 text-white hover:bg-sage-700 rounded-lg transition-all shadow-sm"
                  title="New Case"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsNewCaseModalOpen(true)}
                  className="p-1.5 bg-sage-100 text-sage-600 hover:bg-sage-200 rounded-lg transition-all border border-sage-200"
                  title="Edit Student Details"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            {user && (
              <button 
                onClick={() => saveStudent(false)}
                disabled={isSaving || !studentName}
                className="p-3 bg-sage-600 text-white hover:bg-sage-700 rounded-2xl transition-all shadow-md disabled:opacity-30"
                title="Save Case"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Clinical Direction */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-sage-700 uppercase tracking-wider">
                Clinical Direction (Overrides)
              </label>
              <button
                onClick={() => isRecording ? stopRecording() : startRecording('clinicalDirection')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm",
                  isRecording && recordingTarget === 'clinicalDirection'
                    ? "bg-rose-500 text-white animate-pulse" 
                    : isRecording 
                      ? "bg-sage-200 text-sage-400 cursor-not-allowed"
                      : "bg-sage-600 text-white hover:bg-sage-700"
                )}
                disabled={isRecording && recordingTarget !== 'clinicalDirection'}
              >
                {isRecording && recordingTarget === 'clinicalDirection' ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                {isRecording && recordingTarget === 'clinicalDirection' ? "Stop Recording" : "Record Voice"}
              </button>
            </div>
            <textarea
              value={clinicalDirection}
              onChange={(e) => setClinicalDirection(e.target.value)}
              placeholder="Example: weave behavioral variability across sessions into interview narrative"
              className="w-full h-48 bg-white border border-sage-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sage-500/50 focus:border-sage-500 outline-none transition-all resize-none placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Data/Notes/Observations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-sage-700 uppercase tracking-wider">
                Data/Notes/Observations
              </label>
              <button
                onClick={() => isRecording ? stopRecording() : startRecording('brainDump')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm",
                  isRecording && recordingTarget === 'brainDump'
                    ? "bg-rose-500 text-white animate-pulse" 
                    : isRecording 
                      ? "bg-sage-200 text-sage-400 cursor-not-allowed"
                      : "bg-sage-600 text-white hover:bg-sage-700"
                )}
                disabled={isRecording && recordingTarget !== 'brainDump'}
              >
                {isRecording && recordingTarget === 'brainDump' ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                {isRecording && recordingTarget === 'brainDump' ? "Stop Recording" : "Record Voice"}
              </button>
            </div>
            <textarea
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              placeholder="Start talking or type your clinical data, notes, and observations here..."
              className="w-full h-80 bg-white border border-sage-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sage-500/50 focus:border-sage-500 outline-none transition-all resize-none placeholder:text-slate-400 custom-scrollbar shadow-sm"
            />
            {isTranscribing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-sage-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Transcribing...
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-sage-700 uppercase tracking-wider">
                Source Documents
              </label>
              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-sage-100 text-sage-700 hover:bg-sage-200 rounded-lg transition-all text-xs font-bold border border-sage-200 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Paste Text</span>
              </button>
            </div>
            <div className="relative group">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx,image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-sage-300 group-hover:border-sage-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all bg-white shadow-sm">
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center text-sage-600 group-hover:text-sage-700 transition-colors">
                  <FileUp className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Upload Files</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, or Images</p>
                </div>
              </div>
            </div>

            {extractedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {extractedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-sage-200 rounded-xl group shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-sage-600 shrink-0" />
                      <span className="text-xs font-medium truncate text-slate-700">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => setExtractedFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full py-4 bg-sage-600 hover:bg-sage-700 disabled:bg-sage-300 disabled:text-white text-white rounded-2xl font-bold shadow-lg shadow-sage-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {/* *** CHANGED: button label shows active model *** */}
              {isGenerating
                ? `${selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'} is writing...`
                : `Generate with ${selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'}`}
            </button>
            
            <button
              onClick={() => {
                if (confirm("Clear all session data?")) {
                  setBrainDump('');
                  setClinicalDirection('');
                  setExtractedFiles([]);
                  setSelectedItems([]);
                  setGeneratedReport('');
                }
              }}
              className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Clear Current Session
            </button>
          </div>
        </section>

        {/* Right Column: Output (50%) */}
        <section className="w-[50%] bg-sage-50/50 flex flex-col">
          <div className="h-14 border-b border-sage-200 flex items-center justify-between px-8 shrink-0 bg-white">
            <div className="flex items-center gap-2 text-sage-700">
              <FileText className="w-4 h-4" />
              {/* *** CHANGED: show active model in output header *** */}
              <span className="text-sm font-bold">
                Generated Output
                {generatedReport && (
                  <span className="ml-2 text-[10px] font-normal text-sage-400 uppercase tracking-wider">
                    via {selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'}
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                disabled={!generatedReport}
                className="p-2 text-sage-600 hover:bg-sage-50 rounded-lg transition-all disabled:opacity-30"
                title="Copy to Clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={exportToDrive}
                disabled={!generatedReport || isDriveExporting}
                className="p-2 text-sage-600 hover:bg-sage-50 rounded-lg transition-all disabled:opacity-30"
                title="Save to Google Drive"
              >
                {isDriveExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              </button>
              <button
                onClick={downloadReport}
                disabled={!generatedReport}
                className="p-2 text-sage-600 hover:bg-sage-50 rounded-lg transition-all disabled:opacity-30"
                title="Download as TXT"
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-sage-200 mx-1" />
              <button
                onClick={generateReport}
                disabled={!generatedReport || isGenerating}
                className="p-2 text-sage-600 hover:bg-sage-50 rounded-lg transition-all disabled:opacity-30"
                title="Regenerate"
              >
                <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto min-h-full bg-white border border-sage-200 rounded-lg shadow-xl p-16 relative group">
              {!generatedReport && !isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-sage-300 pointer-events-none">
                  <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium opacity-60">Your report will appear here</p>
                  <p className="text-sm opacity-40 mt-2">Configure inputs and click Generate to start</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] z-10 rounded-lg">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
                      <Wand2 className="w-5 h-5 text-sage-600 absolute inset-0 m-auto" />
                    </div>
                    {/* *** CHANGED: dynamic loading text *** */}
                    <p className="text-sm font-medium text-sage-600 animate-pulse">
                      {selectedModel === 'claude' ? 'Claude' : selectedModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'} is writing...
                    </p>
                  </div>
                </div>
              )}

              <div className="prose prose-slate max-w-none">
                {generatedReport ? (
                  <div className="space-y-8">
                    <textarea
                      value={generatedReport}
                      onChange={(e) => setGeneratedReport(e.target.value)}
                      className="w-full min-h-[600px] bg-transparent border-none outline-none resize-none text-slate-800 leading-[1.05] placeholder:text-slate-300 custom-scrollbar"
                      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '10pt' }}
                    />
                    
                    <div className="mt-12 pt-8 border-t border-sage-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sage-700">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-bold uppercase tracking-wider">Refine this report</span>
                        </div>
                        <button
                          onClick={() => isRecording ? stopRecording() : startRecording('refinementInput')}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm",
                            isRecording && recordingTarget === 'refinementInput'
                              ? "bg-rose-500 text-white animate-pulse" 
                              : isRecording 
                                ? "bg-sage-200 text-sage-400 cursor-not-allowed"
                                : "bg-sage-600 text-white hover:bg-sage-700"
                          )}
                          disabled={isRecording && recordingTarget !== 'refinementInput'}
                        >
                          {isRecording && recordingTarget === 'refinementInput' ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                          {isRecording && recordingTarget === 'refinementInput' ? "Stop Recording" : "Record Voice"}
                        </button>
                      </div>
                      <div className="relative group">
                        <textarea
                          value={refinementInput}
                          onChange={(e) => setRefinementInput(e.target.value)}
                          placeholder="Example: Make the summary more concise or add more detail about the behavioral observations..."
                          className="w-full h-24 bg-sage-50 border border-sage-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sage-500/50 outline-none transition-all resize-none shadow-inner"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              refineReport();
                            }
                          }}
                        />
                        <button
                          onClick={refineReport}
                          disabled={isRefining || !refinementInput.trim()}
                          className="absolute right-3 bottom-3 p-2 bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-all shadow-md disabled:opacity-30 disabled:scale-95"
                        >
                          {isRefining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-sage-400 mt-2 text-center italic">
                        Press Enter to send refinement instructions
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* New Case Modal */}
      <AnimatePresence>
        {isNewCaseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewCaseModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-sage-100 flex items-center justify-between bg-sage-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sage-600 flex items-center justify-center text-white">
                    {currentStudentId ? <Settings className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{currentStudentId ? "Edit Student Details" : "New Student Case"}</h3>
                    <p className="text-xs text-slate-500">{currentStudentId ? "Update existing student information" : "Enter initial student details to start the report"}</p>
                  </div>
                </div>
                <button onClick={() => setIsNewCaseModalOpen(false)} className="p-2 hover:bg-sage-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">First Name</label>
                    <input 
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">Last Name</label>
                    <input 
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">Grade</label>
                    <input 
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">Date of Birth</label>
                    <input 
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">Age</label>
                    <input 
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">Pronouns</label>
                    <input 
                      type="text"
                      value={pronouns}
                      onChange={(e) => setPronouns(e.target.value)}
                      placeholder="e.g., he/him"
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-sage-700 uppercase mb-2">School</label>
                    <input 
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-sage-700 uppercase mb-3">Evaluation Type</label>
                  <div className="flex gap-3">
                    {['Initial', 'Reevaluation', 'PLAFP Report'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setEvalType(type)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          evalType === type 
                            ? "bg-sage-600 text-white border-sage-600 shadow-md" 
                            : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-sage-700 uppercase mb-3">Eligibility Areas under Consideration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['ASD', 'CI', 'EI', 'OHI', 'SLD', 'SLI', 'not applicable'].map((area) => (
                      <button
                        key={area}
                        onClick={() => {
                          if (area === 'not applicable') {
                            setEligibilityAreas(['not applicable']);
                          } else {
                            const newAreas = eligibilityAreas.filter(a => a !== 'not applicable');
                            if (newAreas.includes(area)) {
                              setEligibilityAreas(newAreas.filter(a => a !== area));
                            } else {
                              setEligibilityAreas([...newAreas, area]);
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                          eligibilityAreas.includes(area)
                            ? "bg-sage-100 text-sage-700 border-sage-300 shadow-sm"
                            : "bg-white text-sage-500 border-sage-100 hover:bg-sage-50"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded border flex items-center justify-center transition-all",
                          eligibilityAreas.includes(area) ? "bg-sage-600 border-sage-600 text-white" : "bg-white border-sage-200"
                        )}>
                          {eligibilityAreas.includes(area) && <Check className="w-2 h-2" />}
                        </div>
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-sage-50 border-t border-sage-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsNewCaseModalOpen(false)}
                  className="px-6 py-2 text-sage-600 font-bold text-xs hover:bg-sage-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setStudentName(`${firstName} ${lastName}`.trim());
                    setIsNewCaseModalOpen(false);
                    showStatus(currentStudentId ? "Details updated" : "New case initialized", "success");
                  }}
                  disabled={!firstName || !lastName}
                  className="px-8 py-2 bg-sage-600 text-white rounded-xl text-xs font-bold hover:bg-sage-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {currentStudentId ? "Update Details" : "Initialize Case"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-sage-100 flex items-center justify-between bg-sage-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sage-600 flex items-center justify-center text-white">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">App Settings</h3>
                    <p className="text-xs text-slate-500">Manage your library and application preferences</p>
                  </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-sage-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-sage-700 uppercase tracking-wider">Library Maintenance</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={fixLibraryNames}
                      className="flex items-center justify-between p-4 bg-sage-50 hover:bg-sage-100 rounded-2xl transition-all group border border-sage-100"
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold text-sage-800">Clean Up Names</p>
                        <p className="text-[10px] text-sage-500">Standardize file names to Title Case</p>
                      </div>
                      <RefreshCw className="w-4 h-4 text-sage-400 group-hover:text-sage-600 group-hover:rotate-180 transition-all duration-500" />
                    </button>
                    
                    <button 
                      onClick={resetLibrary}
                      className="flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all group border border-rose-100"
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold text-rose-800">Reset Library</p>
                        <p className="text-[10px] text-rose-500">Wipe all custom files and restore defaults</p>
                      </div>
                      <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-all" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-sage-700 uppercase tracking-wider">Account</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {user ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sage-400 flex items-center justify-center text-white font-bold">
                            {user.displayName?.charAt(0) || user.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{user.displayName || 'User'}</p>
                            <p className="text-[10px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <button onClick={logout} className="text-xs font-bold text-rose-600 hover:underline">Sign Out</button>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-slate-500 mb-3">Sign in to sync your caseload across devices</p>
                        <button onClick={login} className="px-6 py-2 bg-sage-600 text-white rounded-xl text-xs font-bold hover:bg-sage-700 transition-all">Sign In with Google</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-sage-50 border-t border-sage-100 flex justify-center">
                <p className="text-[10px] text-sage-400">MET Report Writer v1.3.0 • Built for Lisa Work</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Paste Source Modal */}
      <AnimatePresence>
        {isPasteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-sage-100 flex items-center justify-between bg-sage-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sage-600 flex items-center justify-center text-white">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Paste Source Text</h3>
                    <p className="text-xs text-slate-500">Add text content directly as a source document</p>
                  </div>
                </div>
                <button onClick={() => setIsPasteModalOpen(false)} className="p-2 hover:bg-sage-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-sage-700 uppercase mb-2">Document Name</label>
                  <input 
                    type="text"
                    value={pastedFileName}
                    onChange={(e) => setPastedFileName(e.target.value)}
                    placeholder="e.g., Parent Interview Notes"
                    className="w-full px-4 py-2 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sage-700 uppercase mb-2">Content</label>
                  <textarea 
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-64 px-4 py-4 bg-sage-50 border border-sage-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sage-500/50 resize-none custom-scrollbar"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-sage-50 border-t border-sage-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasteSource}
                  disabled={!pastedText.trim()}
                  className="px-8 py-2 bg-sage-600 text-white rounded-xl font-bold hover:bg-sage-700 transition-all shadow-md disabled:opacity-50"
                >
                  Add Source
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1e1d1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #adc9ad;
        }
        
        .prose h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 2rem; color: #162416; }
        .prose h2 { font-size: 1.75rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 1.25rem; color: #2a412a; }
        .prose p { margin-bottom: 1.5rem; line-height: 1.05; color: #3c4043; }
        .prose ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1.5rem; }
        .prose li { margin-bottom: 0.75rem; color: #3c4043; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <METApp />
    </ErrorBoundary>
  );
}

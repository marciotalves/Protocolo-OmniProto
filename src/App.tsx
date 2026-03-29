/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as d3 from 'd3';
import { 
  Globe, 
  Server, 
  User, 
  MessageSquare, 
  Hash, 
  Shield, 
  Zap, 
  Plus, 
  Search, 
  MoreVertical,
  Share2,
  Heart,
  Repeat,
  ExternalLink,
  Activity,
  Cpu,
  Layers,
  Code,
  Link2,
  ArrowRightLeft,
  Info,
  Trash2,
  Network,
  Shuffle,
  Image,
  Video,
  Film,
  BarChart3,
  Palette,
  Layout,
  Type as TypeIcon,
  Twitter,
  Github,
  Instagram,
  X,
  Smartphone,
  FileText,
  MessageCircle,
  Repeat2,
  Grid,
  Bell,
  Home,
  ChevronDown,
  Link,
  Mic,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { verifyGenesisIdentity, GENESIS_PUBKEY } from './lib/genesis';

// --- OmniProto Types ---

interface SocialLink {
  platform: string;
  url: string;
}

interface OmniIdentity {
  pubkey: string;
  privkey?: string;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  cover?: string;
  socialLinks?: SocialLink[];
  instance?: string;
  email?: string;
  hasPassword?: boolean;
  followers: number;
  following: number;
  postsCount: number;
  website?: string;
  language?: string;
}

interface OmniEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number; // 1: Texto, 2: Ponte (Bridge), 3: Relay, 4: Identidade
  content: string;
  tags: string[][];
  sig: string;
  origin?: {
    protocol: string;
    source: string;
  };
}

interface Relay {
  url: string;
  status: 'online' | 'offline' | 'conectando';
  latency: number;
  eventsProcessed: number;
}

interface FediverseInstance {
  url: string;
  name: string;
  type: 'Mastodon' | 'Pleroma' | 'Misskey' | 'OmniProto' | 'Outro';
  region?: string;
  category?: 'Pública' | 'Governamental' | 'Institucional' | 'Privada/Cliente';
  activeUsers: number;
  isBridged: boolean;
}

// --- Protocol Authority (Genesis) ---
// A chave de autenticidade do criador original do OmniProto é verificada via hash.
// Ela é imutável e serve como prova de autoria em qualquer cliente que siga o protocolo.
const OMNI_GENESIS_HASH = GENESIS_PUBKEY;

// --- Dados Mockados ---

const MOCK_IDENTITY: OmniIdentity = {
  pubkey: OMNI_GENESIS_HASH,
  name: "Marcio Alves",
  username: "marciotalves",
  instance: "omni.social",
  language: "pt-BR",
  email: "marciotalves@gmail.com",
  bio: "Criador e Fundador do Protocolo OmniProto. Sejam bem-vindos ao futuro descentralizado.",
  avatar: "https://picsum.photos/seed/marcio/200/200",
  cover: "https://picsum.photos/seed/marciocover/1200/400",
  followers: 1250,
  following: 6,
  postsCount: 42,
  website: "https://omniproto.org.br",
  socialLinks: [
    { platform: 'Twitter', url: 'https://twitter.com/omni' },
    { platform: 'GitHub', url: 'https://github.com/omni' },
    { platform: 'Instagram', url: 'https://instagram.com/omni' }
  ]
};

const INITIAL_RELAYS: Relay[] = [
  { url: "wss://relay.omniproto.org.br", status: 'online', latency: 12, eventsProcessed: 145200 },
  { url: "wss://global.omni.network.br", status: 'online', latency: 45, eventsProcessed: 89000 },
  { url: "wss://br.relay.omni", status: 'conectando', latency: 0, eventsProcessed: 0 },
];

const INITIAL_INSTANCES: FediverseInstance[] = [
  { url: "mastodon.social", name: "Mastodon Principal", type: 'Mastodon', region: 'Global', category: 'Pública', activeUsers: 1200000, isBridged: true },
  { url: "gov.br.social", name: "Governo Federal BR", type: 'OmniProto', region: 'Brasil', category: 'Governamental', activeUsers: 50000, isBridged: true },
  { url: "misskey.io", name: "Misskey Japão", type: 'Misskey', region: 'Japão', category: 'Pública', activeUsers: 300000, isBridged: true },
  { url: "weibo.omni.cn", name: "Omni Weibo", type: 'OmniProto', region: 'China', category: 'Pública', activeUsers: 850000, isBridged: false },
  { url: "corporate.acme.com", name: "Acme Corp Interna", type: 'OmniProto', region: 'EUA', category: 'Privada/Cliente', activeUsers: 1200, isBridged: false },
  { url: "usp.br.omni", name: "Universidade de SP", type: 'OmniProto', region: 'Brasil', category: 'Institucional', activeUsers: 85000, isBridged: false },
];

interface CentralizedAPI {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
}

// --- Helpers ---

const generateKey = () => Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18);

function EventCard({ event, identity, density, onSelect }: { event: OmniEvent, identity: OmniIdentity | null, density: 'compact' | 'normal' | 'spacious', onSelect?: (e: OmniEvent) => void, key?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect?.(event)}
      className={`bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl hover:border-[#00FF00]/30 transition-all group cursor-pointer ${
        density === 'compact' ? 'p-4' : density === 'spacious' ? 'p-10' : 'p-6'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center overflow-hidden">
            <img src={event.pubkey === identity?.pubkey ? (identity?.avatar || `https://picsum.photos/seed/${identity?.pubkey}/100/100`) : `https://picsum.photos/seed/${event.pubkey}/100/100`} alt="Avatar" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--accent)] flex items-center gap-1">
                {event.pubkey === identity?.pubkey 
                  ? `@${identity?.username}${identity?.instance ? '@' + identity.instance : ''}` 
                  : `@${event.pubkey.slice(0, 10)}...`}
                {(event.pubkey === OMNI_GENESIS_HASH || (event.pubkey === identity?.pubkey && verifyGenesisIdentity(identity?.username, identity?.email).isGenesis)) && (
                  <Shield className="w-3 h-3 text-yellow-500 fill-yellow-500/20" title="Criador do Protocolo" />
                )}
              </span>
              <span className="text-xs text-[#666] font-medium">
                {event.pubkey === identity?.pubkey ? identity?.name : ''}
              </span>
              {event.origin && (
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Link2 className="w-2 h-2" /> {event.origin.protocol}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#444] font-mono">
              {new Date(event.created_at * 1000).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button className="text-[#444] hover:text-white"><MoreVertical className="w-4 h-4" /></button>
      </div>
      <p className="text-[#AAA] leading-relaxed mb-6">{event.content}</p>

      {/* Media Display */}
      {event.tags?.filter(t => t[0] === 'media').length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          {event.tags.filter(t => t[0] === 'media').map((m, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[#1A1A1A]">
              {m[1] === 'image' || m[1] === 'gif' ? (
                <img src={m[2]} className="w-full h-auto max-h-96 object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Media" />
              ) : (
                <div className="aspect-video bg-[#050505] flex flex-col items-center justify-center text-[#444] group-hover:text-[var(--accent)] transition-colors">
                  <Video className="w-12 h-12 mb-2" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Vídeo OmniProto</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Poll Display */}
      {event.kind === 3 && event.tags?.find(t => t[0] === 'poll') && (
        <div className="bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl space-y-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Enquete Omni</span>
          </div>
          {event.tags.find(t => t[0] === 'poll')?.slice(1).map((opt, i) => (
            <button key={i} className="w-full text-left p-3 rounded-lg border border-[#1A1A1A] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-xs font-medium">
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Cross-post Display */}
      {event.tags?.filter(t => t[0] === 'crosspost').length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.filter(t => t[0] === 'crosspost').map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
              <Link2 className="w-3 h-3" />
              Transmitido para: {t[1]}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8 text-[#444] text-xs">
          <button className="flex items-center gap-2 hover:text-pink-500 transition-colors"><Heart className="w-4 h-4" /> 24</button>
          <button className="flex items-center gap-2 hover:text-[#00FF00] transition-colors"><Repeat className="w-4 h-4" /> 12</button>
          <button className="flex items-center gap-2 hover:text-blue-500 transition-colors"><Share2 className="w-4 h-4" /></button>
        </div>
        <button className="text-[9px] font-mono text-[#333] group-hover:text-[#00FF00] transition-colors flex items-center gap-1">
          <Code className="w-3 h-3" /> VER RAW
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [identity, setIdentity] = useState<OmniIdentity | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'login_key' | 'login_user' | 'create' | 'recovery' | 'show_key'>('welcome');
  
  // Onboarding Form States
  const [inputKey, setInputKey] = useState('');
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  
  const [relays, setRelays] = useState<Relay[]>(INITIAL_RELAYS);
  const [instances, setInstances] = useState<FediverseInstance[]>(INITIAL_INSTANCES);
  const [events, setEvents] = useState<OmniEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'relays' | 'instances' | 'spec' | 'network' | 'bridge' | 'settings' | 'profile' | 'search' | 'notifications' | 'messages'>('feed');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPost, setNewPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPollUI, setShowPollUI] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [attachedMedia, setAttachedMedia] = useState<{type: 'image' | 'video' | 'gif', url: string}[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OmniEvent | null>(null);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'web'>('web');
  const [messages, setMessages] = useState<{id: string, sender: string, text: string, type: 'text' | 'audio' | 'image' | 'video', url?: string, timestamp: number}[]>([]);

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes(' x')) return <Twitter className="w-4 h-4" />;
    if (p.includes('github')) return <Github className="w-4 h-4" />;
    if (p.includes('instagram')) return <Instagram className="w-4 h-4" />;
    return <Link2 className="w-4 h-4" />;
  };

  const [isAddingRelay, setIsAddingRelay] = useState(false);
  const [newRelayUrl, setNewRelayUrl] = useState('');
  
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [newInstanceUrl, setNewInstanceUrl] = useState('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceRegion, setNewInstanceRegion] = useState('');
  const [newInstanceCategory, setNewInstanceCategory] = useState<'Pública' | 'Governamental' | 'Institucional' | 'Privada/Cliente'>('Pública');

  // Centralized APIs (Hybrid Clients)
  const [centralizedAPIs, setCentralizedAPIs] = useState<CentralizedAPI[]>([]);
  const [isAddingAPI, setIsAddingAPI] = useState(false);
  const [newApiName, setNewApiName] = useState('');
  const [newApiEndpoint, setNewApiEndpoint] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedAPIs, setSelectedAPIs] = useState<string[]>([]);

  // Account Switching & Modals
  const [accounts, setAccounts] = useState<OmniIdentity[]>([]);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const longPressTimer = useRef<any>(null);

  // Customization States
  const [accentColor, setAccentColor] = useState('#00FF00');
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'oled'>('dark');
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('omni_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setIdentity(parsed);
      setIsLoggedIn(true);
      setShowOnboarding(false);
      
      // Sync accounts
      const savedAccounts = localStorage.getItem('omni_accounts');
      if (savedAccounts) {
        const accs = JSON.parse(savedAccounts);
        setAccounts(accs);
        if (!accs.find((a: any) => a.pubkey === parsed.pubkey)) {
          const updatedAccs = [...accs, parsed];
          setAccounts(updatedAccs);
          localStorage.setItem('omni_accounts', JSON.stringify(updatedAccs));
        }
      } else {
        setAccounts([parsed]);
        localStorage.setItem('omni_accounts', JSON.stringify([parsed]));
      }
    }
  }, []);

  // Genesis Anti-Tampering Check
  const genesisCheck = verifyGenesisIdentity(identity?.username, identity?.email);
  if (genesisCheck.isTampered) {
    return (
      <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-8 text-center">
        <Shield className="w-24 h-24 mb-6 text-red-500" />
        <h1 className="text-4xl font-black mb-4 uppercase tracking-widest">Violação de Segurança</h1>
        <p className="text-xl max-w-2xl">
          O bloco Gênese do protocolo OmniProto foi adulterado. A identidade do criador original 
          (marciotalves) é imutável e protegida por múltiplas camadas de criptografia.
        </p>
        <p className="mt-4 text-red-300 font-mono text-sm">ERR_GENESIS_TAMPERED</p>
      </div>
    );
  }

  const switchAccount = (acc: OmniIdentity) => {
    setIdentity(acc);
    localStorage.setItem('omni_session', JSON.stringify(acc));
    setIsAccountSwitcherOpen(false);
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsAccountSwitcherOpen(true);
    }, 800);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleLoginWithKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.length < 16) return;
    const newIdent: OmniIdentity = {
      pubkey: "omni_pub_" + inputKey.slice(0, 8),
      privkey: inputKey,
      name: "Usuário_" + inputKey.slice(0, 4),
      username: "user_" + inputKey.slice(0, 4),
      bio: "Explorador do OmniProto via Chave Privada.",
      avatar: `https://picsum.photos/seed/${inputKey}/200/200`,
      followers: 0,
      following: 0,
      postsCount: 0,
      website: ""
    };
    setIdentity(newIdent);
    setIsLoggedIn(true);
    setShowOnboarding(false);
    localStorage.setItem('omni_session', JSON.stringify(newIdent));
    
    setAccounts(prev => {
      if (prev.find(a => a.pubkey === newIdent.pubkey)) return prev;
      const updated = [...prev, newIdent];
      localStorage.setItem('omni_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const priv = "omni_priv_" + generateKey();
    const newIdent: OmniIdentity = {
      pubkey: "omni_pub_" + generateKey(),
      privkey: priv,
      name: inputUser || "NovoOmni",
      username: inputUser || "novo_omni",
      bio: "Novo membro da rede descentralizada OmniProto.",
      avatar: `https://picsum.photos/seed/${priv}/200/200`,
      email: inputEmail,
      hasPassword: !!inputPass,
      followers: 0,
      following: 0,
      postsCount: 0,
      website: ""
    };
    setIdentity(newIdent);
    setIsLoggedIn(true);
    setShowOnboarding(false);
    localStorage.setItem('omni_session', JSON.stringify(newIdent));
    
    setAccounts(prev => {
      if (prev.find(a => a.pubkey === newIdent.pubkey)) return prev;
      const updated = [...prev, newIdent];
      localStorage.setItem('omni_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoginUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação: Em um app real, isso buscaria a chave criptografada no relay ou e-mail
    const simulatedPriv = "omni_priv_recovered_" + Math.random().toString(36).substr(2, 10);
    const newIdent: OmniIdentity = {
      pubkey: "omni_pub_recovered_" + Math.random().toString(36).substr(2, 10),
      privkey: simulatedPriv,
      name: inputUser,
      username: inputUser,
      bio: "Logado via Usuário/Senha (Abstração OmniProto).",
      avatar: `https://picsum.photos/seed/${inputUser}/200/200`,
      hasPassword: true,
      followers: 0,
      following: 0,
      postsCount: 0,
      website: ""
    };
    setIdentity(newIdent);
    setOnboardingStep('show_key');
    localStorage.setItem('omni_session', JSON.stringify(newIdent));
    
    setAccounts(prev => {
      if (prev.find(a => a.pubkey === newIdent.pubkey)) return prev;
      const updated = [...prev, newIdent];
      localStorage.setItem('omni_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySent(true);
    setTimeout(() => {
      setRecoverySent(false);
      setOnboardingStep('welcome');
      alert("Um link de recuperação foi enviado para o seu e-mail. Use-o para recuperar sua chave mestra.");
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('omni_session');
    setIdentity(null);
    setIsLoggedIn(false);
    setShowOnboarding(true);
    setOnboardingStep('welcome');
  };

  const generateAIPost = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Escreva uma postagem curta e visionária para rede social (máximo 150 caracteres) sobre o protocolo OmniProto, descentralização e o futuro do Fediverse. Use um tom tecnológico e levemente cyberpunk. O protocolo é 100% brasileiro, então use português do Brasil.",
      });
      if (response.text) {
        setNewPost(response.text.trim());
      }
    } catch (error) {
      console.error("Geração por IA falhou:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simular eventos recebidos
  useEffect(() => {
    const interval = setInterval(() => {
      const isBridge = Math.random() > 0.7;
      const newEvent: OmniEvent = {
        id: Math.random().toString(36).substr(2, 16),
        pubkey: `omni_${Math.random().toString(36).substr(2, 12)}`,
        created_at: Math.floor(Date.now() / 1000),
        kind: isBridge ? 2 : 1,
        content: isBridge 
          ? "Postagem importada do ActivityPub: 'A descentralização é o futuro da web!'" 
          : [
            "Acabei de conectar minha primeira instância Mastodon ao OmniProto! 🚀",
            "A rede de relays está crescendo rápido hoje.",
            "Descentralização não é apenas um recurso, é a base.",
            "Os eventos OmniProto são muito mais rápidos que os protocolos legados.",
            "Testando comunicação entre instâncias via Relay #4."
          ][Math.floor(Math.random() * 5)],
        tags: isBridge ? [["p", "activitypub"], ["source", "mastodon.social"]] : [],
        sig: `sig_${Math.random().toString(36).substr(2, 24)}`,
        origin: isBridge ? {
          protocol: "ActivityPub",
          source: "mastodon.social"
        } : undefined
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'gif';
        setAttachedMedia(prev => [...prev, {
          type: type as any,
          url: event.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addNewAccount = () => {
    setIsAccountSwitcherOpen(false);
    setShowOnboarding(true);
    setOnboardingStep('welcome');
  };

  const handlePost = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPost.trim() && attachedMedia.length === 0 && !showPollUI) return;

    const tags: string[][] = [];
    attachedMedia.forEach(m => tags.push(["media", m.type, m.url]));
    if (showPollUI && pollOptions.some(o => o.trim())) {
      tags.push(["poll", ...pollOptions.filter(o => o.trim())]);
    }

    // Add tags for cross-posting
    if (selectedAPIs.length > 0) {
      selectedAPIs.forEach(apiId => {
        const api = centralizedAPIs.find(a => a.id === apiId);
        if (api) tags.push(["crosspost", api.name, api.endpoint]);
      });
    }

    const myEvent: OmniEvent = {
      id: Math.random().toString(36).substr(2, 16),
      pubkey: identity?.pubkey || 'anon',
      created_at: Math.floor(Date.now() / 1000),
      kind: showPollUI ? 3 : 1,
      content: newPost,
      tags: tags,
      sig: "sig_own_signed_omni_proto_v1",
    };

    setEvents(prev => [myEvent, ...prev]);
    setNewPost('');
    setAttachedMedia([]);
    setShowPollUI(false);
    setPollOptions(['', '']);
    
    // Simulate API calls
    if (selectedAPIs.length > 0) {
      const apiNames = centralizedAPIs.filter(a => selectedAPIs.includes(a.id)).map(a => a.name).join(', ');
      console.log(`[OmniProto] Cross-posting to: ${apiNames}`);
      // In a real app, we would do a fetch() to each api.endpoint here
    }
  };

  const handleAddRelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelayUrl.trim()) return;
    
    const newRelay: Relay = {
      url: newRelayUrl.startsWith('ws') ? newRelayUrl : `wss://${newRelayUrl}`,
      status: 'online',
      latency: Math.floor(Math.random() * 100) + 10,
      eventsProcessed: 0
    };
    
    setRelays(prev => [...prev, newRelay]);
    setNewRelayUrl('');
    setIsAddingRelay(false);
  };

  const handleAddInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceUrl.trim() || !newInstanceName.trim()) return;
    
    const newInstance: FediverseInstance = {
      url: newInstanceUrl.replace(/^https?:\/\//, ''),
      name: newInstanceName,
      type: 'OmniProto',
      region: newInstanceRegion || 'Global',
      category: newInstanceCategory,
      activeUsers: 0,
      isBridged: true
    };
    
    setInstances(prev => [newInstance, ...prev]);
    setNewInstanceUrl('');
    setNewInstanceName('');
    setNewInstanceRegion('');
    setNewInstanceCategory('Pública');
    setIsAddingInstance(false);
  };

  const removeInstance = (url: string) => {
    setInstances(prev => prev.filter(i => i.url !== url));
  };

  const removeRelay = (url: string) => {
    setRelays(prev => prev.filter(r => r.url !== url));
  };

  const toggleBridge = (url: string) => {
    setInstances(prev => prev.map(inst => 
      inst.url === url ? { ...inst, isBridged: !inst.isBridged } : inst
    ));
  };

  const handleAddAPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName.trim() || !newApiEndpoint.trim()) return;

    const newAPI: CentralizedAPI = {
      id: Math.random().toString(36).substr(2, 9),
      name: newApiName,
      endpoint: newApiEndpoint,
      apiKey: newApiKey,
      enabled: true
    };

    setCentralizedAPIs(prev => [...prev, newAPI]);
    setNewApiName('');
    setNewApiEndpoint('');
    setNewApiKey('');
    setIsAddingAPI(false);
  };

  const toggleAPI = (id: string) => {
    setCentralizedAPIs(prev => prev.map(api => 
      api.id === id ? { ...api, enabled: !api.enabled } : api
    ));
  };

  const removeAPI = (id: string) => {
    setCentralizedAPIs(prev => prev.filter(api => api.id !== id));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${fontFamily} selection:bg-[var(--accent)] selection:text-black bg-[var(--bg)] text-[var(--text)]`}>
      <style>{`
        :root {
          --accent: ${accentColor};
          --bg: ${themeMode === 'light' ? '#F5F5F5' : themeMode === 'oled' ? '#000000' : '#050505'};
          --card: ${themeMode === 'light' ? '#FFFFFF' : themeMode === 'oled' ? '#080808' : '#0A0A0A'};
          --border: ${themeMode === 'light' ? '#E5E5E5' : themeMode === 'oled' ? '#111111' : '#1A1A1A'};
          --text: ${themeMode === 'light' ? '#111111' : '#F5F5F5'};
          --muted: ${themeMode === 'light' ? '#666666' : '#444444'};
        }
        .selection\\:bg-\\[var\\(--accent\\)\\]::selection {
          background-color: var(--accent);
          color: black;
        }
        /* Override some tailwind classes with variables */
        .bg-\\[\\#0A0A0A\\] { background-color: var(--card) !important; }
        .bg-\\[\\#050505\\] { background-color: var(--bg) !important; }
        .border-\\[\\#1A1A1A\\] { border-color: var(--border) !important; }
        .text-\\[\\#444\\] { color: var(--muted) !important; }
        .text-\\[\\#F5F5F5\\] { color: var(--text) !important; }
      `}</style>
      
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#00FF00] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(0,255,0,0.2)] mx-auto mb-6">
                  <Layers className="text-black w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">OmniProto</h1>
                <p className="text-[#444] text-sm font-mono uppercase tracking-widest">A Próxima Camada do Tecido Social</p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl shadow-2xl space-y-6">
                {onboardingStep === 'welcome' && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setOnboardingStep('login_key')}
                      className="w-full bg-[#00FF00] text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                    >
                      <Shield className="w-5 h-5" /> Entrar com Chave Privada
                    </button>
                    <button 
                      onClick={() => setOnboardingStep('login_user')}
                      className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-2xl hover:bg-[#222] transition-colors flex items-center justify-center gap-3"
                    >
                      <User className="w-5 h-5" /> Entrar com Usuário/Senha
                    </button>
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-[#1A1A1A]" />
                      <span className="text-[10px] text-[#333] font-bold uppercase">ou</span>
                      <div className="flex-1 h-px bg-[#1A1A1A]" />
                    </div>
                    <button 
                      onClick={() => setOnboardingStep('create')}
                      className="w-full border-2 border-[#1A1A1A] text-[#888] font-bold py-4 rounded-2xl hover:border-[#00FF00] hover:text-[#00FF00] transition-all flex items-center justify-center gap-3"
                    >
                      <Plus className="w-5 h-5" /> Criar Nova Identidade
                    </button>
                  </div>
                )}

                {onboardingStep === 'login_key' && (
                  <form onSubmit={handleLoginWithKey} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">Sua Chave Privada</label>
                      <input 
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="omni_priv_..."
                        className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 font-mono text-sm focus:border-[#00FF00] outline-none"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setOnboardingStep('welcome')} className="flex-1 text-[#444] font-bold uppercase text-xs">Voltar</button>
                      <button type="submit" className="flex-[2] bg-[#00FF00] text-black font-bold py-3 rounded-xl">Acessar Rede</button>
                    </div>
                  </form>
                )}

                {onboardingStep === 'login_user' && (
                  <form onSubmit={handleLoginUser} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">Usuário</label>
                        <input 
                          type="text"
                          value={inputUser}
                          onChange={(e) => setInputUser(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">Senha</label>
                        <input 
                          type="password"
                          value={inputPass}
                          onChange={(e) => setInputPass(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <button type="submit" className="w-full bg-[#00FF00] text-black font-bold py-3 rounded-xl">Entrar</button>
                      <button type="button" onClick={() => setOnboardingStep('recovery')} className="text-[10px] text-[#444] hover:text-[#00FF00] uppercase font-bold text-center">Esqueceu a senha? Recuperar via E-mail</button>
                      <button type="button" onClick={() => setOnboardingStep('welcome')} className="text-[#444] font-bold uppercase text-xs">Voltar</button>
                    </div>
                  </form>
                )}

                {onboardingStep === 'create' && (
                  <form onSubmit={handleCreateAccount} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">Nome de Usuário (Opcional)</label>
                        <input 
                          type="text"
                          value={inputUser}
                          onChange={(e) => setInputUser(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">Senha de Acesso (Abstração)</label>
                        <input 
                          type="password"
                          value={inputPass}
                          onChange={(e) => setInputPass(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#444] tracking-widest">E-mail de Recuperação (Única via de resgate)</label>
                        <input 
                          type="email"
                          value={inputEmail}
                          onChange={(e) => setInputEmail(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setOnboardingStep('welcome')} className="flex-1 text-[#444] font-bold uppercase text-xs">Cancelar</button>
                      <button type="submit" className="flex-[2] bg-[#00FF00] text-black font-bold py-3 rounded-xl">Gerar Identidade</button>
                    </div>
                  </form>
                )}

                {onboardingStep === 'recovery' && (
                  <form onSubmit={handleRecovery} className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="font-bold">Recuperação de Conta</h3>
                      <p className="text-[10px] text-[#444] uppercase leading-relaxed">Insira seu e-mail vinculado para receber sua chave privada criptografada.</p>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="email"
                        required
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl p-4 focus:border-[#00FF00] outline-none"
                      />
                    </div>
                    <button 
                      disabled={recoverySent}
                      className="w-full bg-[#00FF00] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      {recoverySent ? <Activity className="w-4 h-4 animate-spin" /> : 'Enviar Link de Resgate'}
                    </button>
                    <button type="button" onClick={() => setOnboardingStep('login_user')} className="w-full text-[#444] font-bold uppercase text-xs">Voltar para Login</button>
                  </form>
                )}

                {onboardingStep === 'show_key' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-yellow-500">Sua Chave Mestra</h3>
                      <p className="text-[10px] text-[#444] uppercase leading-relaxed">
                        Esta é a sua chave privada. Ela é necessária para logar em outros dispositivos. 
                        <strong> Guarde-a agora!</strong>
                      </p>
                    </div>
                    <div className="bg-black border border-[#1A1A1A] p-4 rounded-xl font-mono text-[10px] break-all text-[#00FF00]">
                      {identity?.privkey}
                    </div>
                    <button 
                      onClick={() => {
                        setIsLoggedIn(true);
                        setShowOnboarding(false);
                        setHasBackedUp(true);
                      }}
                      className="w-full bg-[#00FF00] text-black font-bold py-3 rounded-xl"
                    >
                      Eu Salvei Minha Chave
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-center text-[9px] text-[#222] uppercase tracking-[0.3em] font-black">
                Protocolo 100% Brasileiro • Descentralização Real
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoggedIn && identity && (
        <>
          {/* Sidebar Navigation */}
          <nav className="fixed bottom-0 left-0 w-full h-16 sm:h-full sm:w-20 border-t sm:border-t-0 sm:border-r border-[#1A1A1A] bg-[#0A0A0A] flex flex-row sm:flex-col items-center justify-between sm:justify-start px-4 sm:px-0 py-0 sm:py-8 gap-2 sm:gap-8 z-50 overflow-x-auto sm:overflow-y-auto hide-scrollbar">
            <div className="hidden sm:flex w-12 h-12 shrink-0 bg-[#00FF00] rounded-full items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.2)] mb-2 sm:mb-4">
              <Layers className="text-black w-6 h-6" />
            </div>
            
            <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<Globe />} label="Feed" />
            <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="Perfil" />
            <NavButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon={<MessageCircle />} label="Chat" />
            <NavButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Network />} label="Rede" />
            <NavButton active={activeTab === 'relays'} onClick={() => setActiveTab('relays')} icon={<Server />} label="Relays" />
            <NavButton active={activeTab === 'instances'} onClick={() => setActiveTab('instances')} icon={<Activity />} label="Nós" />
            <NavButton active={activeTab === 'bridge'} onClick={() => setActiveTab('bridge')} icon={<Shuffle />} label="Ponte" />
            <NavButton active={activeTab === 'spec'} onClick={() => setActiveTab('spec')} icon={<Code />} label="Especificação" />
            
            <div className="mt-auto pt-0 sm:pt-4 flex flex-row sm:flex-col gap-4 sm:gap-6 shrink-0 items-center">
              <button onClick={() => setActiveTab('settings')} className={`transition-colors p-2 sm:p-0 ${activeTab === 'settings' ? 'text-[#00FF00]' : 'text-[#444] hover:text-[#00FF00]'}`}><Shield className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <button onClick={handleLogout} className="text-[#444] hover:text-red-500 transition-colors p-2 sm:p-0"><User className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className={`pb-16 sm:pb-0 sm:pl-20 min-h-screen transition-all duration-500 ${viewMode === 'mobile' ? 'flex items-center justify-center bg-[#050505]' : 'grid grid-cols-1 lg:grid-cols-12'}`}>
            
            <div className={`${viewMode === 'mobile' ? 'w-[375px] h-[812px] bg-[var(--bg)] rounded-[3rem] border-[8px] border-[#1A1A1A] overflow-hidden shadow-2xl relative flex flex-col' : 'lg:col-span-8 border-r border-[#1A1A1A] flex flex-col'}`}>
              
              {/* Header */}
              <header className="h-16 border-b border-[#1A1A1A] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 px-8 flex items-center justify-between z-10">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#00FF00]">
                  {activeTab === 'feed' ? 'Feed da Rede Omni' : 
                   activeTab === 'relays' ? 'Infraestrutura de Relays' : 
                   activeTab === 'instances' ? 'Nós do Fediverso' : 
                   activeTab === 'network' ? 'Visualizador de Protocolo' :
                   activeTab === 'bridge' ? 'Ponte Multi-Plataforma' :
                   activeTab === 'settings' ? 'Segurança e Identidade' :
                   activeTab === 'messages' ? 'Mensagens Diretas' :
                   'Especificação do Protocolo'}
                </h2>
            <div className="flex items-center gap-4 text-[10px] font-mono text-[#444]">
              <button 
                onClick={() => setViewMode(viewMode === 'mobile' ? 'web' : 'mobile')}
                className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
              >
                {viewMode === 'mobile' ? <Globe className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                {viewMode === 'mobile' ? 'Web Mode' : 'Mobile Mode'}
              </button>
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-[#00FF00] rounded-full" /> 12.4k Conectados</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 4ms</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'search' && (
              <div className="p-8 max-w-4xl mx-auto space-y-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#444]" />
                  <input 
                    type="text" 
                    placeholder="Buscar usuários, hashtags ou eventos no protocolo..." 
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#444]">Assuntos do Momento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { tag: 'OmniProto', count: '12.5k' },
                      { tag: 'Descentralização', count: '8.2k' },
                      { tag: 'Flutter', count: '5.1k' },
                      { tag: 'Web3', count: '3.9k' },
                      { tag: 'OpenSource', count: '2.4k' }
                    ].map((topic, i) => (
                      <div key={i} className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl hover:border-[var(--accent)] transition-all cursor-pointer">
                        <div className="text-[10px] text-[#666] mb-1">Trending {i + 1}</div>
                        <div className="font-bold text-[var(--accent)]">#{topic.tag}</div>
                        <div className="text-[10px] text-[#444] mt-2">{topic.count} publicações</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#444]">Usuários Sugeridos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl flex items-center gap-4 hover:border-[var(--accent)] transition-all cursor-pointer">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold">Marcio Alves</div>
                        <div className="text-[10px] font-mono text-[#444]">@marciotalves@omni.social</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-8 max-w-2xl mx-auto space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#444] mb-6">Notificações do Protocolo</h3>
                {[
                  { type: 'like', user: 'Alice', content: 'curtiu sua publicação' },
                  { type: 'follow', user: 'Bob', content: 'começou a te seguir' },
                  { type: 'repost', user: 'Charlie', content: 'repostou sua publicação' }
                ].map((n, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'like' ? 'bg-pink-500/10 text-pink-500' : n.type === 'follow' ? 'bg-blue-500/10 text-blue-500' : 'bg-[#00FF00]/10 text-[#00FF00]'}`}>
                      {n.type === 'like' && <Heart className="w-4 h-4" />}
                      {n.type === 'follow' && <User className="w-4 h-4" />}
                      {n.type === 'repost' && <Repeat className="w-4 h-4" />}
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">{n.user}</span> {n.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-12 space-y-12 max-w-2xl mx-auto">
                {!hasBackedUp && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-yellow-500">Backup Pendente</h4>
                        <p className="text-[10px] text-yellow-500/60">Você ainda não confirmou o backup da sua Chave Mestra.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setHasBackedUp(true)}
                      className="bg-yellow-500 text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg hover:bg-yellow-400"
                    >
                      Confirmar Backup
                    </button>
                  </div>
                )}

                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center text-[#00FF00]">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Segurança da Identidade</h3>
                      <p className="text-xs text-[#444] mt-1">Gerencie suas chaves e métodos de recuperação.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase text-[#00FF00] tracking-widest">Chave Mestra (Privada)</h4>
                        {hasBackedUp && <span className="text-[9px] font-bold text-[#00FF00] uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Backup Realizado</span>}
                      </div>
                      <p className="text-[11px] text-[#666] leading-relaxed">
                        Esta chave é a sua identidade real no OmniProto. Ela é gerada localmente e nunca enviada para servidores sem criptografia. 
                        <strong> Se você perdê-la, o e-mail é sua única salvação.</strong>
                      </p>
                      <div className="relative group">
                        <div className={`bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl font-mono text-xs break-all transition-all ${showPrivKey ? 'text-[#00FF00]' : 'text-transparent select-none blur-sm'}`}>
                          {identity?.privkey}
                        </div>
                        {!showPrivKey && (
                          <button 
                            onClick={() => setShowPrivKey(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/20 transition-all"
                          >
                            Revelar Chave Mestra
                          </button>
                        )}
                        {showPrivKey && (
                          <button 
                            onClick={() => setShowPrivKey(false)}
                            className="mt-2 text-[9px] text-[#444] hover:text-white uppercase font-bold"
                          >
                            Ocultar Chave
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-yellow-500/50 italic">
                        * Guarde esta chave em um local físico ou gerenciador de senhas. Ela é necessária para portabilidade total entre clientes.
                      </p>
                    </div>

                    <div className="pt-8 border-t border-[#1A1A1A] space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-white tracking-widest">Vínculo de E-mail</h4>
                          <p className="text-[10px] text-[#444] mt-1">Usado para recuperar o acesso via Usuário/Senha.</p>
                        </div>
                        <div className="text-xs font-mono text-[#00FF00]">{identity?.email || 'Não vinculado'}</div>
                      </div>
                      
                      {!identity?.email && (
                        <div className="flex gap-4">
                          <input 
                            type="email" 
                            placeholder="vincular@email.com"
                            className="flex-1 bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-2 text-xs outline-none focus:border-[#00FF00]"
                          />
                          <button className="bg-[#1A1A1A] px-6 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-[#00FF00] hover:text-black transition-all">Vincular</button>
                        </div>
                      )}
                    </div>

                    <div className="pt-8 border-t border-[#1A1A1A] space-y-4">
                      <h4 className="text-xs font-bold uppercase text-white tracking-widest">Abstração de Login</h4>
                      <div className="flex items-center justify-between bg-[#050505] p-4 rounded-xl border border-[#1A1A1A]">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-[#444]" />
                          <span className="text-xs">Login com Usuário/Senha</span>
                        </div>
                        <div className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${identity?.hasPassword ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-500/10 text-red-500'}`}>
                          {identity?.hasPassword ? 'Ativado' : 'Desativado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Customization Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
                      <Palette className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Customização do Protocolo</h3>
                      <p className="text-xs text-[#444] mt-1">Torne o OmniProto único para você.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-10">
                    {/* Accent Color */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Cor de Destaque</h4>
                      </div>
                      <div className="flex gap-3">
                        {['#00FF00', '#3B82F6', '#F43F5E', '#A855F7', '#EAB308', '#F97316'].map(color => (
                          <button 
                            key={color}
                            onClick={() => setAccentColor(color)}
                            className={`w-10 h-10 rounded-xl border-2 transition-all ${accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Tipografia</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'font-sans', name: 'Inter (Padrão)' },
                          { id: 'font-mono', name: 'JetBrains Mono' },
                          { id: 'font-serif', name: 'Libre Baskerville' },
                          { id: 'font-display', name: 'Anton (Editorial)' }
                        ].map(font => (
                          <button 
                            key={font.id}
                            onClick={() => setFontFamily(font.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${fontFamily === font.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[#1A1A1A] hover:border-[#333]'}`}
                          >
                            <div className={`text-sm ${font.id}`}>{font.name}</div>
                            <div className="text-[9px] text-[#444] uppercase mt-1">Exemplo de Texto Omni</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Mode */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Modo de Tema</h4>
                      </div>
                      <div className="flex gap-4">
                        {[
                          { id: 'dark', name: 'Escuro', bg: '#0A0A0A' },
                          { id: 'light', name: 'Claro', bg: '#F5F5F5' },
                          { id: 'oled', name: 'OLED', bg: '#000000' }
                        ].map(theme => (
                          <button 
                            key={theme.id}
                            onClick={() => setThemeMode(theme.id as any)}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${themeMode === theme.id ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[#1A1A1A] text-[#444] hover:border-[#333]'}`}
                          >
                            {theme.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Density */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Densidade da Interface</h4>
                      </div>
                      <div className="flex gap-4">
                        {(['compact', 'normal', 'spacious'] as const).map(density => (
                          <button 
                            key={density}
                            onClick={() => setLayoutDensity(density)}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${layoutDensity === density ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[#1A1A1A] text-[#444] hover:border-[#333]'}`}
                          >
                            {density === 'compact' ? 'Compacta' : density === 'normal' ? 'Normal' : 'Espaçosa'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* View Mode */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Modo de Visualização</h4>
                      </div>
                      <div className="flex gap-4">
                        {[
                          { id: 'mobile', name: 'Mobile', icon: <Smartphone className="w-3 h-3" /> },
                          { id: 'web', name: 'Web / Desktop', icon: <Globe className="w-3 h-3" /> }
                        ].map(mode => (
                          <button 
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${viewMode === mode.id ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[#1A1A1A] text-[#444] hover:border-[#333]'}`}
                          >
                            {mode.icon} {mode.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profile Edit Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Perfil e Identidade</h3>
                      <p className="text-xs text-[#444] mt-1">Como o mundo vê você no OmniProto.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Nome de Exibição</label>
                        <input 
                          type="text" 
                          value={identity?.name}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Nome de Usuário (@)</label>
                        <input 
                          type="text" 
                          value={identity?.username}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, username: e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase() } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Website / Link</label>
                        <input 
                          type="text" 
                          value={identity?.website}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, website: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Bio / Descrição</label>
                        <input 
                          type="text" 
                          value={identity?.bio}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, bio: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>

                    {/* Social Links Management */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#444]">Links de Redes Sociais</h4>
                        <button 
                          onClick={() => setIdentity(prev => prev ? {...prev, socialLinks: [...(prev.socialLinks || []), { platform: '', url: '' }]} : null)}
                          className="text-[10px] font-bold text-[var(--accent)] uppercase hover:underline"
                        >
                          + Adicionar Rede Social
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {identity?.socialLinks?.map((link, idx) => (
                          <div key={idx} className="flex gap-4 items-center bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A]">
                            <div className="flex-1 space-y-2">
                              <label className="text-[9px] font-bold uppercase text-[#333]">Plataforma (ex: Twitter, GitHub)</label>
                              <input 
                                type="text" 
                                value={link.platform}
                                onChange={(e) => {
                                  const newLinks = [...(identity.socialLinks || [])];
                                  newLinks[idx].platform = e.target.value;
                                  setIdentity({...identity, socialLinks: newLinks});
                                }}
                                className="w-full bg-black border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                              />
                            </div>
                            <div className="flex-[2] space-y-2">
                              <label className="text-[9px] font-bold uppercase text-[#333]">Link do Perfil</label>
                              <input 
                                type="text" 
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...(identity.socialLinks || [])];
                                  newLinks[idx].url = e.target.value;
                                  setIdentity({...identity, socialLinks: newLinks});
                                }}
                                className="w-full bg-black border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const newLinks = identity.socialLinks?.filter((_, i) => i !== idx);
                                setIdentity({...identity, socialLinks: newLinks});
                              }}
                              className="mt-6 text-red-500 hover:text-red-400 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Avatar (URL)</label>
                        <input 
                          type="text" 
                          value={identity?.avatar}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, avatar: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Capa (URL)</label>
                        <input 
                          type="text" 
                          value={identity?.cover}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, cover: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Instância Omni (Nó)</label>
                        <input 
                          type="text" 
                          value={identity?.instance}
                          placeholder="ex: omni.social"
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, instance: e.target.value.toLowerCase() } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Idioma do Protocolo</label>
                        <select 
                          value={identity?.language}
                          onChange={(e) => setIdentity(prev => prev ? { ...prev, language: e.target.value } : null)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] appearance-none"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                          <option value="fr-FR">Français</option>
                          <option value="ja-JP">日本語</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Bio</label>
                      <textarea 
                        value={identity?.bio}
                        onChange={(e) => setIdentity(prev => prev ? { ...prev, bio: e.target.value } : null)}
                        rows={3}
                        className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] resize-none"
                      />
                    </div>

                    {/* Social Links Editor */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Links Sociais</label>
                      <div className="space-y-3">
                        {identity?.socialLinks?.map((link, idx) => (
                          <div key={idx} className="flex gap-3">
                            <input 
                              type="text" 
                              value={link.name}
                              placeholder="Nome (ex: X)"
                              onChange={(e) => {
                                const newLinks = [...(identity.socialLinks || [])];
                                newLinks[idx].name = e.target.value;
                                setIdentity(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                              }}
                              className="w-1/4 bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-2 text-xs outline-none focus:border-[var(--accent)]"
                            />
                            <input 
                              type="text" 
                              value={link.url}
                              placeholder="URL"
                              onChange={(e) => {
                                const newLinks = [...(identity.socialLinks || [])];
                                newLinks[idx].url = e.target.value;
                                setIdentity(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                              }}
                              className="flex-1 bg-[#050505] border border-[#1A1A1A] rounded-xl px-4 py-2 text-xs outline-none focus:border-[var(--accent)]"
                            />
                            <button 
                              onClick={() => {
                                const newLinks = identity.socialLinks?.filter((_, i) => i !== idx);
                                setIdentity(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                              }}
                              className="text-red-500 hover:text-red-400 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newLinks = [...(identity?.socialLinks || []), { platform: 'Other', url: '', name: '' }];
                            setIdentity(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                          }}
                          className="w-full border-2 border-dashed border-[#1A1A1A] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#444] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                        >
                          + Adicionar Link Social
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        localStorage.setItem('omni_session', JSON.stringify(identity));
                        setSaveStatus(true);
                        setTimeout(() => setSaveStatus(false), 2000);
                      }}
                      className="w-full bg-[var(--accent)] text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      {saveStatus ? (
                        <>
                          <Shield className="w-4 h-4" /> Perfil Salvo!
                        </>
                      ) : (
                        'Salvar Alterações de Perfil'
                      )}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="h-full flex flex-col p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-bold">Visualizador de Protocolo</h3>
                  <p className="text-xs text-[#444] mt-1">Visualização em tempo real da propagação de eventos através da malha OmniProto.</p>
                </div>
                <div className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl overflow-hidden relative">
                  <NetworkGraph relays={relays} instances={instances} />
                  <div className="absolute bottom-6 left-6 flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#444]">
                      <div className="w-2 h-2 bg-[#00FF00] rounded-full" /> Relay
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#444]">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" /> Instância
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#444]">
                      <div className="w-2 h-2 bg-white rounded-full" /> Cliente
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bridge' && (
              <div className="p-8 space-y-8 max-w-4xl mx-auto">
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                      <Shuffle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Ponte Multi-Plataforma</h3>
                      <p className="text-xs text-[#444] mt-1">Simule a importação de dados de plataformas sociais legadas para o OmniProto.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BridgeSource 
                      name="Twitter / X" 
                      icon={<div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-black">X</div>}
                      status="Pronto"
                      onImport={() => {
                        const event: OmniEvent = {
                          id: Math.random().toString(36).substr(2, 16),
                          pubkey: "omni_bridge_x_001",
                          created_at: Math.floor(Date.now() / 1000),
                          kind: 2,
                          content: "Importado do X: 'O futuro das redes sociais é descentralizado. #Web3 #OmniProto'",
                          tags: [["source", "twitter"]],
                          sig: "sig_bridged_x",
                          origin: { protocol: "X-Bridge", source: "twitter.com/omni" }
                        };
                        setEvents(prev => [event, ...prev]);
                      }}
                    />
                    <BridgeSource 
                      name="Mastodon" 
                      icon={<Activity className="text-[#6364FF]" />}
                      status="Conectado"
                      onImport={() => {
                        const event: OmniEvent = {
                          id: Math.random().toString(36).substr(2, 16),
                          pubkey: "omni_bridge_mastodon_001",
                          created_at: Math.floor(Date.now() / 1000),
                          kind: 2,
                          content: "Importado do Mastodon: 'OmniProto parece muito promissor para o Fediverse!'",
                          tags: [["source", "mastodon"]],
                          sig: "sig_bridged_mastodon",
                          origin: { protocol: "ActivityPub", source: "mastodon.social/@omni" }
                        };
                        setEvents(prev => [event, ...prev]);
                      }}
                    />
                  </div>

                  <div className="pt-8 border-t border-[#1A1A1A]">
                    <h4 className="text-xs font-bold uppercase text-[#444] mb-4">Logs da Ponte</h4>
                    <div className="bg-[#050505] rounded-xl p-4 font-mono text-[10px] text-[#00FF00] space-y-1 h-32 overflow-y-auto custom-scrollbar">
                      <div>[17:38:36] INICIALIZANDO BRIDGE_DAEMON_V1.2...</div>
                      <div>[17:38:37] ESCANEANDO EVENTOS ACTIVITYPUB...</div>
                      <div>[17:38:38] ENCONTRADOS 12 NOVOS EVENTOS EM MASTODON.SOCIAL</div>
                      <div>[17:38:39] EMPACOTANDO EVENT_ID: 0x8f2a... EM OMNIPROTO_KIND_2</div>
                      <div>[17:38:40] TRANSMITINDO PARA 3 RELAYS...</div>
                      <div className="animate-pulse">_</div>
                    </div>
                  </div>
                </div>

                {/* Seção de Clientes Híbridos / APIs Centralizadas */}
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center">
                        <Link2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Clientes Híbridos (APIs Centralizadas)</h3>
                        <p className="text-xs text-[#444] mt-1">Conecte servidores e APIs de redes sociais centralizadas para postagem cruzada.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {centralizedAPIs.map((api) => (
                      <div key={api.id} className="bg-[#050505] border border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-between group hover:border-[#333] transition-all">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${api.enabled ? 'bg-purple-500/10 text-purple-500' : 'bg-[#1A1A1A] text-[#444]'}`}>
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {api.name}
                              {api.enabled && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#444]">{api.endpoint}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleAPI(api.id)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                              api.enabled 
                                ? 'bg-purple-500 text-white hover:bg-red-500' 
                                : 'bg-[#1A1A1A] text-[#888] hover:bg-purple-500 hover:text-white'
                            }`}
                          >
                            {api.enabled ? 'Desativar' : 'Ativar'}
                          </button>
                          <button onClick={() => removeAPI(api.id)} className="p-2 text-[#444] hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {isAddingAPI ? (
                      <motion.form 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onSubmit={handleAddAPI}
                        className="bg-[#050505] border border-purple-500/50 p-6 rounded-2xl flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Nova API Centralizada</h4>
                          <button type="button" onClick={() => setIsAddingAPI(false)} className="text-[#444] hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <input 
                            type="text" 
                            value={newApiName}
                            onChange={(e) => setNewApiName(e.target.value)}
                            placeholder="Nome da Rede (ex: Minha Rede Social)" 
                            className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 w-full"
                            required
                          />
                          <input 
                            type="url" 
                            value={newApiEndpoint}
                            onChange={(e) => setNewApiEndpoint(e.target.value)}
                            placeholder="Endpoint da API (ex: https://api.minharede.com/v1/post)" 
                            className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 w-full"
                            required
                          />
                          <input 
                            type="password" 
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            placeholder="Token de Autenticação / API Key (Opcional)" 
                            className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 w-full"
                          />
                        </div>
                        
                        <button 
                          type="submit"
                          className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl hover:bg-purple-600 transition-colors mt-2"
                        >
                          Conectar API
                        </button>
                      </motion.form>
                    ) : (
                      <button 
                        onClick={() => setIsAddingAPI(true)}
                        className="border-2 border-dashed border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-center gap-2 text-[#444] hover:text-purple-500 hover:border-purple-500 transition-all group"
                      >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Adicionar Servidor/API Própria</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feed' && (
              <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
                {!hasBackedUp && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center justify-between gap-4 mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Sua Chave Mestra não foi salva. Faça o backup agora.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="text-[9px] font-black uppercase bg-yellow-500 text-black px-3 py-1.5 rounded-lg whitespace-nowrap"
                    >
                      Backup
                    </button>
                  </motion.div>
                )}
                {/* Post Input */}
                <form onSubmit={handlePost} className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex gap-4">
                    <img src={identity?.avatar || `https://picsum.photos/seed/${identity?.pubkey}/200/200`} className="w-12 h-12 rounded-full grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Eu" />
                    <textarea 
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Transmitir para OmniProto..."
                      className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-[#333]"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[#1A1A1A]">
                    <div className="flex gap-4 text-[#444]">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:text-[var(--accent)] transition-colors" 
                        title="Foto/Vídeo Local"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          // Simulate GIF picker
                          setAttachedMedia(prev => [...prev, {type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxx8X8X8X8X/giphy.gif'}])
                        }}
                        className="hover:text-[var(--accent)] transition-colors" 
                        title="GIF"
                      >
                        <Film className="w-5 h-5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowPollUI(!showPollUI)}
                        className={`hover:text-[var(--accent)] transition-colors ${showPollUI ? 'text-[var(--accent)]' : ''}`} 
                        title="Enquete"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                      <button type="button" className="hover:text-[var(--accent)] transition-colors" title="Tags"><Hash className="w-5 h-5" /></button>
                      <button 
                        type="button" 
                        onClick={generateAIPost}
                        disabled={isGenerating}
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#1A1A1A] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all ${isGenerating ? 'animate-pulse text-[var(--accent)]' : ''}`}
                      >
                        <Zap className="w-3 h-3" /> {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                      </button>
                    </div>
                    <button 
                      type="submit"
                      disabled={(!newPost.trim() && attachedMedia.length === 0 && !showPollUI) || isGenerating}
                      className="bg-[var(--accent)] text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      Transmitir
                    </button>
                  </div>

                  {/* Cross-posting / Hybrid Client Selection */}
                  {centralizedAPIs.filter(api => api.enabled).length > 0 && (
                    <div className="pt-4 border-t border-[#1A1A1A]">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-3 flex items-center gap-2">
                        <Link2 className="w-3 h-3" /> Transmitir também para:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {centralizedAPIs.filter(api => api.enabled).map(api => {
                          const isSelected = selectedAPIs.includes(api.id);
                          return (
                            <button
                              key={api.id}
                              type="button"
                              onClick={() => {
                                setSelectedAPIs(prev => 
                                  isSelected ? prev.filter(id => id !== api.id) : [...prev, api.id]
                                );
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                isSelected 
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                                  : 'bg-[#050505] border-[#1A1A1A] text-[#888] hover:border-[#333]'
                              }`}
                            >
                              <Activity className="w-3 h-3" />
                              {api.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Media Preview */}
                  {attachedMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4">
                      {attachedMedia.map((media, idx) => (
                        <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-[#1A1A1A]">
                          <img src={media.url} className="w-full h-full object-cover" alt="Preview" />
                          <button 
                            type="button"
                            onClick={() => setAttachedMedia(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">
                            {media.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Poll UI */}
                  {showPollUI && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Criar Enquete</h4>
                        <button type="button" onClick={() => setShowPollUI(false)} className="text-[#444] hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[idx] = e.target.value;
                              setPollOptions(newOpts);
                            }}
                            placeholder={`Opção ${idx + 1}`}
                            className="flex-1 bg-transparent border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                          />
                          {pollOptions.length > 2 && (
                            <button 
                              type="button"
                              onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                              className="text-[#444] hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
                        <button 
                          type="button"
                          onClick={() => setPollOptions(prev => [...prev, ""])}
                          className="text-[10px] font-bold uppercase text-[var(--accent)] hover:underline"
                        >
                          + Adicionar Opção
                        </button>
                      )}
                    </motion.div>
                  )}
                </form>

                {/* Feed Events */}
                <div className="space-y-6">
                  <AnimatePresence initial={false}>
                    {events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        identity={identity} 
                        density={layoutDensity} 
                        onSelect={setSelectedEvent} 
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === 'relays' && (
              <div className="p-8 space-y-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relays.map((relay) => (
                    <div key={relay.url} className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${relay.status === 'online' ? 'bg-[#00FF00]' : 'bg-yellow-500'}`} />
                        <div>
                          <div className="font-mono text-sm">{relay.url}</div>
                          <div className="flex gap-4 mt-1">
                            <div className="text-[9px] text-[#444] uppercase tracking-widest">Latência: {relay.latency}ms</div>
                            <div className="text-[9px] text-[#444] uppercase tracking-widest">Eventos: {relay.eventsProcessed.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeRelay(relay.url)}
                        className="text-[#444] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {isAddingRelay ? (
                    <motion.form 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onSubmit={handleAddRelay}
                      className="bg-[#0A0A0A] border border-[var(--accent)] p-6 rounded-2xl flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Novo Relay Omni/Nostr</h4>
                        <button type="button" onClick={() => setIsAddingRelay(false)} className="text-[#444] hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={newRelayUrl}
                        onChange={(e) => setNewRelayUrl(e.target.value)}
                        placeholder="wss://relay.exemplo.com"
                        className="bg-black border border-[#1A1A1A] rounded-xl p-3 text-xs font-mono focus:border-[var(--accent)] outline-none"
                        autoFocus
                      />
                      <button 
                        type="submit"
                        className="w-full bg-[var(--accent)] text-black font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform"
                      >
                        Conectar Relay
                      </button>
                    </motion.form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingRelay(true)}
                      className="border-2 border-dashed border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-center gap-2 text-[#444] hover:text-[#00FF00] hover:border-[#00FF00] transition-all group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest">Adicionar Novo Relay</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'instances' && (
              <div className="p-8 space-y-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">Ponte Fediverse & Instâncias</h3>
                    <p className="text-xs text-[#444] mt-1">Conecte nós existentes do Fediverse ou crie instâncias próprias (regionais, institucionais, clientes).</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <input 
                      type="text" 
                      placeholder="Buscar instâncias..." 
                      className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#00FF00]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {instances.map((inst) => (
                    <div key={inst.url} className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-between group hover:border-[#333] transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${inst.isBridged ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-[#1A1A1A] text-[#444]'}`}>
                          <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            {inst.name}
                            {inst.isBridged && <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-full" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#444]">{inst.url}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#888] uppercase tracking-widest">{inst.type}</span>
                            {inst.region && <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#888] uppercase tracking-widest">{inst.region}</span>}
                            {inst.category && <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#888] uppercase tracking-widest">{inst.category}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-xs font-mono text-[#00FF00]">{inst.activeUsers.toLocaleString()}</div>
                          <div className="text-[9px] text-[#444] uppercase">Usuários Ativos</div>
                        </div>
                        <button 
                          onClick={() => toggleBridge(inst.url)}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                            inst.isBridged 
                              ? 'bg-[#00FF00] text-black hover:bg-[#FF0000] hover:text-white' 
                              : 'bg-[#1A1A1A] text-[#888] hover:bg-[#00FF00] hover:text-black'
                          }`}
                        >
                          {inst.isBridged ? 'Desconectar Ponte' : 'Conectar Ponte'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {isAddingInstance ? (
                    <motion.form 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onSubmit={handleAddInstance}
                      className="bg-[#0A0A0A] border border-[var(--accent)] p-6 rounded-2xl flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Nova Instância OmniProto</h4>
                        <button type="button" onClick={() => setIsAddingInstance(false)} className="text-[#444] hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          value={newInstanceName}
                          onChange={(e) => setNewInstanceName(e.target.value)}
                          placeholder="Nome da Instância (ex: Omni Brasil)" 
                          className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] w-full"
                          required
                        />
                        <input 
                          type="text" 
                          value={newInstanceUrl}
                          onChange={(e) => setNewInstanceUrl(e.target.value)}
                          placeholder="URL (ex: br.omni.social)" 
                          className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] w-full"
                          required
                        />
                        <input 
                          type="text" 
                          value={newInstanceRegion}
                          onChange={(e) => setNewInstanceRegion(e.target.value)}
                          placeholder="Região/Idioma (ex: Brasil, Japão, Global)" 
                          className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] w-full"
                        />
                        <select 
                          value={newInstanceCategory}
                          onChange={(e) => setNewInstanceCategory(e.target.value as any)}
                          className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] w-full text-white"
                        >
                          <option value="Pública">Pública</option>
                          <option value="Governamental">Governamental</option>
                          <option value="Institucional">Institucional</option>
                          <option value="Privada/Cliente">Privada / Cliente Específico</option>
                        </select>
                      </div>
                      
                      <button 
                        type="submit"
                        className="w-full bg-[#00FF00] text-black font-bold py-3 rounded-xl hover:bg-[#00CC00] transition-colors mt-2"
                      >
                        Criar e Conectar Instância
                      </button>
                    </motion.form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingInstance(true)}
                      className="border-2 border-dashed border-[#1A1A1A] p-6 rounded-2xl flex items-center justify-center gap-2 text-[#444] hover:text-[#00FF00] hover:border-[#00FF00] transition-all group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest">Adicionar Instância Própria</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'spec' && (
              <div className="p-12 space-y-12 max-w-4xl mx-auto">
                {/* Open Source Banner */}
                <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Code className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-400 uppercase tracking-widest mb-2">Licença: 99% Open Source</h3>
                    <p className="text-sm text-purple-200/70 leading-relaxed">
                      Construído em Flutter (com esta Reference Web Implementation), o protocolo é <strong>100% editável e modificável</strong> para qualquer desenvolvedor, programador ou inteligência artificial. Você pode modificar até 99% do código para criar seus próprios clientes, servidores ou aplicativos. Esta é a versão final para enviar para produção para outros desenvolvedores trabalharem em cima do protocolo OmniProto.
                    </p>
                    <div className="mt-4 flex items-start gap-3 bg-black/50 p-4 rounded-xl border border-purple-500/20">
                      <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-500/90 leading-relaxed">
                        <strong>A ÚNICA EXCEÇÃO (1% BLOQUEADO):</strong> A identidade do criador original do protocolo OmniProto (E-mail e Username) NUNCA será editável. Ela é protegida por múltiplas camadas de criptografia ponta-a-ponta no Bloco Gênese. Qualquer tentativa de adulteração invalidará a assinatura de Gênese em toda a rede.
                      </p>
                    </div>
                  </div>
                </div>

                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
                      <Code className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold italic uppercase tracking-tighter">OmniProto — O Protocolo Brasileiro que Expande o Fediverso</h3>
                      <p className="text-xs text-[#444] mt-1">Um protocolo, infinitas possibilidades.</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-6">
                    <p className="text-sm text-[#AAA] leading-relaxed">
                      O OmniProto é um protocolo de rede social descentralizada, criado no Brasil, que redefine a forma como plataformas sociais são construídas e conectadas. Projetado para ser flexível e universal, ele integra o melhor dos dois mundos: instâncias (servidores federados) e relays (transmissão de eventos em tempo real), permitindo uma comunicação aberta, escalável e resiliente.
                    </p>
                    <p className="text-sm text-[#AAA] leading-relaxed">
                      Totalmente compatível com o fediverso, o OmniProto vai além dos padrões atuais ao permitir que desenvolvedores criem qualquer tipo de rede social ou aplicativo de comunicação, sem limitações de formato ou estilo.
                    </p>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#444]">Plataformas Inspiradas</h4>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl">
                    <p className="text-sm text-[#AAA] leading-relaxed mb-6">
                      Com o OmniProto, é possível desenvolver plataformas inspiradas em:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { title: 'Redes de microblog', desc: '(como Twitter/X)' },
                        { title: 'Redes sociais completas', desc: '(como Facebook)' },
                        { title: 'Mensageiros', desc: '(como WhatsApp)' },
                        { title: 'Redes visuais', desc: '(como Instagram)' },
                        { title: 'Vídeos curtos', desc: '(como TikTok)' },
                        { title: 'Plataformas de vídeo', desc: '(como YouTube)' },
                        { title: 'Super apps', desc: '(como WeChat)' }
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-black border border-[#1A1A1A] rounded-2xl">
                          <div className="font-bold text-[var(--accent)] text-sm">{item.title}</div>
                          <div className="text-xs text-[#666] mt-1">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-center mt-6 text-[#AAA]">
                      Tudo isso utilizando um único protocolo unificado.
                    </p>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#444]">Principais Características</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'Descentralização real com suporte a instâncias e relays',
                      'Interoperabilidade com o fediverso',
                      'Flexibilidade total de criação de clientes (apps, web, etc.)',
                      'Arquitetura moderna e escalável',
                      'Controle de dados pelo usuário',
                      'Extensível para novos formatos de mídia e interação'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                        </div>
                        <p className="text-sm text-[#AAA]">{feature}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="p-8 bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-[#1A1A1A] rounded-3xl space-y-4 text-center">
                    <h4 className="text-lg font-bold uppercase tracking-widest text-[var(--accent)]">A Próxima Geração</h4>
                    <p className="text-sm text-[#AAA] leading-relaxed max-w-2xl mx-auto">
                      O OmniProto nasce com o objetivo de ser a próxima geração dos protocolos sociais, permitindo que qualquer pessoa ou comunidade construa sua própria rede, mantendo conexão com todo o ecossistema descentralizado.
                    </p>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Autenticidade & Gênese</h3>
                      <p className="text-xs text-[#444] mt-1">O registro imutável do criador original.</p>
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between p-4 bg-black rounded-2xl border border-yellow-500/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-[#444]">Autor da Gênese</div>
                          <div className="text-sm font-mono text-yellow-500">marciotalves@gmail.com</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-widest">Verificado via Hash</div>
                    </div>
                    <p className="text-xs text-[#AAA] leading-relaxed">
                      Este protocolo possui uma assinatura de autenticidade criptografada e gravada permanentemente. Independentemente de futuras atualizações ou novos clientes criados pela comunidade, a identidade do autor original (<span className="text-yellow-500">marciotalves@gmail.com</span>) permanecerá como a autoridade de criação.
                    </p>
                    <div className="p-6 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                      <h5 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-2">Apoie o Criador</h5>
                      <p className="text-[10px] text-[#666] mb-4">
                        O OmniProto é um projeto de código aberto. Se você deseja apoiar o desenvolvimento contínuo, pode enviar uma doação via Pix para o e-mail do autor.
                      </p>
                      <div className="flex items-center justify-between bg-black p-3 rounded-xl border border-[#1A1A1A]">
                        <span className="text-[10px] font-mono text-[#AAA]">Chave Pix (E-mail): marciotalves@gmail.com</span>
                        <button className="text-[9px] font-bold text-yellow-500 hover:underline">COPIAR CHAVE</button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
                      <Shuffle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Evolução Comunitária & Global</h3>
                      <p className="text-xs text-[#444] mt-1">Um protocolo vivo, traduzido para todos os idiomas.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">Tradução Universal</h4>
                      <p className="text-xs text-[#AAA] leading-relaxed">
                        O OmniProto foi desenhado para ser agnóstico a idiomas. Novos clientes podem ser construídos em qualquer língua do planeta, garantindo que a descentralização não tenha barreiras linguísticas.
                      </p>
                    </div>
                    <div className="p-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">Protocolo 100% Público</h4>
                      <p className="text-xs text-[#AAA] leading-relaxed">
                        Qualquer usuário ou programador pode propor melhorias. O OmniProto evolui com o tempo através de propostas da comunidade (OIPs - Omni Improvement Proposals), permitindo novos recursos constantes.
                      </p>
                    </div>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-[#1A1A1A] rounded-3xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">Poder de Criação Ilimitado</h4>
                    <p className="text-xs text-[#AAA] leading-relaxed">
                      Construído em Flutter, o protocolo OmniProto é 100% editável e poderá ser modificado em até 99% por qualquer programador independente, empresa ou inteligência artificial (atual ou futura). Ele dá o poder de criar clientes parecidos com qualquer rede social já existente (X/Twitter, TikTok, Instagram, Facebook, Orkut, YouTube, WhatsApp, Telegram, WeChat), recriar redes descontinuadas ou inventar conceitos totalmente novos com funções inovadoras. O OmniProto é totalmente customizável, permitindo clientes com diversas aparências, comportamentos e interações, tudo interoperável dentro do Fediverso. A única coisa que nunca será editável é o e-mail e o nome de usuário do criador, protegidos por várias camadas de criptografia ponta a ponta.
                    </p>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)]">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Responsividade & Acessibilidade</h3>
                      <p className="text-xs text-[#444] mt-1">Design fluido para qualquer dispositivo.</p>
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-3xl space-y-6">
                    <p className="text-sm text-[#AAA] leading-relaxed">
                      O cliente oficial do OmniProto foi projetado para se ajustar perfeitamente a todos os tamanhos de telas e dispositivos.
                    </p>
                    <div className="flex items-start gap-4 p-4 bg-black rounded-2xl border border-[#1A1A1A]">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-[#AAA] leading-relaxed">
                        Não cortando nenhum recurso, nenhum botão, nenhuma opção. Todos os elementos são mostrados na tela de forma inteligente e responsiva, garantindo a melhor experiência de usuário seja no desktop, tablet ou smartphone.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pb-12">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#444]">Para Desenvolvedores (SDK Flutter)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'SDK Flutter Core', desc: 'Base oficial para novos clientes mobile e desktop. 100% customizável.', icon: <Smartphone className="w-4 h-4" /> },
                      { title: 'API Pública Omni', desc: 'Endpoints REST e WebSocket para bots e serviços de terceiros.', icon: <Globe className="w-4 h-4" /> },
                      { title: 'Whitepaper Técnico', desc: 'Documentação completa do protocolo para implementação de novos clientes.', icon: <FileText className="w-4 h-4" /> }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl hover:border-[var(--accent)] transition-all cursor-pointer group">
                        <div className="text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                        <h5 className="text-xs font-bold mb-1">{item.title}</h5>
                        <p className="text-[10px] text-[#444] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 p-6 rounded-2xl text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                      O OmniProto é um bem público. Use, modifique e crie o futuro das redes sociais brasileiras.
                    </p>
                  </div>
                </section>
                <div className="pt-8 border-t border-[#1A1A1A] flex justify-between items-center">
                  <div className="text-[10px] text-[#333] uppercase tracking-widest">Última Atualização: 2026-03-29</div>
                  <button className="flex items-center gap-2 text-[10px] font-bold text-[#00FF00] hover:underline">
                    <ExternalLink className="w-3 h-3" /> LER WHITEPAPER COMPLETO
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="flex-1 flex flex-col h-full bg-[var(--bg)]">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Mensagens Diretas</h3>
                  <button className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                      <MessageCircle className="w-12 h-12" />
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhuma conversa iniciada</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${msg.sender === 'me' ? 'bg-[var(--accent)] text-black' : 'bg-[#1A1A1A] text-white'}`}>
                          {msg.type === 'text' && <p>{msg.text}</p>}
                          {msg.type === 'image' && <img src={msg.url} className="rounded-xl max-w-full" alt="Media" />}
                          {msg.type === 'video' && <video src={msg.url} controls className="rounded-xl max-w-full" />}
                          {msg.type === 'audio' && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              <div className="h-1 w-24 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-black/40 w-1/2" />
                              </div>
                              <span className="text-[10px]">0:12</span>
                            </div>
                          )}
                          <div className="text-[8px] mt-1 opacity-50 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[#050505]">
                  <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:text-[var(--accent)] transition-colors"><Image className="w-4 h-4" /></button>
                      <button 
                        onClick={() => {
                          const newMsg = {
                            id: Math.random().toString(36).substr(2, 9),
                            sender: 'me',
                            text: 'Áudio gravado',
                            type: 'audio' as const,
                            timestamp: Date.now()
                          };
                          setMessages(prev => [...prev, newMsg]);
                        }}
                        className="p-2 hover:text-[var(--accent)] transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Escreva uma mensagem..."
                      className="flex-1 bg-transparent text-xs outline-none py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newMsg = {
                            id: Math.random().toString(36).substr(2, 9),
                            sender: 'me',
                            text: e.currentTarget.value,
                            type: 'text' as const,
                            timestamp: Date.now()
                          };
                          setMessages(prev => [...prev, newMsg]);
                          e.currentTarget.value = '';
                          
                          // Mock reply
                          setTimeout(() => {
                            setMessages(prev => [...prev, {
                              id: Math.random().toString(36).substr(2, 9),
                              sender: 'them',
                              text: 'Mensagem recebida pelo protocolo Omni!',
                              type: 'text',
                              timestamp: Date.now()
                            }]);
                          }, 1000);
                        }
                      }}
                    />
                    <button className="p-2 text-[var(--accent)]"><ArrowRightLeft className="w-4 h-4 rotate-90" /></button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg)]">
                {/* Profile Header */}
                <div className="relative">
                  {/* Cover */}
                  <div className="h-48 md:h-64 w-full overflow-hidden">
                    <img src={identity?.cover} className="w-full h-full object-cover" alt="Capa" />
                  </div>
                  
                  {/* Profile Info Overlay */}
                  <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 md:-mt-16 mb-4 relative z-10 gap-4 sm:gap-0">
                      <div className="flex justify-between items-end w-full sm:w-auto">
                        <div className="relative">
                          <img src={identity?.avatar || `https://picsum.photos/seed/${identity?.pubkey}/200/200`} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[var(--bg)] object-cover" alt="Perfil" />
                          <button 
                            onClick={() => setActiveTab('settings')}
                            className="absolute bottom-1 right-1 w-8 h-8 bg-yellow-500 rounded-full border-4 border-[var(--bg)] flex items-center justify-center text-black hover:scale-110 transition-transform"
                            title="Editar Avatar"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => setActiveTab('settings')}
                          className="sm:hidden bg-[#1A1A1A] text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#333] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all mb-2"
                        >
                          Editar Perfil
                        </button>
                      </div>
                      
                      <div className="flex gap-4 md:gap-8 mb-2 mr-0 md:mr-4 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <div className="text-center shrink-0">
                          <div className="text-lg font-black">{identity?.followers}</div>
                          <div className="text-[10px] text-[#666] uppercase font-bold">Seguidores</div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-lg font-black">{identity?.following}</div>
                          <div className="text-[10px] text-[#666] uppercase font-bold">Seguindo</div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-lg font-black">{identity?.postsCount}</div>
                          <div className="text-[10px] text-[#666] uppercase font-bold">Publicações</div>
                        </div>
                        <div className="hidden sm:block">
                          <button 
                            onClick={() => setActiveTab('settings')}
                            className="bg-[#1A1A1A] text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#333] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                          >
                            Editar Perfil
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[var(--accent)]">
                          @{identity?.username}{identity?.instance ? `@${identity.instance}` : ''}
                        </span>
                        <h2 className="text-xl font-bold tracking-tighter opacity-80">{identity?.name}</h2>
                        <div className="flex items-center gap-1">
                          {(identity?.pubkey === OMNI_GENESIS_HASH || verifyGenesisIdentity(identity?.username, identity?.email).isGenesis) && (
                            <Shield className="w-5 h-5 text-yellow-500 fill-yellow-500/20" title="Criador do Protocolo" />
                          )}
                          <button 
                            onClick={() => setIsAccountSwitcherOpen(true)}
                            className="hover:bg-[#1A1A1A] p-1 rounded-full transition-colors"
                          >
                            <ChevronDown className="w-5 h-5 text-[#444]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed">{identity?.bio}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-4">
                      {identity?.website && (
                        <div className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                          <Link className="w-3 h-3" />
                          <a href={identity.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{identity.website.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {identity?.socialLinks?.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-sm text-[#666] font-medium">
                          {getSocialIcon(link.platform)}
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.platform}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Tabs */}
                <div className="border-b border-[var(--border)] flex">
                  {[
                    { id: 'posts', icon: <Grid className="w-5 h-5" /> },
                    { id: 'replies', icon: <MessageCircle className="w-5 h-5" /> },
                    { id: 'reposts', icon: <Repeat2 className="w-5 h-5" /> }
                  ].map((tab, i) => (
                    <button 
                      key={tab.id}
                      className={`flex-1 flex justify-center py-4 border-b-2 transition-all ${i === 0 ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[#444]'}`}
                    >
                      {tab.icon}
                    </button>
                  ))}
                </div>

                {/* Profile Feed (Mocked with user's own events) */}
                <div className="divide-y divide-[var(--border)]">
                  {events.filter(e => e.pubkey === identity.pubkey).map((event) => (
                    <EventCard key={event.id} event={event} identity={identity} density={layoutDensity} />
                  ))}
                  {/* Fallback if no posts */}
                  {events.filter(e => e.pubkey === identity.pubkey).length === 0 && (
                    <div className="p-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto text-[#444]">
                        <Hash className="w-8 h-8" />
                      </div>
                      <div className="text-sm text-[#444] font-bold uppercase tracking-widest">Nenhuma publicação ainda</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation (Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] z-30 lg:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 px-4 relative">
            <button onClick={() => setActiveTab('feed')} className={`p-2 ${activeTab === 'feed' ? 'text-[#00FF00]' : 'text-[#444]'}`}><Home className="w-6 h-6" /></button>
            <button onClick={() => setActiveTab('search')} className={`p-2 ${activeTab === 'search' ? 'text-[#00FF00]' : 'text-[#444]'}`}><Search className="w-6 h-6" /></button>
            
            {/* Spacer for the center button */}
            <div className="w-14"></div>
            
            {/* Floating Publish Button */}
            <button 
              onClick={() => setIsPostModalOpen(true)} 
              className="absolute left-1/2 -translate-x-1/2 -top-6 p-4 bg-[#00FF00] text-black rounded-full shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:scale-110 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>

            <button onClick={() => setActiveTab('notifications')} className={`p-2 ${activeTab === 'notifications' ? 'text-[#00FF00]' : 'text-[#444]'}`}><Bell className="w-6 h-6" /></button>
            <button 
              onClick={() => setActiveTab('profile')} 
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              className={`p-2 ${activeTab === 'profile' ? 'text-[#00FF00]' : 'text-[#444]'}`}
            >
              <img src={identity?.avatar || `https://picsum.photos/seed/${identity?.pubkey}/200/200`} className={`w-6 h-6 rounded-full border ${activeTab === 'profile' ? 'border-[#00FF00]' : 'border-transparent'}`} alt="Perfil" />
            </button>
          </div>
        </nav>

        {/* Floating Post Modal */}
        <AnimatePresence>
          {isPostModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-xl bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-4 border-b border-[#1A1A1A] flex justify-between items-center bg-[#050505]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#444]">Nova Publicação Omni</h3>
                  <button onClick={() => setIsPostModalOpen(false)} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#444] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <textarea 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="O que está acontecendo no protocolo?"
                    className="w-full h-40 bg-transparent text-lg outline-none resize-none custom-scrollbar placeholder:text-[#222]"
                  />
                  
                  {attachedMedia.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                      {attachedMedia.map((m, i) => (
                        <div key={i} className="relative group shrink-0">
                          <img src={m.url} className="w-24 h-24 object-cover rounded-xl border border-[#1A1A1A]" alt="Preview" />
                          <button 
                            onClick={() => setAttachedMedia(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1A1A1A]">
                    <div className="flex gap-4 text-[#444]">
                      <button onClick={() => fileInputRef.current?.click()} className="hover:text-[var(--accent)] transition-colors"><Image className="w-5 h-5" /></button>
                      <button className="hover:text-[var(--accent)] transition-colors"><Film className="w-5 h-5" /></button>
                      <button onClick={() => setShowPollUI(!showPollUI)} className={`hover:text-[var(--accent)] transition-colors ${showPollUI ? 'text-[var(--accent)]' : ''}`}><BarChart3 className="w-5 h-5" /></button>
                      <button onClick={generateAIPost} disabled={isGenerating} className={`hover:text-[var(--accent)] transition-colors ${isGenerating ? 'animate-spin' : ''}`}><Cpu className="w-5 h-5" /></button>
                    </div>
                    <button 
                      onClick={() => { handlePost(); setIsPostModalOpen(false); }}
                      disabled={!newPost.trim() && attachedMedia.length === 0}
                      className="bg-[var(--accent)] text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Account Switcher Modal */}
        <AnimatePresence>
          {isAccountSwitcherOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[#1A1A1A] flex justify-between items-center bg-[#050505]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#444]">Alternar Contas</h3>
                  <button onClick={() => setIsAccountSwitcherOpen(false)} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#444] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {accounts.map((acc) => (
                    <button 
                      key={acc.pubkey}
                      onClick={() => switchAccount(acc)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${acc.pubkey === identity?.pubkey ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[#1A1A1A] hover:border-[#333]'}`}
                    >
                      <img src={acc.avatar} className="w-10 h-10 rounded-full object-cover" alt={acc.name} />
                      <div className="text-left flex-1 overflow-hidden">
                        <div className="font-bold text-sm truncate">{acc.name}</div>
                        <div className="text-[10px] text-[#444] font-mono truncate">@{acc.username}@{acc.instance}</div>
                      </div>
                      {acc.pubkey === identity?.pubkey && <Shield className="w-4 h-4 text-[var(--accent)]" />}
                    </button>
                  ))}
                  <button 
                    onClick={addNewAccount}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-[#1A1A1A] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-[#444] hover:text-[var(--accent)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">Adicionar Nova Conta</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Right Column: Identity & Network Stats */}
        {viewMode === 'web' && (
          <div className="lg:col-span-4 bg-[#0A0A0A] p-8 space-y-10 hidden lg:block overflow-y-auto custom-scrollbar">
            {/* Profile Card */}
            <section className="space-y-6">
              <div className="relative group overflow-hidden rounded-3xl border border-[#1A1A1A]">
                <div className="h-24 w-full overflow-hidden">
                  <img src={identity?.cover} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Capa" />
                </div>
                <div className="px-6 pb-6 -mt-8 relative z-10">
                  <div className="flex items-end justify-between mb-4">
                    <div className="relative">
                      <img src={identity?.avatar || `https://picsum.photos/seed/${identity?.pubkey}/200/200`} className="w-20 h-20 rounded-2xl border-4 border-[#0A0A0A] grayscale group-hover:grayscale-0 transition-all duration-500" alt="Perfil" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00FF00] rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
                        <Shield className="w-3 h-3 text-black" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="bg-[#1A1A1A] text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#333] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                    >
                      Editar Perfil
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{identity?.name}</h3>
                    <div className="text-[10px] font-mono text-[var(--accent)] flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Identidade Verificada
                    </div>
                  </div>
                  
                  <p className="text-xs text-[#888] leading-relaxed mt-4">{identity?.bio}</p>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#1A1A1A]">
                    <div className="text-center">
                      <div className="text-sm font-black">{identity?.followers}</div>
                      <div className="text-[8px] text-[#444] uppercase font-bold">Seguidores</div>
                    </div>
                    <div className="text-center border-x border-[#1A1A1A]">
                      <div className="text-sm font-black">{identity?.following}</div>
                      <div className="text-[8px] text-[#444] uppercase font-bold">Seguindo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black">{identity?.postsCount}</div>
                      <div className="text-[8px] text-[#444] uppercase font-bold">Posts</div>
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  {identity?.socialLinks && identity?.socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-[#1A1A1A]">
                      {identity.socialLinks.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1A1A1A] rounded-xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all group/link"
                        >
                          <div className="text-[#444] group-hover/link:text-[var(--accent)] transition-colors">
                            {getSocialIcon(link.platform)}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#666] group-hover/link:text-white transition-colors">
                            {link.platform}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#111] border border-[#1A1A1A] p-4 rounded-xl font-mono text-[10px] break-all text-[#444]">
                <div className="text-[var(--accent)] mb-1 uppercase tracking-widest font-bold">Chave Pública Omni</div>
                {identity?.pubkey}
              </div>
            </section>

          {/* Inspetor de Eventos */}
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.section 
                key={selectedEvent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">Inspetor de Eventos</h4>
                  <button onClick={() => setSelectedEvent(null)} className="text-[9px] text-[#444] hover:text-white uppercase">Fechar</button>
                </div>
                <div className="bg-[#050505] border border-[#1A1A1A] p-4 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="w-2 h-2 bg-[#00FF00] rounded-full" />
                    <span className="text-[#00FF00]">TIPO {selectedEvent.kind}</span>
                    <span className="text-[#333]">|</span>
                    <span className="text-[#888] uppercase">{selectedEvent.id.slice(0, 12)}...</span>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-lg text-[9px] font-mono text-[#00FF00] overflow-x-auto max-h-60 custom-scrollbar">
                    <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#1A1A1A] text-[9px] font-bold uppercase py-2 rounded hover:bg-[#333] transition-colors">Copiar ID</button>
                    <button className="flex-1 bg-[#1A1A1A] text-[9px] font-bold uppercase py-2 rounded hover:bg-[#333] transition-colors">Verificar Sig</button>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-40 flex flex-col items-center justify-center border border-dashed border-[#1A1A1A] rounded-2xl text-[#222]"
              >
                <Info className="w-6 h-6 mb-2" />
                <p className="text-[9px] uppercase tracking-widest text-center px-4">Selecione um evento para inspecionar</p>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Saúde da Rede */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">Saúde da Rede</h4>
            <div className="space-y-4">
              <HealthStat label="Conectividade Relay" value="98.2%" color="text-[#00FF00]" />
              <HealthStat label="Propagação de Eventos" value="12ms" color="text-[#00FF00]" />
              <HealthStat label="Integridade da Ponte" value="Estável" color="text-blue-400" />
            </div>
          </section>

          {/* Trending Tags */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">Tendências no Omni</h4>
            <div className="flex flex-wrap gap-2">
              {['#OmniProto', '#Descentralizado', '#Fediverse', '#RelayMesh', '#Web4'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-[#111] border border-[#1A1A1A] rounded-full text-[10px] font-mono hover:border-[#00FF00] cursor-pointer transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
      </main>
      <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1A1A1A;
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #333;
          }
        `}</style>
      </>
    )}
  </div>
  );
}

function NetworkGraph({ relays, instances }: { relays: Relay[], instances: FediverseInstance[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const nodes = [
      { id: 'client', type: 'client', label: 'Cliente' },
      ...relays.map(r => ({ id: r.url, type: 'relay', label: r.url.split('//')[1] })),
      ...instances.filter(i => i.isBridged).map(i => ({ id: i.url, type: 'instance', label: i.url }))
    ];

    const links: { source: string, target: string }[] = [];
    relays.forEach(r => {
      links.push({ source: 'client', target: r.url });
      instances.filter(i => i.isBridged).forEach(i => {
        if (Math.random() > 0.5) {
          links.push({ source: r.url, target: i.url });
        }
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#1A1A1A")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", (d: any) => d.type === 'client' ? 10 : 6)
      .attr("fill", (d: any) => d.type === 'client' ? '#FFF' : d.type === 'relay' ? '#00FF00' : '#3B82F6')
      .attr("stroke", "#000")
      .attr("stroke-width", 2);

    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#444")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [relays, instances]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

function BridgeSource({ name, icon, status, onImport }: { name: string, icon: React.ReactNode, status: string, onImport: () => void }) {
  return (
    <div className="bg-[#050505] border border-[#1A1A1A] p-6 rounded-2xl flex flex-col gap-4 hover:border-[#333] transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="font-bold text-sm">{name}</div>
            <div className="text-[10px] text-[#444] uppercase tracking-widest">{status}</div>
          </div>
        </div>
        <div className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse" />
      </div>
      <button 
        onClick={onImport}
        className="w-full bg-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-[#00FF00] hover:text-black transition-all"
      >
        Importar Postagens Recentes
      </button>
    </div>
  )
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group flex flex-col items-center gap-1 transition-all shrink-0 ${active ? 'text-[#00FF00]' : 'text-[#444] hover:text-[#888]'}`}
    >
      <div className={`p-2 sm:p-3 rounded-xl transition-all ${active ? 'bg-[#00FF00]/10 shadow-[0_0_15px_rgba(0,255,0,0.1)]' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
      </div>
      <span className="hidden sm:block text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="absolute -top-[10px] sm:top-auto sm:-right-[21px] w-8 h-1 sm:w-1 sm:h-8 bg-[#00FF00] rounded-b-full sm:rounded-b-none sm:rounded-l-full" />}
    </button>
  );
}

function HealthStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-xl">
      <span className="text-[10px] uppercase font-bold text-[#444]">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Compass, Code, Server, Layout, Cpu, Sparkles, Clapperboard, MoreVertical } from 'lucide-react';

const categories = [
  { name: "All", icon: Sparkles },
  { name: "Music", icon: Code },
  { name: "Mixes", icon: Code },
  { name: "Gaming", icon: Code },
  { name: "Tech", icon: Code },
  { name: "Education", icon: Code },
  { name: "Comedy", icon: Code },
  { name: "Live", icon: Code },
  { name: "Cartoon", icon: Code },
  { name: "Anime", icon: Code },
  { name: "Beats", icon: Code },
  { name: "Phonk", icon: Code },
  { name: "Programming", icon: Code },
  { name: "Thoughts", icon: Code },
];

// YouTube Style Rich Dummy Videos for Grid Testing
const dummyVideos = [
  {
    id: '1',
    title: 'Jethalal Ne Chalaya Apna Shaitir Dimag! | FULL MOVIE | Taarak Mehta Ka Ooltah Chashmah',
    filepath: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-4309-large.mp4',
    views: '5.2M views',
    uploadedAt: '2026-07-15T10:00:00Z',
    user: { channelName: 'Taarak Mehta Ka Ooltah Chashmah' }
  },
  {
    id: '2',
    title: 'Nightwing Fight Scenes - DCAMU | Cinematic Compilation & Action Breakdown',
    filepath: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-4308-large.mp4',
    views: '135K views',
    uploadedAt: '2026-05-10T14:30:00Z',
    user: { channelName: 'Rafael Rudolph' }
  },
  {
    id: '3',
    title: 'Mix - AL NACER {Slowed + Reverb} | Bugatti Chiron Track Day Edition',
    filepath: 'https://assets.mixkit.co/videos/preview/mixkit-programmer-working-late-at-night-4311-large.mp4',
    views: '840K views',
    uploadedAt: '2026-08-01T08:15:00Z',
    user: { channelName: 'Sayfalse, NulteeX, QMIR, and more' }
  },
  {
    id: '4',
    title: 'Sam - Henson (PERFECT SPEEDUP + REVERB) Slowed | Atmospheric Synthwave Experience',
    filepath: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31910-large.mp4',
    views: '639 views',
    uploadedAt: '2026-08-14T19:45:00Z',
    user: { channelName: 'Synth Vibes' }
  }
];

// YouTube Style Shorts Data
const dummyShorts = [
  { id: 's1', title: 'Jason (Robin) never kept his promise...', views: '2.9M views', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-4308-large.mp4' },
  { id: 's2', title: 'Grow Triceps with Dumbbells Only (Fully Explained)', views: '5.8M views', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-4309-large.mp4' },
  { id: 's3', title: '5 Books That Quietly Changed Everything in My Life', views: '300K views', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-programmer-working-late-at-night-4311-large.mp4' },
  { id: 's4', title: 'Built by Anime Character 🔥 [Tokyo Revengers]', views: '22K views', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31910-large.mp4' },
  { id: 's5', title: '100% accurate! The secret behind its power...', views: '2M views', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-4309-large.mp4' },
];

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return `1 year ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return `1 month ago`;

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return `1 day ago`;

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return `1 hour ago`;

  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return `1 minute ago`;

  return 'Just now';
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    import('../services/api').then(({ fetchVideos }) => {
      fetchVideos()
        .then((data) => {
          if (data && data.length > 0) {
            setVideos(data);
          } else {
            setVideos(dummyVideos);
          }
        })
        .catch((err) => {
          console.warn("API error, loading dummy YouTube feed.", err);
          setVideos(dummyVideos);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[11px] text-zinc-500 mt-3 font-mono tracking-widest uppercase">Loading Feed...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      
      {/* YouTube Style Filter Chips Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isActive 
                  ? 'bg-white text-zinc-950 border-white font-semibold shadow-sm' 
                  : 'bg-[#27272a]/60 text-zinc-300 border-transparent hover:bg-[#3f3f46]/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {videos.map((vid) => {
          const channelName = vid.user?.channelName || "Elisha Jameel";
          const initialLetter = channelName[0].toUpperCase();

          return (
            <Link 
              to={`/watch/${vid.id}`} 
              key={vid.id} 
              className="group flex flex-col gap-3 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800/40">
                <video 
                  src={vid.filepath} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out" 
                  muted 
                  loop
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                />
                <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-mono px-1.5 py-0.5 rounded text-zinc-200">
                  16:9
                </span>
              </div>

              {/* Details */}
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                  {initialLetter}
                </div>
                <div className="flex flex-col overflow-hidden w-full pr-2">
                  <h3 className="font-semibold text-zinc-100 text-xs sm:text-sm tracking-tight line-clamp-2 group-hover:text-indigo-400 transition-colors leading-snug">
                    {vid.title}
                  </h3>
                  <span className="text-xs text-zinc-400 mt-1 hover:text-zinc-200 transition font-medium">
                    {channelName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                    <span>{vid.views || '12K views'}</span>
                    <span>•</span>
                    <span>{timeAgo(vid.uploadedAt || new Date())}</span>
                  </div>
                </div>
                <button className="text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition p-1">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {/* YouTube Style Shorts Section Divider */}
      <div className="mt-12 pt-8 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">Shorts</h2>
          </div>
          <button className="text-xs text-indigo-400 hover:underline font-semibold">View all</button>
        </div>

        {/* Shorts Horizontal Scroll Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dummyShorts.map((short) => (
            <div key={short.id} className="group flex flex-col gap-2 cursor-pointer">
              <div className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden relative border border-zinc-800/60 shadow-lg">
                <video 
                  src={short.videoUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted
                  loop
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 right-3 flex flex-col">
                  <span className="text-xs font-semibold text-white line-clamp-2 leading-tight">{short.title}</span>
                  <span className="text-[10px] text-zinc-300 mt-1 font-mono">{short.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
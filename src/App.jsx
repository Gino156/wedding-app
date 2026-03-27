import React, { useState, useEffect, useRef } from 'react';
import Webcam from "react-webcam";
import { Camera, RefreshCw, Heart, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from './supabaseClient';
import Slideshow from './Slideshow'; 

const colors = {
  bg: 'bg-zinc-950',
  text: 'text-zinc-100',
  card: 'bg-zinc-900',
  primary: 'bg-pink-600',
  primaryHover: 'hover:bg-pink-700',
};

function App() {
  const [view, setView] = useState('loading'); // loading, welcome, camera, finished, slideshow
  const [credits, setCredits] = useState(2);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guestId, setGuestId] = useState('');
  const webcamRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Check if the URL is for the Slideshow (e.g. localhost:5173/?view=slideshow)
    if (params.get('view') === 'slideshow') {
      setView('slideshow');
    } else {
      initGuest();
    }
  }, []);

  // 2. Setup Guest Identity and Check Database Credits
  const initGuest = async () => {
    let id = localStorage.getItem('wedding_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wedding_guest_id', id);
    }
    setGuestId(id);

    try {
      const { count, error } = await supabase
        .from('guest_photos')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', id);

      if (error) throw error;
      
      const remaining = 2 - (count || 0);
      setCredits(remaining);
      
      if (remaining <= 0) {
        setView('finished');
      } else {
        setView('welcome');
      }
    } catch (err) {
      console.error("Error:", err);
      setView('welcome'); // Fallback to welcome
    }
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  };

  // 3. Handle Upload to Supabase Storage and DB
  const handleSavePhoto = async () => {
    if (credits <= 0) return;
    setLoading(true);

    try {
      const blob = await fetch(imgSrc).then(res => res.blob());
      const fileName = `${guestId}/${Date.now()}.jpg`;

      // Upload file to 'wedding-pics' bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('wedding-pics')
        .upload(fileName, blob);

      if (storageError) throw storageError;

      // Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-pics')
        .getPublicUrl(fileName);

      // Save record to guest_photos table
      const { error: dbError } = await supabase
        .from('guest_photos')
        .insert([{ guest_id: guestId, photo_url: publicUrl }]);

      if (dbError) throw dbError;

      const newCredits = credits - 1;
      setCredits(newCredits);
      setImgSrc(null);

      if (newCredits <= 0) {
        setView('finished');
      } else {
        alert("Nice shot! One more left.");
      }
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING VIEWS ---

  if (view === 'slideshow') return <Slideshow />;

  if (view === 'loading') {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-8 h-8 text-pink-600" />
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center justify-center p-6 text-center`}>
        <Heart className="w-16 h-16 text-pink-600 fill-pink-600 mb-6 animate-pulse" />
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter">Gino & Lyza</h1>
        <p className="text-xl text-zinc-400 mb-10 italic font-light">Sharing our forever with you</p>
        
        <div className={`${colors.card} p-8 rounded-3xl border border-zinc-800 shadow-2xl max-w-sm w-full`}>
          <p className="mb-6 text-zinc-300">Snap a photo and it will appear on the big screen! <br/> <strong>2 shots only.</strong></p>
          <button 
            onClick={() => setView('camera')}
            className={`${colors.primary} ${colors.primaryHover} w-full py-5 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-all`}
          >
            Start Capture ({credits} left)
          </button>
        </div>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col`}>
        <header className="p-4 text-center border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <p className="font-bold text-pink-500 tracking-widest uppercase text-xs">{credits} Shots Remaining</p>
        </header>

        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md aspect-[3/4] bg-black rounded-3xl overflow-hidden relative border border-zinc-800 shadow-2xl">
            {!imgSrc ? (
              <>
                <Webcam 
                  ref={webcamRef} 
                  screenshotFormat="image/jpeg" 
                  className="w-full h-full object-cover" 
                  mirrored={true}
                  videoConstraints={{ facingMode: "user" }}
                />
                <button 
                  onClick={capture} 
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black p-6 rounded-full shadow-2xl active:scale-90 transition-all"
                >
                  <Camera className="w-8 h-8" />
                </button>
              </>
            ) : (
              <div className="w-full h-full relative">
                <img src={imgSrc} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute bottom-8 left-0 right-0 flex gap-4 px-6">
                  <button 
                    disabled={loading} 
                    onClick={() => setImgSrc(null)} 
                    className="flex-1 bg-zinc-800/90 backdrop-blur-md py-4 rounded-full font-bold border border-zinc-700"
                  >
                    Retake
                  </button>
                  <button 
                    disabled={loading} 
                    onClick={handleSavePhoto} 
                    className="flex-1 bg-pink-600 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save & Share'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (view === 'finished') {
    return (
      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center justify-center p-6 text-center`}>
        <div className="p-10 bg-zinc-900 rounded-full border-4 border-zinc-800 mb-8">
          <ImageIcon className="w-16 h-16 text-zinc-700" />
        </div>
        <h2 className="text-3xl font-bold mb-4 tracking-tight">All Captured!</h2>
        <p className="text-zinc-400 text-lg max-w-xs mx-auto">
          Thank you for being part of our story. Your photos are now being added to the slideshow!
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-10 text-zinc-600 text-sm hover:text-zinc-400 transition-colors"
        >
          Re-check Status
        </button>
      </div>
    );
  }
}

export default App;
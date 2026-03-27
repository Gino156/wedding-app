import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Heart } from 'lucide-react';

function Slideshow() {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // 1. Fetch photos and Shuffle Logic
  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('guest_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const shuffled = shuffleSmart(data);
      setPhotos(shuffled);
    }
  };

  // 2. Smart Shuffle: Bawal magtabi ang parehong guest_id
  const shuffleSmart = (array) => {
    let copy = [...array].sort(() => Math.random() - 0.5);
    let result = [];
    
    while (copy.length > 0) {
      let found = false;
      for (let i = 0; i < copy.length; i++) {
        // I-check kung ang huling nilagay sa result ay hindi kapareho ng current guest_id
        if (result.length === 0 || result[result.length - 1].guest_id !== copy[i].guest_id) {
          result.push(copy.splice(i, 1)[0]);
          found = true;
          break;
        }
      }
      // Fallback: kung wala talagang mahanap na hindi magkatabi (konti pa ang photos)
      if (!found) {
        result.push(copy.splice(0, 1)[0]);
      }
    }
    return result;
  };

  useEffect(() => {
    fetchPhotos();
    // Refresh list every 30 seconds para makuha ang mga bagong upload
    const interval = setInterval(fetchPhotos, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. Auto-play Logic
  useEffect(() => {
    if (photos.length > 0) {
      const timer = setInterval(() => {
        setFade(false); // Start fade out
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % photos.length);
          setFade(true); // Fade in
        }, 1000); // 1 second transition
      }, 5000); // 5 seconds display bawat photo

      return () => clearInterval(timer);
    }
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <Heart className="w-12 h-12 text-pink-600 animate-pulse mb-4" />
        <h1 className="text-2xl font-serif">Waiting for the first photo...</h1>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Blur (Para aesthetic) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl transition-all duration-1000"
        style={{ backgroundImage: `url(${currentPhoto.photo_url})` }}
      />

      {/* Main Photo Container */}
      <div className={`relative z-10 w-full h-full flex items-center justify-center transition-opacity duration-1000 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative max-w-[90%] max-h-[85%] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[12px] border-white rounded-sm">
          <img 
            src={currentPhoto.photo_url} 
            alt="Wedding Memory" 
            className="w-full h-full object-contain max-h-[80vh]"
          />
          {/* Label sa ilalim parang polaroid */}
          <div className="bg-white p-4 text-center">
             <p className="text-zinc-800 font-serif text-2xl">
               Captured with Love 
             </p>
          </div>
        </div>
      </div>

      {/* Floating Names */}
      <div className="absolute bottom-8 right-8 z-20 text-white flex items-center gap-3">
        <div className="text-right">
          <h2 className="text-3xl font-bold tracking-tighter">Gino & Lyza</h2>
          <p className="text-pink-500 font-mono text-sm tracking-widest uppercase">Wedding 2026</p>
        </div>
        <div className="h-12 w-[2px] bg-pink-600" />
      </div>
    </div>
  );
}

export default Slideshow;
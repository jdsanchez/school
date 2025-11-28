'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useConfig } from '@/contexts/ConfigContext';
import axios from 'axios';

interface Banner {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagen: string;
  orden: number;
  activo: boolean;
}

interface Slide {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
}

export default function LoginSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { config } = useConfig();
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const cargarBanners = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/banners`);
        if (response.data && response.data.length > 0) {
          setSlides(response.data.map((banner: Banner) => ({
            id: banner.id,
            titulo: banner.titulo,
            descripcion: banner.descripcion || '',
            imagen: banner.imagen.startsWith('http') 
              ? banner.imagen 
              : `${apiUrl.replace('/api', '')}${banner.imagen}`
          })));
        }
      } catch (error) {
        console.error('Error al cargar banners:', error);
      }
    };

    cargarBanners();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {slides.length === 0 ? (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Slides */}
          {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Imagen de fondo */}
          <div className="relative w-full h-full">
            <Image
              src={slide.imagen}
              alt={slide.titulo}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-700/80"></div>
          </div>

          {/* Contenido */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-xl">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-2xl">CO</span>
                </div>
                <h1 className="text-3xl font-bold text-white">
                  {config?.nombre_sistema || 'Class Optima'}
                </h1>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in">
                {slide.titulo}
              </h2>
              <p className="text-blue-100 text-lg animate-fade-in-delay">
                {slide.descripcion}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Indicadores */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Botones de navegación */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-20"
        aria-label="Slide anterior"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-20"
        aria-label="Slide siguiente"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
        </>
      )}
    </div>
  );
}

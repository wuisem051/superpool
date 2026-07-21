import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { doc, getDocs, setDoc, query, collection, where } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const sections = [
  { key: 'about', label: '🏢 Acerca de', placeholder: 'Escribe aquí el contenido de la sección "Acerca de"...' },
  { key: 'terms', label: '📋 Términos y Condiciones', placeholder: 'Escribe los términos y condiciones del servicio...' },
  { key: 'privacy', label: '🔒 Política de Privacidad', placeholder: 'Escribe la política de privacidad...' },
];

const ContentManagement = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [aboutContent, setAboutContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [activeTab, setActiveTab] = useState('about');

  const values = { about: aboutContent, terms: termsContent, privacy: privacyContent };
  const setters = { about: setAboutContent, terms: setTermsContent, privacy: setPrivacyContent };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(collection(db, 'settings'), where('key', '==', 'content'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const record = querySnapshot.docs[0].data();
          setAboutContent(record.about || '');
          setTermsContent(record.terms || '');
          setPrivacyContent(record.privacy || '');
        }
      } catch (err) {
        console.error(err);
        showError('Error al cargar el contenido.');
      }
    };
    fetchContent();
  }, [showError]);

  const handleSaveContent = async () => {
    try {
      const q = query(collection(db, 'settings'), where('key', '==', 'content'));
      const querySnapshot = await getDocs(q);
      const docId = !querySnapshot.empty ? querySnapshot.docs[0].id : 'content_settings';
      await setDoc(doc(db, 'settings', docId), {
        key: 'content',
        about: aboutContent,
        terms: termsContent,
        privacy: privacyContent,
        updatedAt: new Date(),
      }, { merge: true });
      showSuccess('Contenido guardado exitosamente.');
    } catch (err) {
      console.error(err);
      showError(`Error al guardar el contenido: ${err.message}`);
    }
  };

  const activeSection = sections.find(s => s.key === activeTab);
  const wordCount = values[activeTab]?.trim().split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">📝 Gestión de Contenido</h2>
        <p className="text-xs text-gray-500 mt-1">Edita el contenido de las páginas informativas del sitio.</p>
      </div>

      <div className={`rounded-2xl border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl overflow-hidden`}>
        {/* Tab Bar */}
        <div className="flex border-b border-[#1e2330] bg-[#06080c]">
          {sections.map(section => (
            <button
              key={section.key}
              onClick={() => setActiveTab(section.key)}
              className={`flex-1 px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === section.key
                  ? 'text-yellow-400 border-b-2 border-yellow-500 bg-yellow-500/5'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{activeSection.label}</h3>
            <span className="text-xs text-gray-500 font-mono">{wordCount} palabras</span>
          </div>

          <textarea
            rows="14"
            value={values[activeTab]}
            onChange={(e) => setters[activeTab](e.target.value)}
            placeholder={activeSection.placeholder}
            className="w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-yellow-500/40 transition-colors resize-none leading-relaxed"
          />

          <div className="flex justify-end">
            <button onClick={handleSaveContent}
              className="px-8 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl shadow-lg transition-all text-sm">
              Guardar Todo el Contenido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;

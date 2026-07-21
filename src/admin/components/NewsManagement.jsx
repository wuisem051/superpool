import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import { useError } from '../../context/ErrorContext';

const categoryColors = {
  General: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Actualizaciones: 'bg-green-500/10 text-green-400 border-green-500/20',
  Mantenimiento: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Eventos: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const NewsManagement = () => {
  const { darkMode } = useContext(ThemeContext);
  const { showError, showSuccess } = useError();
  const [news, setNews] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [editingNews, setEditingNews] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })));
    }, (err) => {
      console.error(err);
      showError('Error al cargar noticias.');
    });
    return () => unsubscribe();
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showError('El título y el contenido no pueden estar vacíos.');
      return;
    }
    try {
      if (editingNews) {
        await updateDoc(doc(db, 'news', editingNews.id), { title, category, content, isFeatured, updatedAt: new Date() });
        showSuccess('Noticia actualizada exitosamente.');
        setEditingNews(null);
      } else {
        await addDoc(collection(db, 'news'), { title, category, content, isFeatured, createdAt: new Date(), updatedAt: new Date() });
        showSuccess('Noticia publicada exitosamente.');
      }
      setTitle('');
      setCategory('General');
      setContent('');
      setIsFeatured(false);
    } catch (err) {
      showError(`Error al guardar noticia: ${err.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setIsFeatured(item.isFeatured);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta noticia?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
        showSuccess('Noticia eliminada.');
      } catch (err) {
        showError(`Error: ${err.message}`);
      }
    }
  };

  const inputClass = `w-full bg-[#131824] border border-[#1e2330] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">📰 Gestión de Noticias</h2>
        <p className="text-xs text-gray-500 mt-1">Publica, edita y elimina noticias que verán los usuarios en el panel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3">
            {editingNews ? '✏️ Editar Noticia' : '+ Nueva Noticia'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newsTitle" className={labelClass}>Título</label>
              <input type="text" id="newsTitle" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Título de la noticia..." />
            </div>

            <div>
              <label htmlFor="newsCategory" className={labelClass}>Categoría</label>
              <select id="newsCategory" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="General">General</option>
                <option value="Actualizaciones">Actualizaciones</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>

            <div>
              <label htmlFor="newsContent" className={labelClass}>Contenido</label>
              <textarea id="newsContent" rows="5" value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${inputClass} resize-none leading-relaxed`}
                placeholder="Escribe el contenido de la noticia..." />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-all">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                className="form-checkbox h-4 w-4 text-yellow-500 rounded bg-[#131824] border-[#1e2330]" />
              <div>
                <p className="text-sm font-semibold text-white">⭐ Destacada</p>
                <p className="text-[11px] text-gray-500">Aparecerá en primer lugar para los usuarios</p>
              </div>
            </label>

            <div className="flex gap-3 pt-2">
              {editingNews && (
                <button type="button" onClick={() => { setEditingNews(null); setTitle(''); setContent(''); setCategory('General'); setIsFeatured(false); }}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl text-sm transition-all">
                  Cancelar
                </button>
              )}
              <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-md">
                {editingNews ? 'Guardar Cambios' : 'Publicar Noticia'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-[#0b0e14] border-[#1e2330]' : 'bg-white border-gray-200'} shadow-xl`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#1e2330] pb-3 mb-4">
            Publicadas ({news.length})
          </h3>
          {news.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-2xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">No hay noticias publicadas.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {news.map((item) => (
                <div key={item.id} className="p-4 bg-[#131824] border border-[#1e2330] rounded-xl group hover:border-yellow-500/20 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-white leading-tight flex-1">{item.title}</h4>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-all" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryColors[item.category] || categoryColors.General}`}>
                      {item.category}
                    </span>
                    {item.isFeatured && <span className="text-[10px] font-bold text-yellow-500">⭐ Destacada</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.content}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{item.createdAt?.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;

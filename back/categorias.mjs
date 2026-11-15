// Postcredit: categorías e iconos acordados para el archivo personal.
// La clave se guarda en cada registro; el nombre y la unidad son para mostrar.
export const CATEGORIAS = Object.freeze([
  { id: 'peliculas', nombre: 'Películas', icono: 'claqueta', unidad: 'claquetas' },
  { id: 'libros', nombre: 'Libros', icono: 'libro', unidad: 'libros' },
  { id: 'musica', nombre: 'Música', icono: 'disco', unidad: 'discos' },
  { id: 'videojuegos', nombre: 'Videojuegos', icono: 'control', unidad: 'controles' },
  { id: 'museos', nombre: 'Museos', icono: 'museo', unidad: 'museos' },
  { id: 'restaurantes', nombre: 'Restaurantes', icono: 'plato', unidad: 'platos' },
  { id: 'viajes', nombre: 'Viajes', icono: 'avion', unidad: 'aviones' },
  { id: 'otros', nombre: 'Otros', icono: 'estrella', unidad: 'estrellas' }
].map(Object.freeze));

export const IDS_CATEGORIAS = Object.freeze(CATEGORIAS.map(categoria => categoria.id));

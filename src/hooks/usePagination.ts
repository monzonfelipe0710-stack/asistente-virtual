import { useState } from "react";

function calcularTotalDePaginas(cantidadDeElementos: number, elementosPorPagina: number) {
  const paginas = Math.ceil(cantidadDeElementos / elementosPorPagina);
  if (paginas < 1) {
    return 1;
  }
  return paginas;
}

function corregirPagina(pagina: number, totalDePaginas: number) {
  if (pagina > totalDePaginas) {
    return totalDePaginas;
  }
  return pagina;
}

export function usePagination<T>(elementos: T[], elementosPorPagina = 5) {
  const [paginaElegida, setPaginaElegida] = useState(1);

  const totalDePaginas = calcularTotalDePaginas(elementos.length, elementosPorPagina);
  const paginaActual = corregirPagina(paginaElegida, totalDePaginas);

  if (paginaActual !== paginaElegida) {
    setPaginaElegida(paginaActual);
  }

  const desde = (paginaActual - 1) * elementosPorPagina;
  const hasta = desde + elementosPorPagina;
  const elementosDeLaPagina = elementos.slice(desde, hasta);

  return {
    page: paginaActual,
    totalPages: totalDePaginas,
    paginatedItems: elementosDeLaPagina,
    setPage: setPaginaElegida,
  };
}

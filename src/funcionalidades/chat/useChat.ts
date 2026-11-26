import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./tipos";
import { calificarConsulta, consultarChat, mensajeDeError, type MensajeChat } from "@/compartido/lib/backend";

const MAX_MENSAJES = 20;
const MAX_TEXTO = 2000;

function convertirMensajes(mensajes: ChatMessage[]): MensajeChat[] {
  const historial: MensajeChat[] = [];
  for (const mensaje of mensajes) {
    if (mensaje.text.trim().length === 0) {
      continue;
    }
    let rol: MensajeChat["rol"] = "asistente";
    if (mensaje.type === "user") {
      rol = "usuario";
    }
    const item: MensajeChat = { rol, texto: mensaje.text.slice(0, MAX_TEXTO) };
    if (rol === "asistente" && mensaje.tipo) {
      item.tipo = mensaje.tipo;
    }
    historial.push(item);
  }
  return historial;
}

function armarHistorial(mensajes: ChatMessage[], pregunta: string): MensajeChat[] {
  const historial = convertirMensajes(mensajes);
  const ultimo = historial[historial.length - 1];
  const texto = pregunta.slice(0, MAX_TEXTO);
  const preguntaYaEsta = ultimo !== undefined && ultimo.rol === "usuario" && ultimo.texto === texto;
  if (!preguntaYaEsta) {
    historial.push({ rol: "usuario", texto });
  }
  return historial.slice(-MAX_MENSAJES);
}

function escaparMarkdown(texto: string): string {
  return texto.replace(/[\\[\]<>]/g, "\\$&");
}

function armarTextoDeRespuesta(respuesta: string, opciones: { nombre: string }[]): string {
  const lista = opciones.map((o) => `- ${escaparMarkdown(o.nombre)}`).join("\n");
  if (lista) {
    return `${respuesta}\n\n${lista}`;
  }
  return respuesta;
}

function calcularSiguienteId(mensajes: ChatMessage[]): number {
  const ids = mensajes.map((m) => m.id);
  return Math.max(0, ...ids) + 1;
}

export function useChat(
  inicial: ChatMessage[] = [],
  onCambio?: (mensajes: ChatMessage[]) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>(inicial);
  const [isTyping, setIsTyping] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [interrumpido, setInterrumpido] = useState(false);
  const siguienteId = useRef(calcularSiguienteId(inicial));
  const mensajesIniciales = useRef(messages);
  const mensajesActuales = useRef(messages);
  const ultimaConsulta = useRef("");
  const pedidoActual = useRef<AbortController | null>(null);

  useEffect(() => {
    mensajesActuales.current = messages;
    if (messages !== mensajesIniciales.current) onCambio?.(messages);
  }, [messages, onCambio]);

  useEffect(() => () => pedidoActual.current?.abort(), []);

  const agregar = useCallback((type: ChatMessage["type"], text: string, extra?: Partial<ChatMessage>) => {
    const mensaje: ChatMessage = {
      ...extra,
      id: siguienteId.current++,
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((anteriores) => [...anteriores, mensaje]);
  }, []);

  const preguntar = useCallback(
    async (text: string) => {
      ultimaConsulta.current = text;
      const pedido = new AbortController();
      pedidoActual.current = pedido;
      setFallo(null);
      setInterrumpido(false);
      setIsTyping(true);
      try {
        const { tipo, respuesta, opciones, consultaId, calificarToken } = await consultarChat(
          armarHistorial(mensajesActuales.current, text),
          pedido.signal
        );
        if (!pedido.signal.aborted) {
          agregar("bot", armarTextoDeRespuesta(respuesta, opciones), {
            tipo,
            consultaId: consultaId ?? null,
            calificarToken: calificarToken ?? null,
          });
        }
      } catch (error) {
        if (!pedido.signal.aborted) {
          setFallo(mensajeDeError(error, "No se pudo obtener la respuesta."));
        }
      } finally {
        if (pedidoActual.current === pedido) {
          pedidoActual.current = null;
          setIsTyping(false);
        }
      }
    },
    [agregar]
  );

  const send = useCallback(
    (text: string) => {
      agregar("user", text);
      return preguntar(text);
    },
    [agregar, preguntar]
  );

  const reintentar = useCallback(() => preguntar(ultimaConsulta.current), [preguntar]);

  // Saca la última respuesta y vuelve a hacer la misma pregunta: la nueva respuesta la reemplaza.
  const regenerar = useCallback(() => {
    const actuales = mensajesActuales.current;
    const ultimo = actuales[actuales.length - 1];
    if (!ultimo || ultimo.type !== "bot" || pedidoActual.current) return;
    const sinLaUltima = actuales.slice(0, -1);
    const pregunta = [...sinLaUltima].reverse().find((m) => m.type === "user");
    if (!pregunta) return;
    mensajesActuales.current = sinLaUltima;
    setMessages(sinLaUltima);
    return preguntar(pregunta.text);
  }, [preguntar]);

  // Lanza el error del server (por ejemplo 409 si ya se calificó) para que la pantalla lo muestre.
  const calificar = useCallback(async (id: number, calificacion: 0 | 1, motivo?: string) => {
    const mensaje = mensajesActuales.current.find((m) => m.id === id);
    if (!mensaje?.consultaId) return;
    await calificarConsulta(mensaje.consultaId, calificacion, { motivo, token: mensaje.calificarToken });
    setMessages((anteriores) => anteriores.map((m) => (m.id === id ? { ...m, calificacion } : m)));
  }, []);

  const detener = useCallback(() => {
    if (!pedidoActual.current) return;
    pedidoActual.current.abort();
    pedidoActual.current = null;
    setIsTyping(false);
    setInterrumpido(true);
  }, []);

  return { messages, isTyping, send, fallo, interrumpido, reintentar, regenerar, calificar, detener };
}

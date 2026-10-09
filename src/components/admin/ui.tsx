import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Text, TextInput } from "../common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { SigedPriority, SigedStatus } from "../../data/mockSiged";
import {
  Motion,
  Radius,
  Shadows,
  Size,
  Spacing,
  Type,
  Typography,
  useAdminColors,
  type AdminPalette,
} from "../../constants/theme";

/**
 * Piezas compartidas del panel admin, con la anatomía de pantalla v6.
 *
 * - Sin tarjetas alrededor de listas ni indicadores: el contenido vive sobre
 *   el fondo y las filas se separan con una línea de 1 px y 16 de aire.
 * - Los controles sí tienen superficie: campos rellenos de 52 (radio 16),
 *   botones de 44 a 52 (radio 12 a 16), control segmentado gris.
 * - Una sola acción azul por pantalla. Las secundarias van con contorno
 *   neutro y las destructivas en rojo.
 */

export type Tone = "brand" | "ok" | "warn" | "bad" | "info" | "muted";

export function toneColor(C: AdminPalette, tone: Tone): string {
  switch (tone) {
    case "ok":
      return C.ok;
    case "warn":
      return C.warn;
    case "bad":
      return C.bad;
    case "info":
      return C.info;
    case "muted":
      return C.faint;
    default:
      return C.brand;
  }
}

/* -------------------------------------------------------------------------- */
/* Estructura                                                                 */
/* -------------------------------------------------------------------------- */

/** El fondo de cada pantalla del panel: margen lateral de 20. */
export function AdminScreen({ children }: { children: React.ReactNode }) {
  const C = useAdminColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.canvas }}
      contentContainerStyle={{
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[1],
        paddingBottom: insets.bottom + Spacing[12],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/**
 * Agrupa contenido sin dibujar nada. `padded` deja aire arriba y abajo, como
 * el resto de los bloques de la pantalla.
 */
export function Card({
  children,
  style,
  padded = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[padded && { paddingVertical: Spacing[2] }, style]}>{children}</View>
  );
}

/** Igual que `Card`: sostiene una lista, sin envolverla en un panel. */
export function ListCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}

/** Encabezado de un bloque: título 17/600 y bajada 13; la acción va a la derecha. */
export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const C = useAdminColors();
  return (
    <View style={styles.cardHeader}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>{title}</Text>
        {!!subtitle && <Text style={[Type.meta, { color: C.muted }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/**
 * Fila de lista: línea de 1 px abajo y 16 de aire arriba y abajo. `first` se
 * acepta por compatibilidad; ya no cambia nada porque la línea va abajo.
 */
export function Row({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  first?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const C = useAdminColors();

  const content = (pressed: boolean) => [
    styles.row,
    { borderBottomColor: C.line },
    pressed && { backgroundColor: C.mist },
    style,
  ];

  if (!onPress) return <View style={content(false)}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => content(pressed)}
    >
      {children}
    </Pressable>
  );
}

/** Título de pantalla 28/34 · 600 y bajada 15/22. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const C = useAdminColors();
  return (
    <View style={{ marginBottom: Spacing[6], gap: 6 }}>
      <Text style={[Type.pageTitle, { color: C.ink }]}>{title}</Text>
      {!!description && <Text style={[Type.lead, { color: C.muted }]}>{description}</Text>}
      {!!children && <View style={styles.headerActions}>{children}</View>}
    </View>
  );
}

/** Rótulo que abre un grupo de contenido: título de sección 17/600. */
export function SectionTitle({ children }: { children: string }) {
  const C = useAdminColors();
  return (
    <Text style={[Type.cardTitle, styles.sectionTitle, { color: C.ink }]}>{children}</Text>
  );
}

/* -------------------------------------------------------------------------- */
/* Controles                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Botón.
 * - primary: azul profundo con texto blanco. Uno por pantalla.
 * - secondary: contorno neutro.
 * - ghost: texto en azul (enlace), sin superficie.
 * - danger: texto rojo, sin superficie; al confirmar se usa `dangerFill`.
 * `size="md"` es la variante de 44 con radio 12 para pares de botones.
 */
export function Btn({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dangerFill";
  size?: "lg" | "md";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useAdminColors();
  const md = size === "md";

  const filled = variant === "primary" || variant === "dangerFill";
  const fg =
    variant === "primary" || variant === "dangerFill"
      ? "#FFFFFF"
      : variant === "ghost"
        ? C.brandDeep
        : variant === "danger"
          ? C.danger
          : C.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.btn,
        {
          height: md ? Size.touch : Size.button,
          borderRadius: md ? Radius.lg : Radius.xl,
        },
        variant === "ghost" && styles.btnGhost,
        variant === "secondary" && { borderWidth: 1, borderColor: C.line },
        {
          backgroundColor: filled
            ? variant === "dangerFill"
              ? C.danger
              : pressed
                ? C.primaryHover
                : C.primary
            : pressed && variant !== "ghost"
              ? C.mist
              : "transparent",
          opacity: disabled ? 0.45 : variant === "ghost" && pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {!!icon && <Ionicons name={icon} size={20} color={fg} />}
          <Text
            style={{
              fontSize: md ? 15 : 16,
              fontWeight: filled ? Typography.semibold : Typography.medium,
              color: fg,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Campo de texto relleno: 52 de alto, radio 16, gris de superficie. Al
 * enfocarlo, borde azul, anillo de 4 px y fondo blanco. Con `icon` es el
 * buscador: 44 de alto, radio 12, lupa a la izquierda y sin anillo.
 */
export function Input(
  props: TextInputProps & { icon?: keyof typeof Ionicons.glyphMap; invalid?: boolean }
) {
  const C = useAdminColors();
  const { icon, style, invalid = false, multiline, onFocus, onBlur, ...rest } = props;
  const [focused, setFocused] = useState(false);
  const search = !!icon;

  if (search) {
    return (
      <View style={[styles.search, { backgroundColor: C.mist }]}>
        <Ionicons name="search" size={18} color={C.faint} />
        <TextInput
          placeholderTextColor={C.faint}
          style={[{ flex: 1, minWidth: 0, fontSize: 16, color: C.ink, height: Size.touch }, style]}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.ring,
        { borderColor: focused ? C.ring : "transparent" },
      ]}
    >
      <TextInput
        placeholderTextColor={C.faint}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          {
            backgroundColor: focused ? C.canvas : C.mist,
            borderColor: invalid ? C.danger : focused ? C.brand : "transparent",
            color: C.ink,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

/** Campo con etiqueta 13/500 y error en rojo debajo. Sin asteriscos. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const C = useAdminColors();
  return (
    <View style={{ gap: Spacing[2] }}>
      <Text style={[Type.metaStrong, { color: C.muted }]}>{label}</Text>
      {!!hint && <Text style={[Type.meta, { color: C.faint, marginTop: -4 }]}>{hint}</Text>}
      {children}
      {!!error && (
        <Text style={[Type.meta, { color: C.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

/**
 * Hoja inferior v6: velo al 40 %, superficie con radio 28 arriba, asa de
 * 36 × 5 y entrada desde abajo (340 ms). La usan `Select` y `common/Modal`.
 */
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const C = useAdminColors();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) return;
    y.setValue(0);
    Animated.timing(y, {
      toValue: 1,
      duration: Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [open, y]);

  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: y }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          Shadows.sheet,
          {
            backgroundColor: C.canvas,
            paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[2],
            transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }) }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: C.soft }]} />
        {children}
      </Animated.View>
    </RNModal>
  );
}

/**
 * Desplegable. React Native no tiene `<select>`: el valor se ve como un campo
 * relleno y las opciones salen en una hoja inferior.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Seleccionar…",
}: {
  value: T | "";
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const C = useAdminColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
        style={({ pressed }) => [
          styles.select,
          { backgroundColor: pressed ? C.soft : C.mist },
        ]}
      >
        <Text
          style={{ fontSize: 16, color: value ? C.ink : C.faint, flexShrink: 1 }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={C.faint} />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.selectOption,
                  { borderBottomColor: C.line, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: selected ? Typography.semibold : Typography.normal,
                    color: C.ink,
                    flexShrink: 1,
                  }}
                >
                  {opt}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={C.brand} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

/**
 * Pestaña de filtro: 44 de alto, subrayado de 2 px en azul ChatAP cuando está
 * activa y contador en Geist Mono. Las pantallas las ponen en fila.
 */
export function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const C = useAdminColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.chip, { borderBottomColor: active ? C.brand : "transparent" }]}
    >
      <Text style={{ fontSize: 15, fontWeight: "500", color: active ? C.brandDeep : C.muted }}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[Type.mono, { color: active ? C.brandDeep : C.faint }]}>{count}</Text>
      )}
    </Pressable>
  );
}

/**
 * Control segmentado: pista gris de 44 con radio 12 y 4 de relleno; la opción
 * elegida es una pastilla blanca de radio 8 (la regla concéntrica: 12 − 4).
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const C = useAdminColors();
  return (
    <View style={[styles.segmented, { backgroundColor: C.mist }]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && [{ backgroundColor: C.thumb }, Shadows.sm],
            ]}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "500", color: active ? C.ink : C.muted }}
              numberOfLines={1}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Opciones con radio en grilla de 2 columnas (separación 12): cada una es un
 * botón de 48 con radio 12, borde de 1.5 y el círculo de 16 a la izquierda.
 */
export function OptionGrid<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const C = useAdminColors();
  return (
    <View style={styles.optionGrid}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.option, { borderColor: on ? C.brand : C.line, backgroundColor: C.canvas }]}
          >
            <View style={[styles.radio, { borderColor: on ? C.brand : C.faint }]}>
              {on && <View style={[styles.radioDot, { backgroundColor: C.brand }]} />}
            </View>
            <Text style={{ fontSize: 15, fontWeight: "500", color: C.ink, flexShrink: 1 }} numberOfLines={1}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Indicadores                                                                */
/* -------------------------------------------------------------------------- */

/** Estado: punto de 6 y texto 13/500 del mismo color, sin fondo. */
export function Badge({
  label,
  tone = "brand",
  dot = true,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
}) {
  const C = useAdminColors();
  const color = toneColor(C, tone);

  return (
    <View style={styles.badge}>
      {dot && <View style={[styles.badgeDot, { backgroundColor: color }]} />}
      <Text style={[Type.metaStrong, { color }]}>{label}</Text>
    </View>
  );
}

const STATUS_TONE: Record<SigedStatus, Tone> = {
  Ingresado: "info",
  "En proceso": "warn",
  Observado: "bad",
  Finalizado: "ok",
};

export function StatusPill({ status }: { status: SigedStatus }) {
  return <Badge label={status} tone={STATUS_TONE[status] ?? "muted"} />;
}

const PRIORITY_TONE: Record<SigedPriority, Tone> = {
  Alta: "bad",
  Normal: "brand",
  Baja: "muted",
};

/** Prioridad con el mismo punto que el estado: Alta en rojo, Normal en azul, Baja en gris. */
export function PriorityDot({
  priority,
  showLabel = false,
}: {
  priority: SigedPriority;
  showLabel?: boolean;
}) {
  const C = useAdminColors();
  const color = priority === "Alta" ? C.danger : toneColor(C, PRIORITY_TONE[priority] ?? "muted");

  return (
    <View style={styles.priority}>
      <View
        style={[styles.priorityDot, { backgroundColor: color }]}
        accessibilityLabel={showLabel ? undefined : `Prioridad ${priority}`}
      />
      {showLabel && <Text style={[Type.meta, { color: C.muted }]}>{priority}</Text>}
    </View>
  );
}

/**
 * Fila de expediente: título 16/600 con el estado a la derecha, solicitante y
 * área 14, prioridad con número y fecha en Geist Mono 12, y la nota 13.
 */
export function RecordRow({
  title,
  status,
  who,
  area,
  priority,
  id,
  date,
  note,
  extra,
  onPress,
}: {
  title: string;
  status: SigedStatus;
  who: string;
  area: string;
  priority: SigedPriority;
  id: string;
  date: string;
  note?: string;
  /** Algo más en la línea de datos técnicos (p. ej. la cantidad de adjuntos). */
  extra?: React.ReactNode;
  onPress?: () => void;
}) {
  const C = useAdminColors();
  return (
    <Row onPress={onPress} accessibilityLabel={`${title}, ${status}, ${id}`}>
      <View style={styles.recordTop}>
        <Text style={[Type.rowTitle, { color: C.ink, flex: 1, minWidth: 0 }]} numberOfLines={2}>
          {title}
        </Text>
        <StatusPill status={status} />
      </View>
      <Text style={[Type.label, { fontWeight: "400", color: C.muted, marginTop: Spacing[1] }]} numberOfLines={1}>
        {who} · {area}
      </Text>
      <View style={styles.recordMeta}>
        <PriorityDot priority={priority} showLabel />
        <Text style={[Type.mono, { color: C.faint }]}>{id}</Text>
        <Text style={[Type.mono, { color: C.faint }]}>{date}</Text>
        {extra}
      </View>
      {!!note && (
        <Text style={[Type.meta, { color: C.faint, marginTop: Spacing[1] }]} numberOfLines={2}>
          {note}
        </Text>
      )}
    </Row>
  );
}

/** Contador que sube hasta el valor: deja ver que el número se acaba de calcular. */
export function CountUp({
  value,
  duration = 550,
  style,
}: {
  value: number;
  duration?: number;
  style?: StyleProp<any>;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = Date.now();
    let raf = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text style={style}>{display}</Text>;
}

/**
 * Indicador sin tarjeta: ícono de 18 en el color del estado y etiqueta 14,
 * cifra 34/40 · 600 y nota 13 en gris terciario.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  hint?: string;
}) {
  const C = useAdminColors();
  const color = toneColor(C, tone);

  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        {!!icon && <Ionicons name={icon} size={18} color={color} />}
        <Text style={[Type.label, { fontWeight: "400", color: C.muted, flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <CountUp value={value} style={[Type.figure, { color: C.ink, marginTop: Spacing[2] }]} />

      {!!hint && (
        <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
}

/** Indicadores en 2 × 2: separación de 12 entre columnas y 24 entre filas. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

/** Par etiqueta/valor en dos columnas iguales, con su línea. */
export function KeyValue({ label, value }: { label: string; value: string }) {
  const C = useAdminColors();
  return (
    <View style={[styles.keyValue, { borderBottomColor: C.line }]}>
      <Text style={{ fontSize: 15, lineHeight: 20, color: C.muted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "500", color: C.ink, flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({
  title = "Sin resultados.",
  description,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const C = useAdminColors();
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 15, color: C.muted, textAlign: "center" }}>{title}</Text>
      {!!description && (
        <Text style={[Type.meta, { color: C.faint, textAlign: "center", maxWidth: 280 }]}>
          {description}
        </Text>
      )}
      {!!action && <View style={{ marginTop: Spacing[3] }}>{action}</View>}
    </View>
  );
}

/** Bloque que late mientras carga. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = Radius.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useAdminColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: C.mist,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
        },
        style,
      ]}
    />
  );
}

/** Filas fantasma mientras no hay datos. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <Row key={i}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[3] }}>
            <Skeleton width={40} height={40} radius={Radius.full} />
            <View style={{ flex: 1, gap: Spacing[2] }}>
              <Skeleton width="60%" />
              <Skeleton width="35%" height={10} />
            </View>
          </View>
        </Row>
      ))}
    </View>
  );
}

/** Iniciales en un círculo de 40, gris de superficie. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const C = useAdminColors();
  const initials = useMemo(
    () =>
      (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join(""),
    [name]
  );

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.mist,
      }}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.35),
          fontWeight: Typography.semibold,
          color: C.muted,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingBottom: Spacing[1],
  },
  sectionTitle: {
    marginTop: Spacing[8],
    marginBottom: Spacing[1],
  },
  row: {
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
  },
  btnGhost: {
    paddingHorizontal: 0,
    height: Size.touch,
  },
  ring: {
    margin: -4,
    borderWidth: 4,
    borderRadius: Radius.xl + 4,
  },
  field: {
    minHeight: Size.input,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    fontSize: 16,
  },
  fieldMultiline: {
    minHeight: 96,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    lineHeight: 23,
    textAlignVertical: "top",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    height: Size.touch,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
    height: Size.input,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4],
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    borderTopLeftRadius: Radius["3xl"],
    borderTopRightRadius: Radius["3xl"],
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    minHeight: Size.input,
    borderBottomWidth: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: Size.touch,
    borderBottomWidth: 2,
  },
  segmented: {
    flexDirection: "row",
    height: Size.touch,
    borderRadius: Radius.lg,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  priority: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
  },
  option: {
    flexGrow: 1,
    flexBasis: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing[4],
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  recordTop: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing[3],
  },
  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing[6],
    columnGap: Spacing[3],
  },
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  keyValue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[10],
    gap: Spacing[1],
  },
});

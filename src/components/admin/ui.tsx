import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { SigedPriority, SigedStatus } from "../../data/mockSiged";
import {
  Radius,
  Shadows,
  Spacing,
  Type,
  Typography,
  useAdminColors,
  withAlpha,
  type AdminPalette,
} from "../../constants/theme";

/**
 * Piezas compartidas del panel admin.
 *
 * El sistema no dibuja recuadros. Nada de bordes alrededor de bloques, ni
 * paneles con fondo propio: todo el contenido vive sobre UNA superficie y lo
 * que lo separa es el espacio y, cuando hace falta marcar un límite, una línea
 * de un pixel. Con un marco por cada grupo todo pesaba igual y la pantalla se
 * leía como una grilla de cajas en vez de como una lista de información.
 *
 * Las dos excepciones son deliberadas:
 *
 * - Los CONTROLES conservan un relleno o un subrayado. Un botón tiene que
 *   parecer apretable y un campo tiene que parecer escribible; sacarles eso no
 *   es limpiar, es romper la usabilidad.
 * - El DIÁLOGO conserva su superficie, porque flota sobre el fondo oscurecido
 *   y sin ella no habría dónde apoyarlo.
 *
 * Reglas que siguen valiendo: el color marca estado, y los textos salen de
 * `Type` (piso de 12 px, caja normal).
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
      return C.muted;
    default:
      return C.brandDeep;
  }
}

/* -------------------------------------------------------------------------- */
/* Estructura                                                                 */
/* -------------------------------------------------------------------------- */

/** La superficie única sobre la que se apoya cada pantalla del panel. */
export function AdminScreen({ children }: { children: React.ReactNode }) {
  const C = useAdminColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[2],
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
 * Agrupa contenido sin dibujar nada. Queda para que las pantallas expresen
 * "esto va junto" sin tener que repetir márgenes a mano.
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

/** Encabezado de un bloque, con la línea que lo separa de lo que sigue. */
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
    <View style={[styles.cardHeader, { borderBottomColor: C.line }]}>
      <View style={{ flexShrink: 1 }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[Type.meta, { color: C.muted, marginTop: 2 }]}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

/**
 * Una fila de lista. La línea de arriba es lo único que la separa de la
 * anterior; `first` la omite para no abrir el bloque con una raya suelta.
 */
export function Row({
  children,
  onPress,
  first = false,
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
    !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
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
    <View style={{ marginBottom: Spacing[6] }}>
      <Text style={[Type.pageTitle, { color: C.ink }]}>{title}</Text>
      {!!description && (
        <Text style={[Type.body, { color: C.muted, marginTop: Spacing[1] }]}>
          {description}
        </Text>
      )}
      {!!children && <View style={styles.headerActions}>{children}</View>}
    </View>
  );
}

/** Rótulo que abre un grupo de contenido, con su línea. */
export function SectionTitle({ children }: { children: string }) {
  const C = useAdminColors();
  return (
    <View style={[styles.sectionTitle, { borderBottomColor: C.line }]}>
      <Text style={[Type.metaStrong, { color: C.muted }]}>{children}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Controles                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Botón. El primario y el destructivo van rellenos porque tienen que verse
 * apretables; el fantasma es texto, que es lo que corresponde a una acción
 * secundaria y no agrega otro rectángulo.
 */
export function Btn({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useAdminColors();

  const ghost = variant === "ghost";
  const bg = ghost ? "transparent" : variant === "danger" ? C.bad : C.brandDeep;
  const fg = ghost ? C.muted : "#ffffff";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.btn,
        ghost && styles.btnGhost,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ghost ? C.muted : "#ffffff"} />
      ) : (
        <>
          {!!icon && <Ionicons name={icon} size={16} color={fg} />}
          <Text style={[Type.bodyStrong, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * Campo de texto subrayado. La línea de abajo dice "acá se escribe" sin
 * encerrar el campo en una caja, y al enfocarlo se tiñe del color de marca.
 */
export function Input(props: TextInputProps & { icon?: keyof typeof Ionicons.glyphMap }) {
  const C = useAdminColors();
  const { icon, style, ...rest } = props;
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.input,
        { borderBottomColor: focused ? C.brand : C.line },
        focused && { borderBottomWidth: 1.5 },
      ]}
    >
      {!!icon && <Ionicons name={icon} size={16} color={C.faint} />}
      <TextInput
        placeholderTextColor={C.faint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[{ flex: 1, paddingVertical: Spacing[3], color: C.ink }, Type.body, style]}
        {...rest}
      />
    </View>
  );
}

/** Campo con etiqueta y mensaje de error. */
export function Field({
  label,
  error,
  required = false,
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
    <View style={{ gap: Spacing[1] }}>
      <Text style={[Type.metaStrong, { color: C.ink }]}>
        {label}
        {required ? " *" : ""}
      </Text>
      {!!hint && <Text style={[Type.meta, { color: C.faint }]}>{hint}</Text>}
      {children}
      {!!error && (
        <Text style={[Type.meta, { color: C.bad }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

/**
 * Desplegable. React Native no tiene `<select>`, así que el valor abre una
 * lista. Se ve como el campo de texto: subrayado, sin caja.
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
          { borderBottomColor: C.line, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Text
          style={[Type.body, { color: value ? C.ink : C.faint, flexShrink: 1 }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.faint} />
      </Pressable>

      <RNModal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[styles.selectSheet, { backgroundColor: C.paper }, Shadows.md]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt, i) => {
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
                      {
                        backgroundColor: pressed ? C.mist : "transparent",
                        borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                        borderTopColor: C.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        selected ? Type.bodyStrong : Type.body,
                        { color: C.ink, flexShrink: 1 },
                      ]}
                    >
                      {opt}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color={C.brand} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </RNModal>
    </>
  );
}

/**
 * Filtro. Es una pestaña de texto: la activa se marca con color y una línea
 * abajo, no con una píldora rellena. Solo para acotar lo que se ve; elegir un
 * valor dentro de un formulario usa `Segmented`.
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
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        { borderBottomColor: active ? C.brand : "transparent", opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[Type.metaStrong, { color: active ? C.brand : C.muted }]}>
        {label}
        {count !== undefined ? `  ${count}` : ""}
      </Text>
    </Pressable>
  );
}

/** Elegir UN valor dentro de un formulario. Mismo criterio: texto subrayado. */
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
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              {
                borderBottomColor: active ? C.brand : C.line,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                active ? Type.bodyStrong : Type.body,
                { color: active ? C.brand : C.muted },
              ]}
            >
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

/**
 * Estado: punto de color y texto del mismo color, sin fondo. El punto es lo
 * que se ve de reojo; el texto lo confirma para quien no distingue los tonos.
 */
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

export function PriorityDot({
  priority,
  showLabel = false,
}: {
  priority: SigedPriority;
  showLabel?: boolean;
}) {
  const C = useAdminColors();
  const color = toneColor(C, PRIORITY_TONE[priority] ?? "muted");

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
 * Dato de resumen. Sin panel ni casilla: el número es lo que se mira y el
 * ícono lo acompaña en el color del estado que representa.
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
        {!!icon && <Ionicons name={icon} size={15} color={color} />}
        <Text style={[Type.meta, { color: C.muted, flex: 1 }]} numberOfLines={2}>
          {label}
        </Text>
      </View>

      <CountUp value={value} style={[Type.figure, { color: C.ink, marginTop: Spacing[1] }]} />

      {!!hint && (
        <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
}

/** Las tarjetas de resumen en dos columnas. Estaba duplicado en cuatro pantallas. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

/** Par etiqueta/valor alineado, para las fichas de detalle. */
export function KeyValue({ label, value }: { label: string; value: string }) {
  const C = useAdminColors();
  return (
    <View style={styles.keyValue}>
      <Text style={[Type.meta, { color: C.muted, width: 108 }]}>{label}</Text>
      <Text style={[Type.body, { color: C.ink, flex: 1 }]}>{value}</Text>
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title = "Sin resultados",
  description = "No se encontraron elementos con los filtros actuales.",
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
      <Ionicons name={icon} size={34} color={C.faint} />
      <Text style={[Type.bodyStrong, { color: C.ink, marginTop: Spacing[2] }]}>
        {title}
      </Text>
      <Text style={[Type.meta, { color: C.muted, textAlign: "center", maxWidth: 280 }]}>
        {description}
      </Text>
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
        <Row key={i} first={i === 0}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing[3] }}>
            <Skeleton width={36} height={36} radius={Radius.full} />
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

/**
 * Iniciales en un círculo. Se queda porque un círculo no encierra contenido:
 * es la persona, no un marco alrededor de sus datos.
 */
export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
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
        backgroundColor: withAlpha(C.brandDeep, 0.1),
      }}
    >
      <Text
        style={{
          fontSize: size * 0.34,
          fontWeight: Typography.semibold,
          color: C.brandDeep,
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingBottom: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    paddingBottom: Spacing[2],
    marginTop: Spacing[8],
    marginBottom: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    paddingVertical: Spacing[4],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[4],
    marginTop: Spacing[4],
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
  },
  btnGhost: {
    paddingHorizontal: 0,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[4],
  },
  selectSheet: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "70%",
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  chip: {
    paddingVertical: Spacing[2],
    borderBottomWidth: 2,
  },
  segmented: {
    flexDirection: "row",
    gap: Spacing[5],
  },
  segment: {
    paddingVertical: Spacing[2],
    borderBottomWidth: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing[6],
    columnGap: Spacing[4],
  },
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
  },
  statTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    minHeight: 34,
  },
  keyValue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[10],
    gap: Spacing[1],
  },
});

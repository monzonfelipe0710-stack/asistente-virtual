import { useEffect, useRef, useState } from "react";
import { type StyleProp, type TextStyle } from "react-native";

import { Text } from "./Text";
import { useAjustes } from "@/compartido/lib/accesibilidad";

export function CountUp({
  value,
  style,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
}) {
  const { reducirAnimaciones } = useAjustes();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reducirAnimaciones) return;
    const start = Date.now();
    let frame = 0;

    function step() {
      const progress = Math.min(1, (Date.now() - start) / 550);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(from.current + (value - from.current) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reducirAnimaciones]);

  return <Text style={style}>{reducirAnimaciones ? value : shown}</Text>;
}

import { View } from "react-native";

import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { Btn } from "@/compartido/ui/Btn";
import { Text } from "@/compartido/ui/Text";

export function BloqueError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const C = useColors();
  return (
    <View style={{ marginBottom: Spacing[3], gap: Spacing[2] }}>
      <Text style={[Type.meta, { color: C.danger }]}>{mensaje}</Text>
      <Btn label="Reintentar" variant="secondary" size="md" onPress={onReintentar} />
    </View>
  );
}

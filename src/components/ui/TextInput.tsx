import { TextInput as RNTextInput, type TextInputInstance, type TextInputProps } from "react-native";

import { ESCALAS, useAjustes } from "@/lib/accesibilidad";
import { withFont } from "./Text";

export function TextInput({
  style,
  ref,
  ...rest
}: TextInputProps & { ref?: React.Ref<TextInputInstance> }) {
  const { tamanoDeTexto, letraLegible } = useAjustes();
  return (
    <RNTextInput
      ref={ref}
      {...rest}
      style={withFont(style, ESCALAS[tamanoDeTexto], letraLegible)}
    />
  );
}

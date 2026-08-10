import { TextInput as RNTextInput, type TextInputProps } from "react-native";

import { ESCALAS, useAjustes } from "@/lib/accesibilidad";
import { withFont } from "./Text";

export function TextInput({
  style,
  ref,
  ...rest
}: TextInputProps & { ref?: React.Ref<RNTextInput> }) {
  const { tamanoDeTexto, letraLegible } = useAjustes();
  return (
    <RNTextInput
      ref={ref}
      {...rest}
      style={withFont(style, ESCALAS[tamanoDeTexto], letraLegible)}
    />
  );
}

import { useTheme } from "../theme/ThemeProvider";
import { IconButton } from "./IconButton";
import { MoonIcon, SunIcon } from "./icons";

// Toggles between the dark (default) and light palette. Shows the sun while dark (tap to brighten)
// and the moon while light.
export function ThemeToggle() {
  const { isDark, toggle, colors } = useTheme();
  return (
    <IconButton onPress={toggle} accessibilityLabel="Theme umschalten">
      {isDark ? (
        <SunIcon size={20} color={colors.text} />
      ) : (
        <MoonIcon size={20} color={colors.text} />
      )}
    </IconButton>
  );
}
